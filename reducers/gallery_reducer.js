import {Platform} from 'react-native';
import {createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {isValidGpsCoords} from '../utils/gps';
import {readGpsFromExif} from '../utils/readGpsFromExif';
import {logout} from './auth_reducer';

const CAMERAROLL_INCLUDE = ['location', 'filename'];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const initialState = {
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    galleryImages: [],
    nextGalleryId: 0,
    camerarollImageFetched: false,
    lastFetchTime: null,
    hasMorePages: false,
    nextPageCursor: null,
    recencyWindowMs: SEVEN_DAYS_MS,
    dismissedUris: [], // URIs the user dismissed from the inbox
    error: null
};

/**
 * Get Photos from the CameraRoll
 *
 * @param {string} fetchType - "INITIAL" | "TIME" | "LOAD"
 * "INITIAL" -> first load (40 photos)
 * "TIME" -> photos added after initial load (up to 1000)
 * "LOAD" -> pagination on scroll (20 photos)
 */
export const getPhotosFromCameraroll = createAsyncThunk(
    'gallery/getPhotosFromCameraroll',
    async (fetchType = 'INITIAL', {getState, rejectWithValue}) => {
        const {
            gallery: {
                galleryImages,
                nextGalleryId,
                camerarollImageFetched,
                lastFetchTime,
                hasMorePages,
                nextPageCursor
            }
        } = getState();

        let camerarollData;

        const timeParams = {
            first: 1000,
            toTime: Math.floor(new Date().getTime()),
            fromTime: lastFetchTime,
            assetType: 'Photos',
            include: CAMERAROLL_INCLUDE
        };

        const initialParams = {
            first: 40,
            assetType: 'Photos',
            include: CAMERAROLL_INCLUDE
        };

        const loadParams = {
            first: 20,
            after: nextPageCursor,
            assetType: 'Photos',
            include: CAMERAROLL_INCLUDE
        };

        try {
            if (fetchType === 'REFRESH') {
                // Full re-fetch — used after permission changes on iOS
                // (newly-permitted photos may predate lastFetchTime)
                camerarollData = await CameraRoll.getPhotos(initialParams);
            } else if (
                fetchType === 'LOAD' &&
                hasMorePages &&
                nextPageCursor !== null
            ) {
                camerarollData = await CameraRoll.getPhotos(loadParams);
            } else if (
                galleryImages?.length === 0 &&
                !camerarollImageFetched &&
                lastFetchTime === null
            ) {
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
            const photos = [];
            const edges = camerarollData.edges;
            const {has_next_page: hasNextPage, end_cursor: endCursor} =
                camerarollData.page_info;

            edges.forEach(item => {
                id++;
                const image = item.node.image;
                const loc = item.node.location;

                const hasGps =
                    loc?.latitude != null &&
                    loc?.longitude != null &&
                    isValidGpsCoords(loc.latitude, loc.longitude);

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
                    customTags: [],
                    selected: false,
                    uploaded: false
                });
            });

            // EXIF fallback: for photos where CameraRoll returned no GPS,
            // read coordinates directly from EXIF data.
            // Only runs on Android where CameraRoll GPS is unreliable.
            if (Platform.OS === 'android') {
                // Skip photos whose URIs already have GPS in state
                const existingGpsUris = new Set(
                    galleryImages.filter(img => img.hasGps).map(img => img.uri)
                );

                const missingGps = photos.filter(
                    p => !p.hasGps && p.uri && !existingGpsUris.has(p.uri)
                );

                if (missingGps.length > 0) {
                    const BATCH_SIZE = 10;
                    for (let i = 0; i < missingGps.length; i += BATCH_SIZE) {
                        const batch = missingGps.slice(i, i + BATCH_SIZE);
                        const results = await Promise.allSettled(
                            batch.map(p => readGpsFromExif(p.uri))
                        );

                        batch.forEach((photo, idx) => {
                            const result = results[idx];
                            const coords =
                                result.status === 'fulfilled'
                                    ? result.value
                                    : null;
                            if (coords) {
                                photo.lat = coords.latitude;
                                photo.lon = coords.longitude;
                                photo.hasGps = true;
                            }
                        });
                    }

                    if (__DEV__) {
                        const recovered = missingGps.filter(
                            p => p.hasGps
                        ).length;
                        console.log(
                            `[GPS Debug] EXIF fallback: recovered ${recovered}/${missingGps.length} photos`
                        );
                    }
                }
            }

            if (__DEV__) {
                const total = photos.length;
                const withLocation = photos.filter(p => p.hasGps).length;
                console.log('[GPS Debug] ===== CameraRoll Fetch Summary =====');
                console.log(
                    `[GPS Debug] Platform: ${Platform.OS} ${Platform.Version}`
                );
                console.log(`[GPS Debug] FetchType: ${fetchType}`);
                console.log(`[GPS Debug] Total: ${total}`);
                console.log(`[GPS Debug] With GPS: ${withLocation}`);
                console.log(`[GPS Debug] Without GPS: ${total - withLocation}`);
            }

            return {photos, fetchType, hasNextPage, endCursor};
        } catch (error) {
            if (__DEV__) {
                console.error('Error fetching photos from camera roll:', error);
            }
            return rejectWithValue(error.message || 'Failed to fetch photos');
        }
    }
);

const gallerySlice = createSlice({
    name: 'gallery',

    initialState,

    reducers: {
        resetGallery: () => initialState,
        expandRecencyWindow(state) {
            state.recencyWindowMs += SEVEN_DAYS_MS;
        },
        dismissPhotos(state, action) {
            const uris = action.payload;
            state.dismissedUris = [...new Set([...state.dismissedUris, ...uris])];
        }
    },

    extraReducers: builder => {
        builder
            .addCase(getPhotosFromCameraroll.pending, state => {
                state.fetchStatus = 'loading';
                state.error = null;
            })

            .addCase(getPhotosFromCameraroll.fulfilled, (state, action) => {
                const newImages = action.payload.photos;

                let allImages;
                if (action.payload.fetchType === 'REFRESH') {
                    // Replace gallery with fresh data
                    allImages = newImages;
                } else {
                    const existingUris = new Set(
                        state.galleryImages.map(img => img.uri)
                    );
                    const uniqueNewImages = newImages.filter(
                        newImage => !existingUris.has(newImage.uri)
                    );
                    allImages = [...state.galleryImages, ...uniqueNewImages];
                }

                state.galleryImages = allImages;

                // Track highest assigned ID for next fetch
                if (newImages.length > 0) {
                    const maxId = newImages.reduce(
                        (max, img) => Math.max(max, img.id || 0),
                        0
                    );
                    state.nextGalleryId =
                        action.payload.fetchType === 'REFRESH'
                            ? maxId
                            : Math.max(state.nextGalleryId, maxId);
                }

                state.camerarollImageFetched = true;
                state.lastFetchTime = Math.floor(new Date().getTime());

                if (action.payload.fetchType !== 'TIME') {
                    state.hasMorePages = action.payload.hasNextPage;
                    state.nextPageCursor = action.payload.endCursor;
                }

                state.fetchStatus = 'succeeded';
            })

            .addCase(getPhotosFromCameraroll.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.payload || 'Failed to fetch images';
            })
            .addCase(logout, () => initialState);
    }
});

export const {resetGallery, expandRecencyWindow, dismissPhotos} = gallerySlice.actions;

export const selectNonGeotaggedCount = createSelector(
    state => state.gallery.galleryImages,
    images => images.filter(img => !img.hasGps).length
);

/**
 * Select geotagged photos within the recency window, sorted newest-first.
 * Window starts at 7 days and expands when user taps "Show older photos".
 * CameraRoll timestamps are in seconds — multiply by 1000 for JS Date.
 */
export const selectRecentGeotaggedPhotos = createSelector(
    state => state.gallery.galleryImages,
    state => state.gallery.recencyWindowMs,
    state => state.gallery.dismissedUris,
    (images, windowMs, dismissedUris) => {
        const cutoff = Date.now() - windowMs;
        const dismissed = new Set(dismissedUris);
        return images
            .filter(img => img.hasGps && img.date * 1000 >= cutoff && !dismissed.has(img.uri))
            .sort((a, b) => b.date - a.date);
    }
);

/**
 * Returns true if there are geotagged photos in galleryImages that are
 * older than the current recency window (i.e., expanding would show more).
 */
export const selectHasOlderGeotaggedPhotos = createSelector(
    state => state.gallery.galleryImages,
    state => state.gallery.recencyWindowMs,
    (images, windowMs) => {
        const cutoff = Date.now() - windowMs;
        return images.some(img => img.hasGps && img.date * 1000 < cutoff);
    }
);

export default gallerySlice.reducer;
