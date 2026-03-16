import {createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {classifyError} from '../utils/classifyError';
import {logout} from './auth_reducer';

/** Find a tag in tags by (cloId, typeId). */
const findTag = (tags, cloId, typeId) =>
    tags.find(
        t => t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null)
    );

/** Filter out a tag from tags by (cloId, typeId). */
const filterOutTag = (tags, cloId, typeId) =>
    tags.filter(
        t => !(t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null))
    );

/** Backend regex for custom tag validation: word chars, spaces, colons, hyphens */
const CUSTOM_TAG_REGEX = /^[\w\s:-]+$/;

/**
 * Resolve target image for tag actions.
 * If editingPhoto exists, returns it (edit mode from My Uploads).
 * Otherwise returns imagesArray[imageIndex] (normal tagging flow).
 */
const getTargetImage = (state, imageIndex) => {
    if (state.editingPhoto) {
        return state.editingPhoto;
    }
    return state.imagesArray[imageIndex];
};

const initialState = {
    imagesArray: [],
    editingPhoto: null, // Separate slot for My Uploads edit mode — not persisted, doesn't affect HomeScreen
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

    failedCounts: {
        alreadyUploaded: 0,
        invalidCoordinates: 0,
        timeout: 0,
        network: 0,
        server: 0,
        unknown: 0
    },

    // Custom tag validation feedback (null = no error)
    customTagError: null
};

/**
 * API Requests
 * - uploadImage
 * - postTagsToPhoto
 */

export const uploadImage = createAsyncThunk(
    'images/uploadImage',
    async (
        {
            imageData,
            photoId,
            imageUri,
            enableAdminTagging,
            photoHasTags,
            signal
        },
        {getState, rejectWithValue}
    ) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/v3/upload', {
                token,
                data: imageData,
                headers: {'Content-Type': 'multipart/form-data'},
                signal
            });

            if (!response.data?.success) {
                return rejectWithValue({
                    errorType: 'unknown',
                    userMessage: 'Upload failed with no success flag'
                });
            }

            return {
                photoId,
                imageUri,
                serverPhotoId: response.data.photo_id,
                enableAdminTagging,
                photoHasTags
            };
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
    async ({photoId, tags, signal}, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/v3/tags', {
                token,
                data: {
                    photo_id: photoId,
                    tags
                },
                signal
            });

            return {photoId};
        } catch (error) {
            return rejectWithValue(classifyError(error, 'post_tags_v3'));
        }
    }
);


/** Build dedup sets from current state for O(1) lookups. */
const buildDedupSets = state => {
    const uris = new Set();
    const ids = new Set();
    for (const img of state.imagesArray) {
        if (img.uri) {
            uris.add(img.uri);
        }
        if (img.id != null) {
            ids.add(img.id);
        }
    }
    return {uris, ids};
};

/** Check if image already exists using pre-built dedup sets. */
const isDuplicate = (dedupSets, image) => {
    if (image.uri && !image.uploaded) {
        return dedupSets.uris.has(image.uri);
    }
    return dedupSets.ids.has(image.id);
};

const imagesSlice = createSlice({
    name: 'images',

    initialState,

    reducers: {
        /**
         * Add images from Camera or Gallery to state
         */
        addImages(state, action) {
            const images = action.payload.images;
            if (!images) {
                return;
            }

            const dedup = buildDedupSets(state);
            images.forEach(image => {
                if (!isDuplicate(dedup, image)) {
                    state.imagesArray.push({
                        id: image.id,
                        date: image.date ?? null,
                        lat: image.lat ?? null,
                        lon: image.lon ?? null,
                        filename: image.filename,
                        uri: image.uri,
                        type: image.type, // gallery or camera
                        platform: image.platform,

                        tags: [],
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
            const {imageIndex, cloId, typeId, defaultPickedUp} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image) {
                return;
            }

            if (!image.tags) {
                image.tags = [];
            }

            const existing = findTag(image.tags, cloId, typeId);
            if (existing) {
                if (existing.quantity < 10) existing.quantity += 1;
            } else {
                const tag = {
                    cloId,
                    quantity: 1,
                    picked_up: defaultPickedUp ?? null,
                    materials: [],
                    brands: [],
                    customTags: []
                };
                if (typeId) {
                    tag.typeId = typeId;
                }
                image.tags.push(tag);
            }
        },

        /**
         * V5 tagging: Remove a tag by (cloId, typeId) from the current image.
         * payload = { imageIndex, cloId, typeId? }
         */
        removeTagV5(state, action) {
            const {imageIndex, cloId, typeId} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image || !image.tags) {
                return;
            }

            image.tags = filterOutTag(image.tags, cloId, typeId);
        },

        /**
         * V5 tagging: Set exact quantity for a tag.
         * payload = { imageIndex, cloId, typeId?, quantity }
         * Removes the tag if quantity <= 0.
         */
        updateTagQuantityV5(state, action) {
            const {imageIndex, cloId, typeId, quantity} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image || !image.tags) {
                return;
            }

            if (quantity <= 0) {
                image.tags = filterOutTag(image.tags, cloId, typeId);
            } else {
                const tag = findTag(image.tags, cloId, typeId);
                if (tag) {
                    tag.quantity = Math.min(quantity, 10);
                }
            }
        },

        /**
         * Set picked_up on a specific tag within an image.
         * payload = { imageIndex, cloId, typeId, value }
         * value: true, false, or null
         */
        setPickedUpOnTag(state, action) {
            const {imageIndex, cloId, typeId, value} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image || !image.tags) return;
            const tag = findTag(image.tags, cloId, typeId);
            if (!tag) return;
            tag.picked_up = value;
        },

        /**
         * Toggle a material on/off for a specific tag.
         * payload = { imageIndex, cloId, typeId?, materialId }
         */
        toggleMaterialOnTag(state, action) {
            const {imageIndex, cloId, typeId, materialId} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags) {
                return;
            }

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag) {
                return;
            }

            if (!tag.materials) {
                tag.materials = [];
            }
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
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags) {
                return;
            }

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag) {
                return;
            }

            if (!tag.brands) {
                tag.brands = [];
            }
            if (!tag.brands.some(b => b.id === brandId)) {
                tag.brands.push({id: brandId, quantity: 1});
            }
        },

        /**
         * Update the quantity of a brand on a specific tag.
         * payload = { imageIndex, cloId, typeId?, brandId, quantity }
         * Removes the brand if quantity <= 0.
         */
        setBrandQuantity(state, action) {
            const {imageIndex, cloId, typeId, brandId, quantity} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags) return;

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag?.brands) return;

            if (quantity <= 0) {
                tag.brands = tag.brands.filter(b => b.id !== brandId);
            } else {
                const brand = tag.brands.find(b => b.id === brandId);
                if (brand) {
                    brand.quantity = Math.min(quantity, 10);
                }
            }
        },

        /**
         * Remove a brand from a specific tag.
         * payload = { imageIndex, cloId, typeId?, brandId }
         */
        removeBrandFromTag(state, action) {
            const {imageIndex, cloId, typeId, brandId} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags) {
                return;
            }

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag?.brands) {
                return;
            }

            tag.brands = tag.brands.filter(b => b.id !== brandId);
        },

        /**
         * Add a custom tag string to a specific tag.
         * payload = { imageIndex, cloId, typeId?, text }
         */
        addCustomTagToTag(state, action) {
            const {imageIndex, cloId, typeId, text} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags || !text?.trim()) {
                return;
            }

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag) {
                return;
            }

            if (!tag.customTags) {
                tag.customTags = [];
            }
            const trimmed = text.trim().slice(0, 100);
            if (trimmed.length < 3) {
                state.customTagError = 'too_short';
                return;
            }
            if (!CUSTOM_TAG_REGEX.test(trimmed)) {
                state.customTagError = 'invalid_chars';
                return;
            }
            state.customTagError = null;
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
            const image = getTargetImage(state, imageIndex);
            if (!image?.tags) {
                return;
            }

            const tag = findTag(image.tags, cloId, typeId);
            if (!tag?.customTags) {
                return;
            }

            tag.customTags = tag.customTags.filter(t => t !== text);
        },

        /**
         * Add an image-level custom tag string.
         * payload = { imageIndex, text }
         */
        addImageCustomTag(state, action) {
            const {imageIndex, text} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image || !text?.trim()) {
                return;
            }

            if (!image.customTags) {
                image.customTags = [];
            }

            const trimmed = text.trim().slice(0, 100);
            if (trimmed.length < 3) {
                state.customTagError = 'too_short';
                return;
            }
            if (!CUSTOM_TAG_REGEX.test(trimmed)) {
                state.customTagError = 'invalid_chars';
                return;
            }
            state.customTagError = null;
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
            const image = getTargetImage(state, imageIndex);
            if (!image?.customTags) {
                return;
            }

            image.customTags = image.customTags.filter(t => t !== text);
        },

        clearCustomTagError(state) {
            state.customTagError = null;
        },


        /**
         * When enable_admin_tagging is turned on, remove server-fetched
         * untagged images from state (admin will tag them instead).
         */
        clearUploadedImages(state) {
            state.imagesArray = state.imagesArray.filter(img => !img.uploaded);
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
                // Keep swiperIndex in bounds
                if (state.imagesArray.length === 0) {
                    state.swiperIndex = 0;
                } else if (index < state.swiperIndex) {
                    state.swiperIndex--;
                } else if (state.swiperIndex >= state.imagesArray.length) {
                    state.swiperIndex = state.imagesArray.length - 1;
                }
            }
        },

        /**
         * Delete selected images -- all images with property selected set to true
         */
        deleteSelectedImages(state) {
            state.imagesArray = state.imagesArray.filter(img => !img.selected);
        },

        /**
         * When HomeScreen.isSelecting is turned off,
         *
         * Change selected value on every image to false
         */
        deselectAllImages(state) {
            state.imagesArray.forEach(image => {
                if (image.selected) image.selected = false;
            });
        },

        resetUploadState(state) {
            state.totalToUpload = 0;
            state.uploaded = 0;
            state.uploadFailed = 0;
            state.tagged = 0;
            state.taggedFailed = 0;
            state.uploadPhase = 'idle';
            state.currentUploadIndex = 0;
            state.uploadAbortReason = null;
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

        /**
         * toggle selected property of a image object
         */
        toggleSelectedImages(state, action) {
            const image = state.imagesArray[action.payload];
            if (image) {
                image.selected = !image.selected;
            }
        }
    },

    extraReducers: builder => {
        builder

            // Upload Image
            .addCase(uploadImage.fulfilled, (state, action) => {
                const {photoId, imageUri, serverPhotoId} = action.payload;

                // Find the exact image — match by URI (unique) when
                // available, falling back to ID for uploaded images.
                const index = state.imagesArray.findIndex(img =>
                    imageUri ? img.uri === imageUri : img.id === photoId
                );

                if (index !== -1) {
                    state.imagesArray[index].id = serverPhotoId;
                    state.imagesArray[index].uploaded = true;
                }

                state.uploaded++;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                const {errorType} = action.payload || {errorType: 'unknown'};

                state.uploadFailed += 1;


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
                const idx = state.imagesArray.findIndex(img => img.id === photoId);
                if (idx !== -1) state.imagesArray.splice(idx, 1);
                state.tagged++;
            })
            .addCase(postTagsToPhoto.rejected, (state, action) => {
                state.taggedFailed++;

                const errorType = action.payload?.errorType || 'unknown';
                switch (errorType) {
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
    changeSwiperIndex,
    clearCustomTagError,
    clearUploadedImages,
    deleteImage,
    deleteSelectedImages,
    deselectAllImages,
    removeBrandFromTag,
    removeCustomTagFromTag,
    setBrandQuantity,
    removeImageCustomTag,
    removeTagV5,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    toggleMaterialOnTag,
    togglePickedUp,
    setPickedUpOnTag,
    toggleSelectedImages,
    updateTagQuantityV5
} = imagesSlice.actions;

// Memoized selectors
const selectImagesArray = state => state.images.imagesArray;
export const selectSelectedCount = createSelector(
    [selectImagesArray],
    images => images.filter(img => img.selected).length
);

export default imagesSlice.reducer;
