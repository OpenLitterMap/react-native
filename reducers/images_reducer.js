import axios from 'axios';
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import * as Sentry from '@sentry/react-native';
import {URL} from '../actions/types';
import {logout} from './auth_reducer';

/** Find a tag in tagsV5 by (cloId, typeId). */
const findTagV5 = (tagsV5, cloId, typeId) =>
    tagsV5.find(
        t => t.cloId === cloId && (t.typeId || null) === (typeId || null)
    );

/** Filter out a tag from tagsV5 by (cloId, typeId). */
const filterOutTagV5 = (tagsV5, cloId, typeId) =>
    tagsV5.filter(
        t => !(t.cloId === cloId && (t.typeId || null) === (typeId || null))
    );

/**
 * Classify an axios error into a structured { errorType, userMessage } object.
 * Used by all upload thunks for consistent error handling.
 */
function classifyError(error, section) {
    let errorType = 'unknown';
    let userMessage = 'Upload failed. Please try again.';

    if (!error.response) {
        // No server response — network or timeout
        if (error.code === 'ECONNABORTED') {
            errorType = 'timeout';
            userMessage =
                'Upload timed out. Check your connection and try again.';
        } else {
            errorType = 'network';
            userMessage = 'No internet connection. Please check your network.';
        }
    } else {
        const status = error.response.status;
        const msg = error.response.data?.msg || error.response.data?.message;

        if (status === 401) {
            errorType = 'unauthorized';
            userMessage = 'Session expired. Please log in again.';
        } else if (status === 422) {
            if (msg === 'photo-already-uploaded') {
                errorType = 'photo-already-uploaded';
                userMessage = 'This photo was already uploaded.';
            } else if (msg === 'invalid-coordinates') {
                errorType = 'invalid-coordinates';
                userMessage = 'Photo has invalid GPS coordinates.';
            } else {
                errorType = 'validation';
                userMessage = msg || 'Photo could not be processed.';
            }
        } else if (status >= 500) {
            errorType = 'server';
            userMessage = 'Server error. Please try again later.';
        } else {
            errorType = 'unknown';
            userMessage = msg || 'Upload failed. Please try again.';
        }

        Sentry.captureException(
            new Error(JSON.stringify(error.response.data)),
            {
                level: 'error',
                tags: {section, errorType, status: String(status)}
            }
        );
    }

    return {errorType, userMessage};
}

const initialState = {
    imagesArray: [],
    swiperIndex: 0,

    // Upload progress
    totalToUpload: 0,
    uploaded: 0,
    uploadFailed: 0,
    tagged: 0,
    taggedFailed: 0,

    // Upload phase tracking
    uploadPhase: 'idle', // 'idle' | 'uploading' | 'tagging'
    currentUploadIndex: 0,
    uploadAbortReason: null, // null | 'token-expired' | 'cancelled'

    errorMessage: '',
    failedCounts: {
        alreadyUploaded: 0,
        invalidCoordinates: 0,
        timeout: 0,
        network: 0,
        server: 0,
        unknown: 0
    }
};

/**
 * API Requests
 * - getUntaggedImages
 * - uploadImage
 * - postTagsToPhoto
 * - editTagsOnPhoto
 */

export const getUntaggedImages = createAsyncThunk(
    'images/getUntaggedImages',
    async ({token, platform}, {rejectWithValue}) => {
        try {
            const params = {};
            if (platform) {
                params.platform = platform;
            }

            const response = await axios({
                url: `${URL}/api/v2/photos/get-untagged-uploads`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params
            });

            if (response?.data?.photos?.length > 0) {
                return {
                    images: response.data.photos
                };
            } else {
                return rejectWithValue('No photos found');
            }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network Error'
            );
        }
    }
);

export const uploadImage = createAsyncThunk(
    'images/uploadImage',
    async (
        {token, imageData, imageId, imageUri, enableAdminTagging, photoHasTags},
        {rejectWithValue}
    ) => {
        try {
            const response = await axios({
                url: URL + '/api/photos/upload/with-or-without-tags',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                data: imageData
            });

            if (response.data?.success) {
                return {
                    imageId,
                    imageUri,
                    photo_id: response.data.photo_id,
                    enableAdminTagging,
                    photoHasTags
                };
            } else {
                return rejectWithValue({
                    errorType: 'unknown',
                    userMessage: 'Upload failed with no success flag'
                });
            }
        } catch (error) {
            return rejectWithValue(classifyError(error, 'image_upload'));
        }
    }
);

/**
 * Post tags to a photo using the v3 API.
 *
 * Expects { token, photoId, tags, pickedUp } where tags is an array of
 * resolved tag objects: [{ object: {id, key}, category: {id, key}, quantity, picked_up, materials: [], brands: [], custom_tags: [] }]
 */
export const postTagsToPhoto = createAsyncThunk(
    'images/postTagsToPhoto',
    async ({token, photoId, tags, pickedUp}, {rejectWithValue}) => {
        try {
            const response = await axios.post(
                `${URL}/api/v3/tags`,
                {
                    photo_id: photoId,
                    tags,
                    picked_up: pickedUp ? 1 : 0
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Accept any 2xx or explicit success flag
            if (response.status >= 200 && response.status < 300) {
                return {photoId};
            } else {
                return rejectWithValue({
                    errorType: 'unknown',
                    userMessage: 'Failed to post tags'
                });
            }
        } catch (error) {
            return rejectWithValue(classifyError(error, 'post_tags_v3'));
        }
    }
);

/**
 * Replace ALL tags on a photo using PUT /api/v3/tags (full replace, not merge).
 * The backend deletes existing tags, resets XP, then adds the new set atomically.
 * Send the COMPLETE set of tags — not just changes.
 */
export const editTagsOnPhoto = createAsyncThunk(
    'images/editTagsOnPhoto',
    async ({token, photoId, tags, pickedUp}, {rejectWithValue}) => {
        try {
            const response = await axios.put(
                `${URL}/api/v3/tags`,
                {
                    photo_id: photoId,
                    tags,
                    picked_up: pickedUp ? 1 : 0
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status >= 200 && response.status < 300) {
                return {photoId, photoTags: response.data.photoTags};
            } else {
                return rejectWithValue({
                    errorType: 'unknown',
                    userMessage: 'Failed to edit tags'
                });
            }
        } catch (error) {
            return rejectWithValue(classifyError(error, 'edit_tags_v3'));
        }
    }
);

const imagesSlice = createSlice({
    name: 'images',

    initialState,

    reducers: {
        /**
         * Add images from Camera, Gallery or Web to state
         */
        addImages(state, action) {
            const images = action.payload.images;
            if (!images) return;

            const existingIds = new Set(state.imagesArray.map(img => img.id));
            const existingUris = new Set(
                state.imagesArray.filter(img => img.uri).map(img => img.uri)
            );

            images.forEach(image => {
                const isDuplicate =
                    image.platform === 'mobile' && !image.uploaded
                        ? existingUris.has(image.uri)
                        : existingIds.has(image.id);

                if (!isDuplicate) {
                    state.imagesArray.push({
                        id: image.id,
                        date: image.date ?? null,
                        lat: image.lat ?? null,
                        lon: image.lon ?? null,
                        filename: image.filename,
                        uri: image.uri,
                        type: image.type, // gallery, camera, or web
                        platform: image.platform, // web or mobile

                        tags: image.tags,
                        tagsV5: [],
                        customTags: image.customTags,
                        picked_up: action.payload.picked_up,

                        selected: false,
                        uploaded: image.uploaded
                    });
                }
            });
        },

        /**
         * Change the swiperIndex (which image is currently selected).
         */
        changeSwiperIndex(state, action) {
            state.swiperIndex = action.payload;
        },

        /**
         * V5 tagging: Add a tag by cloId (+ optional typeId) to the current image.
         * payload = { imageIndex, cloId, typeId? }
         * If the same (cloId, typeId) already exists, increment quantity by 1.
         */
        addTagV5(state, action) {
            const {imageIndex, cloId, typeId} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image) {
                return;
            }

            if (!image.tagsV5) {
                image.tagsV5 = [];
            }

            const existing = findTagV5(image.tagsV5, cloId, typeId);
            if (existing) {
                existing.quantity += 1;
            } else {
                const tag = {
                    cloId,
                    quantity: 1,
                    materials: [],
                    brands: [],
                    customTags: []
                };
                if (typeId) {
                    tag.typeId = typeId;
                }
                image.tagsV5.push(tag);
            }
        },

        /**
         * V5 tagging: Remove a tag by (cloId, typeId) from the current image.
         * payload = { imageIndex, cloId, typeId? }
         */
        removeTagV5(state, action) {
            const {imageIndex, cloId, typeId} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image || !image.tagsV5) {
                return;
            }

            image.tagsV5 = filterOutTagV5(image.tagsV5, cloId, typeId);
        },

        /**
         * V5 tagging: Set exact quantity for a tag.
         * payload = { imageIndex, cloId, typeId?, quantity }
         * Removes the tag if quantity <= 0.
         */
        updateTagQuantityV5(state, action) {
            const {imageIndex, cloId, typeId, quantity} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image || !image.tagsV5) {
                return;
            }

            if (quantity <= 0) {
                image.tagsV5 = filterOutTagV5(image.tagsV5, cloId, typeId);
            } else {
                const tag = findTagV5(image.tagsV5, cloId, typeId);
                if (tag) {
                    tag.quantity = quantity;
                }
            }
        },

        /**
         * V5 tagging: Toggle picked_up on a single image by index.
         * payload = imageIndex
         */
        togglePickedUpByIndex(state, action) {
            const image = state.imagesArray[action.payload];
            if (image) {
                image.picked_up = !image.picked_up;
            }
        },

        /**
         * Toggle a material on/off for a specific tag.
         * payload = { imageIndex, cloId, typeId?, materialId }
         */
        toggleMaterialOnTag(state, action) {
            const {imageIndex, cloId, typeId, materialId} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.tagsV5) return;

            const tag = findTagV5(image.tagsV5, cloId, typeId);
            if (!tag) return;

            if (!tag.materials) tag.materials = [];
            const idx = tag.materials.indexOf(materialId);
            if (idx !== -1) {
                tag.materials.splice(idx, 1);
            } else {
                tag.materials.push(materialId);
            }
        },

        /**
         * Add a brand to a specific tag.
         * payload = { imageIndex, cloId, typeId?, brandId }
         */
        addBrandToTag(state, action) {
            const {imageIndex, cloId, typeId, brandId} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.tagsV5) return;

            const tag = findTagV5(image.tagsV5, cloId, typeId);
            if (!tag) return;

            if (!tag.brands) tag.brands = [];
            if (!tag.brands.some(b => b.id === brandId)) {
                tag.brands.push({id: brandId, quantity: 1});
            }
        },

        /**
         * Remove a brand from a specific tag.
         * payload = { imageIndex, cloId, typeId?, brandId }
         */
        removeBrandFromTag(state, action) {
            const {imageIndex, cloId, typeId, brandId} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.tagsV5) return;

            const tag = findTagV5(image.tagsV5, cloId, typeId);
            if (!tag?.brands) return;

            tag.brands = tag.brands.filter(b => b.id !== brandId);
        },

        /**
         * Add a custom tag string to a specific tag.
         * payload = { imageIndex, cloId, typeId?, text }
         */
        addCustomTagToTag(state, action) {
            const {imageIndex, cloId, typeId, text} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.tagsV5 || !text?.trim()) return;

            const tag = findTagV5(image.tagsV5, cloId, typeId);
            if (!tag) return;

            if (!tag.customTags) tag.customTags = [];
            const trimmed = text.trim();
            if (!tag.customTags.includes(trimmed)) {
                tag.customTags.push(trimmed);
            }
        },

        /**
         * Remove a custom tag string from a specific tag.
         * payload = { imageIndex, cloId, typeId?, text }
         */
        removeCustomTagFromTag(state, action) {
            const {imageIndex, cloId, typeId, text} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.tagsV5) return;

            const tag = findTagV5(image.tagsV5, cloId, typeId);
            if (!tag?.customTags) return;

            tag.customTags = tag.customTags.filter(t => t !== text);
        },

        /**
         * Add an image-level custom tag string.
         * payload = { imageIndex, text }
         */
        addImageCustomTag(state, action) {
            const {imageIndex, text} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image || !text?.trim()) return;

            if (!image.customTags) {
                image.customTags = [];
            }

            const trimmed = text.trim();
            if (!image.customTags.includes(trimmed)) {
                image.customTags.push(trimmed);
            }
        },

        /**
         * Remove an image-level custom tag string.
         * payload = { imageIndex, text }
         */
        removeImageCustomTag(state, action) {
            const {imageIndex, text} = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image?.customTags) return;

            image.customTags = image.customTags.filter(t => t !== text);
        },

        cancelUploadImages(state) {
            state.isUploading = false;
        },

        /**
         * Changes litter picked up status of all images
         */
        changeLitterStatus(state, action) {
            state.imagesArray.forEach(img => (img.picked_up = action.payload));
        },

        /**
         * After setting enable_admin_tagging changes to False,
         *
         * We want to clear the users uploaded un-tagged images.
         */
        clearUploadedWebImages(state) {
            state.imagesArray = state.imagesArray.filter(img => {
                return (
                    img.type?.toLowerCase() === 'web' &&
                    img.hasOwnProperty('photoId')
                );
            });
        },

        /**
         * Delete image from HomeScreen by id
         */
        deleteImage(state, action) {
            const index = state.imagesArray.findIndex(
                delImg => delImg.id === action.payload
            );

            if (index !== -1) {
                state.imagesArray.splice(index, 1);
            }
        },

        /**
         * Delete selected images -- all images with property selected set to true
         */
        deleteSelectedImages(state, action) {
            state.imagesArray = state.imagesArray.filter(img => !img.selected);

            state.selected = 0;
        },

        /**
         * When HomeScreen.isSelecting is turned off,
         *
         * Change selected value on every image to false
         */
        deselectAllImages(state) {
            state.imagesArray.forEach(image => {
                image.selected = false;
            });
        },

        resetUploadState(state) {
            state.isUploading = false;
            state.showThankYouMessages = false;
            state.totalToUpload = 0;
            state.uploaded = 0;
            state.uploadFailed = 0;
            state.tagged = 0;
            state.taggedFailed = 0;
            state.uploadPhase = 'idle';
            state.currentUploadIndex = 0;
            state.uploadAbortReason = null;
            state.errorMessage = '';
            state.failedCounts = {
                alreadyUploaded: 0,
                invalidCoordinates: 0,
                timeout: 0,
                network: 0,
                server: 0,
                unknown: 0
            };
        },

        setTotalToUpload(state, action) {
            state.totalToUpload = action.payload;
        },

        setUploadPhase(state, action) {
            state.uploadPhase = action.payload;
        },

        setCurrentUploadIndex(state, action) {
            state.currentUploadIndex = action.payload;
        },

        setUploadAbortReason(state, action) {
            state.uploadAbortReason = action.payload;
        },

        /**
         * toggles picked_up status on an image based on id
         */
        togglePickedUp(state, action) {
            const imageIndex = state.imagesArray.findIndex(
                image => image.id === action.payload
            );

            if (imageIndex !== -1) {
                state.imagesArray[imageIndex].picked_up =
                    !state.imagesArray[imageIndex].picked_up;
            }
        },

        /**
         * Toggles isSelecting -- selecting images for deletion
         */
        toggleSelecting(state) {
            state.selected = 0;
        },

        /**
         * toggle selected property of a image object
         */
        toggleSelectedImages(state, action) {
            state.imagesArray[action.payload].selected =
                !state.imagesArray[action.payload].selected;
        },

        /**
         * After an untagged image was uploaded,
         *
         * If user.enable_admin_tagging is false,
         * Update the image as uploaded which will show a cloud emoji
         */
        updateImageAsUploaded(state, action) {}
    },

    extraReducers: builder => {
        builder

            .addCase(getUntaggedImages.fulfilled, (state, action) => {
                if (!action.payload.images) return;

                const existingIds = new Set(state.imagesArray.map(img => img.id));
                const existingUris = new Set(
                    state.imagesArray.filter(img => img.uri).map(img => img.uri)
                );

                action.payload.images.forEach(image => {
                    // Check if already present
                    const isDuplicate =
                        image.platform === 'mobile' && !image.uploaded
                            ? existingUris.has(image.uri)
                            : existingIds.has(image.id);

                    if (!isDuplicate) {
                        state.imagesArray.push({
                            id: image.id,
                            date: image.date ?? null,
                            lat: image.lat ?? null,
                            lon: image.lon ?? null,
                            filename: image.filename,
                            uri: null,
                            type: image.type || image.platform || 'web',
                            platform: image.platform ?? 'web',

                            tags: {},
                            tagsV5: [],
                            customTags: [],
                            picked_up: image.remaining === 0,

                            selected: false,
                            uploaded: true
                        });
                    }
                });
            })

            // Upload Image
            .addCase(uploadImage.pending, state => {
                // nothing yet
            })
            .addCase(uploadImage.fulfilled, (state, action) => {
                const {imageId, imageUri, photo_id} = action.payload;

                // Find the exact image — match by URI (unique) when
                // available, falling back to ID for web images.
                const index = state.imagesArray.findIndex(img =>
                    imageUri
                        ? img.uri === imageUri
                        : img.id === imageId
                );

                if (index !== -1) {
                    state.imagesArray[index].id = photo_id;
                    state.imagesArray[index].type = 'web';
                    state.imagesArray[index].uploaded = true;
                }

                state.uploaded++;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                const {errorType} = action.payload || {errorType: 'unknown'};

                state.uploadFailed += 1;
                state.errorMessage = errorType;

                switch (errorType) {
                    case 'photo-already-uploaded':
                    state.failedCounts.alreadyUploaded += 1;
                    break;
                    case 'invalid-coordinates':
                    state.failedCounts.invalidCoordinates += 1;
                    break;
                    case 'timeout':
                    state.failedCounts.timeout += 1;
                    break;
                    case 'network':
                    state.failedCounts.network += 1;
                    break;
                    case 'server':
                    state.failedCounts.server += 1;
                    break;
                    default:
                    state.failedCounts.unknown += 1;
                }
            })

            // Post Tags V3
            .addCase(postTagsToPhoto.fulfilled, (state, action) => {
                const {photoId} = action.payload;
                state.imagesArray = state.imagesArray.filter(
                    img => img.id !== photoId
                );
                state.tagged++;
            })
            .addCase(postTagsToPhoto.rejected, (state, action) => {
                const {errorType} = action.payload || {errorType: 'unknown'};
                state.taggedFailed++;
                state.errorMessage = errorType;
            })

            // Edit Tags V3 (PUT — full replace)
            .addCase(editTagsOnPhoto.fulfilled, (state, action) => {
                // Photo stays in uploads — tags were replaced, not removed
            })
            .addCase(editTagsOnPhoto.rejected, (state, action) => {
                const {errorType} = action.payload || {errorType: 'unknown'};
                state.errorMessage = errorType;
            })

            // Clear all images on logout
            .addCase(logout, () => initialState);
    }
});

export const {
    addBrandToTag,
    addCustomTagToTag,
    addImageCustomTag,
    addImages,
    addTagV5,
    cancelUploadImages,
    changeLitterStatus,
    changeSwiperIndex,
    clearUploadedWebImages,
    deleteImage,
    deleteSelectedImages,
    deselectAllImages,
    removeBrandFromTag,
    removeCustomTagFromTag,
    removeImageCustomTag,
    removeTagV5,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    toggleMaterialOnTag,
    togglePickedUp,
    togglePickedUpByIndex,
    toggleSelecting,
    toggleSelectedImages,
    updateImageAsUploaded,
    updateTagQuantityV5
} = imagesSlice.actions;

export default imagesSlice.reducer;
