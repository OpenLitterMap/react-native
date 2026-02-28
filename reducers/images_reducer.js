import axios from 'axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/react-native';
import { URL } from '../actions/types';

/**
 * Classify an axios error into a structured { errorType, userMessage } object.
 * Used by all upload thunks for consistent error handling.
 */
function classifyError (error, section) {
    let errorType = 'unknown';
    let userMessage = 'Upload failed. Please try again.';

    if (!error.response) {
        // No server response — network or timeout
        if (error.code === 'ECONNABORTED') {
            errorType = 'timeout';
            userMessage = 'Upload timed out. Check your connection and try again.';
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

        Sentry.captureException(new Error(JSON.stringify(error.response.data)), {
            level: 'error',
            tags: { section, errorType, status: String(status) }
        });
    }

    return { errorType, userMessage };
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
    uploadPhase: 'idle',        // 'idle' | 'uploading' | 'tagging'
    currentUploadIndex: 0,
    uploadAbortReason: null,    // null | 'token-expired' | 'cancelled'

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
 * - deleteWebImage
 * - getUntaggedImages
 * - uploadImage
 * - uploadTagsToWebImage
 * - postTagsToPhoto
 */

export const deleteWebImage = createAsyncThunk(
    'images/deleteWebImage',
    async ({ token, photoId, enableAdminTagging }, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: `${URL}/api/photos/delete`,
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: { photoId }
            });

            if (response.data.success) {
                return photoId;
            } else {
                return rejectWithValue('Failed to delete image, no success flag');
            }
        } catch (error) {
            console.error('delete web image.error', error);
            return rejectWithValue(error.response?.data?.message || 'An error occurred during deletion');
        }
    }
);

export const getUntaggedImages = createAsyncThunk(
    'images/getUntaggedImages',
    async (token, { rejectWithValue }) => {
        try
        {
            const response = await axios({
                url: `${URL}/api/v2/photos/get-untagged-uploads`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response?.data?.photos?.length > 0)
            {
                return {
                    images: response.data.photos,
                    type: 'WEB'
                };
            }
            else
            {
                return rejectWithValue('No photos found');
            }
        }
        catch (error)
        {
            return rejectWithValue(error.response?.data?.message || 'Network Error');
        }
    }
);

export const uploadImage = createAsyncThunk(
    'images/uploadImage',
    async ({ token, imageData, imageId, enableAdminTagging, photoHasTags }, { rejectWithValue }) => {
        try
        {
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
                    photo_id: response.data.photo_id,
                    enableAdminTagging,
                    photoHasTags
                };
            } else {
                return rejectWithValue({ errorType: 'unknown', userMessage: 'Upload failed with no success flag' });
            }
        }
        catch (error)
        {
            return rejectWithValue(classifyError(error, 'image_upload'));
        }
    }
);

export const uploadTagsToWebImage = createAsyncThunk(
    'images/uploadTagsToWebImage',
    async ({ token, img }, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: `${URL}/api/v2/add-tags-to-uploaded-image`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    photo_id: img.id,
                    tags: img.tags,
                    custom_tags: img.customTags,
                    picked_up: img.picked_up ? 1 : 0
                }
            });

            if (response.data.success) {
                return img.id;
            } else {
                return rejectWithValue({ errorType: 'unknown', userMessage: 'Failed to add tags to the image' });
            }
        } catch (error) {
            return rejectWithValue(classifyError(error, 'upload_tags_v2'));
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
    async ({ token, photoId, tags, pickedUp }, { rejectWithValue }) => {
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

            if (response.data?.success) {
                return { photoId };
            } else {
                return rejectWithValue({ errorType: 'unknown', userMessage: 'Failed to post tags' });
            }
        } catch (error) {
            return rejectWithValue(classifyError(error, 'post_tags_v3'));
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
        addImages (state, action)
        {
            const images = action.payload.images;

            images && images.map(image => {
                let index = -1;

                if (image.platform === 'mobile')
                {
                    // image type can be gallery or camera

                    if (image.uploaded) {
                        index = state.imagesArray.findIndex(img => img.id === image.id);
                    } else {
                        index = state.imagesArray.findIndex(img => img.uri === image.uri);
                    }
                }
                else
                {
                    // Web images: check by server id
                    index = state.imagesArray.findIndex(img => img.id === image.id);
                }

                // If index is -1, it was not found
                if (index === -1) {
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
        changeSwiperIndex (state, action) {
            state.swiperIndex = action.payload;
        },

        /**
         * V5 tagging: Add a tag by cloId to the current image.
         * payload = { imageIndex, cloId }
         * If the cloId already exists, increment quantity by 1.
         */
        addTagV5 (state, action) {
            const { imageIndex, cloId } = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image) return;

            if (!image.tagsV5) image.tagsV5 = [];

            const existing = image.tagsV5.find(t => t.cloId === cloId);
            if (existing) {
                existing.quantity += 1;
            } else {
                image.tagsV5.push({ cloId, quantity: 1 });
            }
        },

        /**
         * V5 tagging: Remove a tag by cloId from the current image.
         * payload = { imageIndex, cloId }
         */
        removeTagV5 (state, action) {
            const { imageIndex, cloId } = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image || !image.tagsV5) return;

            image.tagsV5 = image.tagsV5.filter(t => t.cloId !== cloId);
        },

        /**
         * V5 tagging: Set exact quantity for a tag.
         * payload = { imageIndex, cloId, quantity }
         * Removes the tag if quantity <= 0.
         */
        updateTagQuantityV5 (state, action) {
            const { imageIndex, cloId, quantity } = action.payload;
            const image = state.imagesArray[imageIndex];
            if (!image || !image.tagsV5) return;

            if (quantity <= 0) {
                image.tagsV5 = image.tagsV5.filter(t => t.cloId !== cloId);
            } else {
                const tag = image.tagsV5.find(t => t.cloId === cloId);
                if (tag) tag.quantity = quantity;
            }
        },

        /**
         * V5 tagging: Toggle picked_up on a single image by index.
         * payload = imageIndex
         */
        togglePickedUpByIndex (state, action) {
            const image = state.imagesArray[action.payload];
            if (image) {
                image.picked_up = !image.picked_up;
            }
        },

        cancelUploadImages (state) {
            state.isUploading = false;
        },

        /**
         * Changes litter picked up status of all images
         */
        changeLitterStatus (state, action) {
            state.imagesArray.map(img => (img.picked_up = action.payload));
        },

        /**
         * After setting enable_admin_tagging changes to False,
         *
         * We want to clear the users uploaded un-tagged images.
         */
        clearUploadedWebImages (state) {
            state.imagesArray = state.imagesArray.filter(img => {
                return img.type?.toLowerCase() === 'web' && img.hasOwnProperty('photoId');
            });
        },

        /**
         * Delete image from HomeScreen by id
         */
        deleteImage (state, action)
        {
            const index = state.imagesArray.findIndex(delImg => delImg.id === action.payload);

            if (index !== -1) {
                state.imagesArray.splice(index, 1);
            }
        },

        /**
         * Delete selected images -- all images with property selected set to true
         */
        deleteSelectedImages (state, action) {
            state.imagesArray = state.imagesArray.filter(
                img => !img.selected
            );

            state.selected = 0;
        },

        /**
         * When HomeScreen.isSelecting is turned off,
         *
         * Change selected value on every image to false
         */
        deselectAllImages (state) {
            state.imagesArray.map(image => {
                image.selected = false;
            });
        },

        resetUploadState (state) {
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

        setTotalToUpload (state, action) {
            state.totalToUpload = action.payload;
        },

        setUploadPhase (state, action) {
            state.uploadPhase = action.payload;
        },

        setCurrentUploadIndex (state, action) {
            state.currentUploadIndex = action.payload;
        },

        setUploadAbortReason (state, action) {
            state.uploadAbortReason = action.payload;
        },

        /**
         * toggles picked_up status on an image based on id
         */
        togglePickedUp (state, action) {
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
        toggleSelecting (state) {
            state.selected = 0;
        },

        /**
         * toggle selected property of a image object
         */
        toggleSelectedImages (state, action) {
            state.imagesArray[action.payload].selected = !state.imagesArray[action.payload].selected;
        },

        /**
         * After an untagged image was uploaded,
         *
         * If user.enable_admin_tagging is false,
         * Update the image as uploaded which will show a cloud emoji
         */
        updateImageAsUploaded (state, action) {

        }
    },

    extraReducers: (builder) => {

        builder

            .addCase(deleteWebImage.pending, (state) => {
                // nothing yet
            })
            .addCase(deleteWebImage.fulfilled, (state, action) => {
                const index = state.imagesArray.findIndex(
                    delImg => delImg.id === action.payload
                );

                if (index !== -1) {
                    state.imagesArray.splice(index, 1);
                }
            })
            .addCase(deleteWebImage.rejected, (state, action) => {
                // no error handling yet
            })

            .addCase(getUntaggedImages.fulfilled, (state, action) => {

                action.payload.images && action.payload.images.map(image => {

                    let index = -1;

                    if (image.platform === 'mobile') {
                        if (image.uploaded) {
                            index = state.imagesArray.findIndex(img => img.id === image.id);
                        } else {
                            index = state.imagesArray.findIndex(img => img.uri === image.uri);
                        }
                    }
                    else
                    {
                        // Web images: check by server id
                        index = state.imagesArray.findIndex(img => img.id === image.id);
                    }

                    if (index === -1)
                    {
                        state.imagesArray.push({
                            id: image.id,
                            date: image.date ?? null,
                            lat: image.lat ?? null,
                            lon: image.lon ?? null,
                            filename: image.filename,
                            uri: null,
                            type: image.type,
                            platform: image.platform,

                            tags: {},
                            tagsV5: [],
                            customTags: [],
                            picked_up: action.payload.picked_up,

                            selected: false,
                            uploaded: image.uploaded
                        });
                    }
                });
            })

            // Upload Image
            .addCase(uploadImage.pending, (state) => {
                // nothing yet
            })
            .addCase(uploadImage.fulfilled, (state, action) => {
                const { imageId, photo_id, enableAdminTagging, photoHasTags } = action.payload;

                if (enableAdminTagging || photoHasTags) {
                    state.imagesArray = state.imagesArray.filter(img => img.id !== imageId);
                } else {
                    state.imagesArray = state.imagesArray.map(img => {
                        if (img.type === 'gallery' && img.id === imageId) {
                            img.id = photo_id;
                            img.type = 'web';
                            img.uploaded = true;
                        }
                        return img;
                    });
                }

                state.uploaded++;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                const { errorType } = action.payload || { errorType: 'unknown' };

                state.uploadFailed += 1;
                state.errorMessage = errorType;

                switch (errorType) {
                    case 'photo-already-uploaded': state.failedCounts.alreadyUploaded += 1; break;
                    case 'invalid-coordinates': state.failedCounts.invalidCoordinates += 1; break;
                    case 'timeout': state.failedCounts.timeout += 1; break;
                    case 'network': state.failedCounts.network += 1; break;
                    case 'server': state.failedCounts.server += 1; break;
                    default: state.failedCounts.unknown += 1;
                }
            })

            // UploadTagsToWebImage (v4 legacy)
            .addCase(uploadTagsToWebImage.pending, (state) => {
                // nothing yet
            })
            .addCase(uploadTagsToWebImage.fulfilled, (state, action) => {
                state.imagesArray = state.imagesArray.filter(img => img.id !== action.payload);
                state.tagged++;
            })
            .addCase(uploadTagsToWebImage.rejected, (state, action) => {
                const { errorType } = action.payload || { errorType: 'unknown' };
                state.taggedFailed++;
                state.errorMessage = errorType;
            })

            // Post Tags V3
            .addCase(postTagsToPhoto.fulfilled, (state, action) => {
                const { photoId } = action.payload;
                state.imagesArray = state.imagesArray.filter(img => img.id !== photoId);
                state.tagged++;
            })
            .addCase(postTagsToPhoto.rejected, (state, action) => {
                const { errorType } = action.payload || { errorType: 'unknown' };
                state.taggedFailed++;
                state.errorMessage = errorType;
            });
    }
});

export const {
    addImages,
    addTagV5,
    cancelUploadImages,
    changeLitterStatus,
    changeSwiperIndex,
    clearUploadedWebImages,
    deleteImage,
    deleteSelectedImages,
    deselectAllImages,
    removeTagV5,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    togglePickedUp,
    togglePickedUpByIndex,
    toggleSelecting,
    toggleSelectedImages,
    updateImageAsUploaded,
    updateTagQuantityV5
} = imagesSlice.actions;

export default imagesSlice.reducer;
