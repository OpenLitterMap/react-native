import {createSlice, createSelector} from '@reduxjs/toolkit';
import {getTagsFromBackend} from '../utils/getTagsFromBackend';
import {logout} from './auth_reducer';
import {uploadImage, postTagsToPhoto} from './upload_flow_reducer';
import {dismissPhotos} from './gallery_reducer';

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
    if (state.editingPhotos.length > 0) {
        return state.editingPhotos[imageIndex];
    }
    return state.imagesArray[imageIndex];
};

const initialState = {
    imagesArray: [],
    uploadedUris: [], // URIs of photos successfully uploaded+tagged — used to hide from camera roll grid
    editingPhotos: [], // Photos loaded from server for tag editing (My Uploads / untagged queue)
    taggedThisSession: [], // IDs of photos tagged/removed during this editing session (prevents re-fetch dupes)
    swiperIndex: 0,

    // Custom tag validation feedback (null = no error)
    customTagError: null
};

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

const photosSlice = createSlice({
    name: 'photos',

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
         * Add a single photo from onboarding flow.
         * payload = { uri, filename, lat, lon, width, height, type, fileSize }
         */
        addOnboardingPhoto(state, action) {
            const photo = action.payload;
            const dedup = buildDedupSets(state);
            if (photo.uri && dedup.uris.has(photo.uri)) {
                // Duplicate — point swiperIndex to the existing photo
                // so navigation to the tag screen shows the right image.
                const idx = state.imagesArray.findIndex(img => img.uri === photo.uri);
                if (idx !== -1) state.swiperIndex = idx;
                return;
            }

            state.imagesArray.push({
                id: `onboarding_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                date: Math.floor(Date.now() / 1000),
                lat: photo.lat,
                lon: photo.lon,
                filename: photo.filename,
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                platform: null,
                tags: [],
                customTags: [],
                picked_up: null,
                selected: false,
                uploaded: false,
                onboarding: true
            });
            // Point swiper to the newly added image
            state.swiperIndex = state.imagesArray.length - 1;
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
                if (typeId != null) {
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

        /**
         * Load one or more API photos for tag editing.
         * payload = { photo } for single, { photos } for batch
         */
        loadPhotoForEditing(state, action) {
            const payload = action.payload;
            if (!payload) return;

            const photos = Array.isArray(payload.photos)
                ? payload.photos
                : payload.photo
                    ? [payload.photo]
                    : [];

            if (photos.length === 0) return;

            const converted = photos.map(photo => {
                const {tags, imageCustomTags} = getTagsFromBackend(photo.new_tags);
                return {
                    id: photo.id,
                    photoId: photo.id,
                    date: photo.datetime ?? null,
                    lat: photo.lat ?? null,
                    lon: photo.lon ?? null,
                    filename: photo.filename,
                    uri: null,
                    type: 'web',
                    platform: photo.platform ?? 'web',
                    tags,
                    customTags: imageCustomTags,
                    picked_up: !!photo.picked_up,
                    selected: false,
                    uploaded: true,
                    editing: true
                };
            });

            // Deduplicate by ID against existing editing photos and photos tagged this session
            if (!state.editingPhotos) state.editingPhotos = [];
            const existingIds = new Set(state.editingPhotos.map(p => p.id));
            const taggedIds = new Set(state.taggedThisSession ?? []);
            for (const photo of converted) {
                if (!existingIds.has(photo.id) && !taggedIds.has(photo.id)) {
                    state.editingPhotos.push(photo);
                }
            }
        },

        /**
         * Remove a specific photo from the editing queue by ID.
         */
        removeEditingPhoto(state, action) {
            const photoId = action.payload;
            const removedIndex = (state.editingPhotos || []).findIndex(p => p.id === photoId);
            state.editingPhotos = (state.editingPhotos || []).filter(p => p.id !== photoId);
            // Track removed ID to prevent re-fetch duplicates
            if (!state.taggedThisSession) state.taggedThisSession = [];
            if (photoId != null) state.taggedThisSession.push(photoId);
            // Keep swiperIndex in bounds after removal
            if (removedIndex !== -1 && state.swiperIndex >= state.editingPhotos.length) {
                state.swiperIndex = Math.max(0, state.editingPhotos.length - 1);
            }
        },

        clearEditingPhoto(state) {
            state.editingPhotos = [];
            state.taggedThisSession = [];
        },

        /**
         * Commit a local draft's tags/customTags back to the active photo queue.
         * Used by the tagging screen to persist draft edits before advancing.
         * payload = { imageIndex, tags, customTags }
         */
        commitDraftToPhoto(state, action) {
            const {imageIndex, tags, customTags} = action.payload;
            const image = getTargetImage(state, imageIndex);
            if (!image) return;
            image.tags = tags;
            image.customTags = customTags;
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
            // Re-clamp swiperIndex after bulk deletion
            if (state.imagesArray.length === 0) {
                state.swiperIndex = 0;
            } else if (state.swiperIndex >= state.imagesArray.length) {
                state.swiperIndex = state.imagesArray.length - 1;
            }
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

            // Update imagesArray when upload/tag thunks complete
            .addCase(uploadImage.fulfilled, (state, action) => {
                const {photoId, imageUri, serverPhotoId} = action.payload;
                const index = state.imagesArray.findIndex(img =>
                    imageUri ? img.uri === imageUri : img.id === photoId
                );
                if (index !== -1) {
                    state.imagesArray[index].id = serverPhotoId;
                    state.imagesArray[index].uploaded = true;
                }
            })
            .addCase(uploadImage.rejected, (state, action) => {
                const {errorType} = action.payload || {};
                // Server already has this photo — mark uploaded to prevent binary re-upload
                if (errorType === 'photo-already-uploaded') {
                    const {photoId, imageUri} = action.meta.arg;
                    const index = state.imagesArray.findIndex(img =>
                        imageUri ? img.uri === imageUri : img.id === photoId
                    );
                    if (index !== -1) {
                        state.imagesArray[index].uploaded = true;
                    }
                }
            })
            .addCase(postTagsToPhoto.fulfilled, (state, action) => {
                const {photoId} = action.payload;
                const idx = state.imagesArray.findIndex(img => img.id === photoId);
                if (idx !== -1) {
                    const uri = state.imagesArray[idx].uri;
                    if (uri) {
                        if (!state.uploadedUris) state.uploadedUris = [];
                        state.uploadedUris.push(uri);
                    }
                    state.imagesArray.splice(idx, 1);
                }
            })

            // Remove dismissed photos from imagesArray too
            .addCase(dismissPhotos, (state, action) => {
                const uris = new Set(action.payload);
                state.imagesArray = state.imagesArray.filter(img => !uris.has(img.uri));
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
    addOnboardingPhoto,
    addTagV5,
    changeSwiperIndex,
    clearCustomTagError,
    clearEditingPhoto,
    clearUploadedImages,
    commitDraftToPhoto,
    deleteImage,
    deleteSelectedImages,
    deselectAllImages,
    loadPhotoForEditing,
    removeEditingPhoto,
    removeBrandFromTag,
    removeCustomTagFromTag,
    setBrandQuantity,
    removeImageCustomTag,
    removeTagV5,
    toggleMaterialOnTag,
    togglePickedUp,
    setPickedUpOnTag,
    toggleSelectedImages,
    updateTagQuantityV5
} = photosSlice.actions;

// Memoized selectors
const selectImagesArray = state => state.photos.imagesArray;
export const selectSelectedCount = createSelector(
    [selectImagesArray],
    images => images.filter(img => img.selected).length
);

export default photosSlice.reducer;
