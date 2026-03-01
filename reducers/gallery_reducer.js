import { Platform } from 'react-native';
import { createSlice } from '@reduxjs/toolkit';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { createAsyncThunk } from '@reduxjs/toolkit';
import { read as readExif } from '@lodev09/react-native-exify';
import { logout } from './auth_reducer';

/**
 * For photos where CameraRoll returns no GPS, attempt to read
 * coordinates directly from the file's EXIF data.
 *
 * Uses @lodev09/react-native-exify which correctly calls
 * MediaStore.setRequireOriginal() on Android 10+ for unredacted EXIF.
 */
const readGpsFromExif = async (uri) => {
    try {
        const tags = await readExif(uri);
        if (
            tags?.GPSLatitude != null &&
            tags?.GPSLongitude != null &&
            (tags.GPSLatitude !== 0 || tags.GPSLongitude !== 0)
        ) {
            return { latitude: tags.GPSLatitude, longitude: tags.GPSLongitude };
        }
    } catch (e) {
        if (__DEV__) {
            console.warn(`[GPS Debug] EXIF read failed for ${uri}:`, e.message);
        }
    }
    return null;
};

const initialState = {
    imagesLoading: false,
    galleryImages: [],
    nextGalleryId: 0,
    geotaggedCount: 0,
    nonGeotaggedCount: 0,
    camerarollImageFetched: false,
    lastFetchTime: null,
    isNextPageAvailable: false,
    lastImageCursor: null
};

/**
 * Get Photos from the CameraRoll
 *
 * initial load -- Home Page -- fetch 1000
 *      sets state -- array of geotaggged
 *                 -- camerarollImageFetched - true
 *                 -- lastFetchTime
 *
 * next fetch - Album screen or Home screen
 * if lastFetch !== null fetch images between lastFetch and Date.now()
 *
 * @param {string} - fetchType --> "INITIAL" | "TIME" | "LOAD"
 * "INITIAL" -> first load
 * "TIME" -> images added to cameraroll/phone gallery after initial load
 * "LOAD" -> loads more images on scroll after initial load
 */
export const getPhotosFromCameraroll = createAsyncThunk(
    'gallery/getPhotosFromCameraroll',
    async (fetchType = 'INITIAL', { getState, rejectWithValue }) => {

        const {
            gallery: {
                galleryImages,
                nextGalleryId,
                camerarollImageFetched,
                lastFetchTime,
                imagesLoading,
                isNextPageAvailable,
                lastImageCursor
            },
            auth: { user }
        } = getState();

        let camerarollData;

        const timeParams = {
            first: 1000,
            toTime: Math.floor(new Date().getTime()),
            fromTime: lastFetchTime,
            assetType: 'Photos',
            include: ['location', 'filename', 'fileSize', 'imageSize']
        };

        const initialParams = {
            first: 40,
            assetType: 'Photos',
            include: ['location', 'filename', 'fileSize', 'imageSize']
        };

        const loadParams = {
            first: 20,
            after: lastImageCursor,
            assetType: 'Photos',
            include: ['location', 'filename', 'fileSize', 'imageSize']
        };

        try
        {
            if (fetchType === 'LOAD' && isNextPageAvailable && lastImageCursor !== null) {
                camerarollData = await CameraRoll.getPhotos(loadParams);
            } else if (galleryImages?.length === 0 && !camerarollImageFetched && lastFetchTime === null) {
                camerarollData = await CameraRoll.getPhotos(initialParams);
                fetchType = 'INITIAL';
            } else if (lastFetchTime !== null) {
                camerarollData = await CameraRoll.getPhotos(timeParams);
                fetchType = 'TIME';
            }

            if (!camerarollData) {
                return rejectWithValue('No new photos fetched');
            }

            let id = nextGalleryId;
            let photos = [];
            const imagesArray = camerarollData.edges;
            const { has_next_page: hasNextPage, end_cursor: endCursor } = camerarollData.page_info;

            imagesArray.forEach(item => {
                id++;
                const image = item.node.image;
                const loc = item.node.location;

                const hasGps = !!(
                    loc?.latitude &&
                    loc?.longitude &&
                    loc.latitude !== 0 &&
                    loc.longitude !== 0
                );

                photos.push({
                    id,
                    date: item.node.timestamp,
                    lat: hasGps ? loc.latitude : null,
                    lon: hasGps ? loc.longitude : null,
                    hasGps,
                    filename: image.filename,
                    uri: image.uri,
                    type: 'gallery',
                    platform: 'mobile',
                    tags: {},
                    customTags: [],
                    selected: false,
                    uploaded: false
                });
            });

            // EXIF fallback: for photos where CameraRoll returned no GPS,
            // attempt to read coordinates directly from the file's EXIF data.
            // Only runs on Android where CameraRoll GPS is unreliable.
            if (Platform.OS === 'android') {
                const missingGps = photos.filter(p => !p.hasGps && p.uri);

                if (missingGps.length > 0) {
                    const BATCH_SIZE = 10;
                    for (let i = 0; i < missingGps.length; i += BATCH_SIZE) {
                        const batch = missingGps.slice(i, i + BATCH_SIZE);
                        const results = await Promise.all(
                            batch.map(p => readGpsFromExif(p.uri))
                        );

                        batch.forEach((photo, idx) => {
                            const coords = results[idx];
                            if (coords) {
                                photo.lat = coords.latitude;
                                photo.lon = coords.longitude;
                                photo.hasGps = true;
                            }
                        });
                    }

                    if (__DEV__) {
                        const recovered = missingGps.filter(p => p.hasGps).length;
                        console.log(`[GPS Debug] EXIF fallback: recovered ${recovered}/${missingGps.length} photos`);
                    }
                }
            }

            if (__DEV__) {
                const total = photos.length;
                const withLocation = photos.filter(p => p.hasGps).length;
                const withoutLocation = total - withLocation;

                console.log('[GPS Debug] ===== CameraRoll Fetch Summary =====');
                console.log(`[GPS Debug] Platform: ${Platform.OS} ${Platform.Version}`);
                console.log(`[GPS Debug] FetchType: ${fetchType}`);
                console.log(`[GPS Debug] Total photos: ${total}`);
                console.log(`[GPS Debug] With valid location: ${withLocation}`);
                console.log(`[GPS Debug] Without location: ${withoutLocation}`);
            }

            return { photos, fetchType, hasNextPage, endCursor };

        } catch (error) {
            console.error('Error fetching photos from camera roll:', error);
            return rejectWithValue(error.message || 'Failed to fetch photos');
        }
    }
);


const gallerySlice = createSlice({

    name: 'gallery',

    initialState,

    reducers: {
        /**
         * The users images have finished loading
         */
        toggleImagesLoading (state, action) {
            state.imagesLoading = action.payload;
        },

        // /**
        //  * add array of geotagged images to state
        // */
        // addGeotaggedImages (state, action) {
        //     state.geotaggedImages = [
        //         ...action.payload.geotagged,
        //         ...state.geotaggedImages
        //     ];
        //     state.camerarollImageFetched = true;
        //     state.lastFetchTime = Math.floor(new Date().getTime());
        //     state.imagesLoading = false;
        //     if (action.payload.fetchType !== 'TIME') {
        //         state.isNextPageAvailable = action.payload.hasNextPage;
        //         state.lastImageCursor = action.payload.endCursor;
        //     }
        // }
    },

    extraReducers: (builder) => {

        builder

            .addCase(getPhotosFromCameraroll.pending, (state) => {
                state.imagesLoading = true;
                state.error = null;
            })

            .addCase(getPhotosFromCameraroll.fulfilled, (state, action) => {
                const newImages = action.payload.photos;
                const existingUris = new Set(state.galleryImages.map(img => img.uri));

                // Filter out new images that are already in existingImages
                const uniqueNewImages = newImages.filter(
                    newImage => !existingUris.has(newImage.uri)
                );

                const allImages = [...state.galleryImages, ...uniqueNewImages];
                state.galleryImages = allImages;

                // Track highest assigned ID for next fetch
                if (newImages.length > 0) {
                    const maxId = newImages.reduce((max, img) => Math.max(max, img.id || 0), 0);
                    state.nextGalleryId = Math.max(state.nextGalleryId, maxId);
                }
                state.geotaggedCount = allImages.filter(img => img.hasGps).length;
                state.nonGeotaggedCount = allImages.length - state.geotaggedCount;
                state.camerarollImageFetched = true;
                state.lastFetchTime = Math.floor(new Date().getTime());
                state.hasNextPage = action.payload.hasNextPage;
                state.endCursor = action.payload.endCursor;

                if (action.payload.fetchType !== 'TIME') {
                    state.isNextPageAvailable = action.payload.hasNextPage;
                    state.lastImageCursor = action.payload.endCursor;
                }

                state.imagesLoading = false;
            })

            .addCase(getPhotosFromCameraroll.rejected, (state, action) => {
                state.imagesLoading = false;
                state.error = action.payload || 'Failed to fetch images';
            })
            .addCase(logout, () => initialState);

    }
});

export const { toggleImagesLoading, addGeotaggedImages } = gallerySlice.actions;

export default gallerySlice.reducer;
