import axios from 'axios';
import * as Sentry from '@sentry/react-native';
import {
    ADD_CUSTOM_TAG_TO_IMAGE,
    ADD_IMAGES,
    ADD_TAG_TO_IMAGE,
    CHANGE_LITTER_STATUS,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_CUSTOM_TAG_FROM_IMAGE,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_PICKED_UP,
    TOGGLE_SELECTED_IMAGES,
    TOGGLE_SELECTING,
    URL
} from './types';

/**
 * action to add images to state
 * @param {Array} images
 * @param {('CAMERA' | 'GALLERY' | 'WEB')} type
 * @param picked_up
 */
export const addImages = (images, type, picked_up) => {
    return {
        type: ADD_IMAGES,
        payload: {images, type, picked_up}
    };
};

/**
 * Add tag to image
 */
export const addTagToImage = payload => {
    return {
        type: ADD_TAG_TO_IMAGE,
        payload: {
            tag: payload.tag,
            currentIndex: payload.currentIndex,
            quantityChanged: payload.quantityChanged
        }
    };
};

/**
 * Add tag to image
 */
export const addCustomTagToImage = ({tag, currentIndex}) => {
    return {
        type: ADD_CUSTOM_TAG_TO_IMAGE,
        payload: {tag, currentIndex}
    };
};

/**
 * fn to change litter status on all images in state
 * @param {boolean} value
 */
export const changeLitterStatus = value => {
    return {
        type: CHANGE_LITTER_STATUS,
        payload: value
    };
};

/**
 * After setting has changed, clear untagged uploads
 */
export const clearUntaggedUploads = () => {
    return {
        type: 'CLEAR_UPLOADED_WEB_IMAGES'
    };
};

/**
 * Get images uploaded but not yet tagged
 *
 * @param token - jwt
 */
export const getUntaggedImages = token => {
    return async dispatch => {
        let response;

        try {
            response = await axios({
                url: URL + '/api/v2/photos/get-untagged-uploads',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
        } catch (error) {
            if (error?.response) {
                console.log('getUntaggedImages', error?.response?.data);
            } else {
                console.log('getUntaggedImages -- Network Error');
            }
        }

        if (response && response?.data?.photos?.length) {
            dispatch({
                type: ADD_IMAGES,
                payload: {
                    images: response.data.photos,
                    type: 'WEB'
                }
            });
        }
    };
};

/**
 * Decrement the amount of photos selected for deletion
 */
export const decrementSelected = () => {
    return {
        type: DECREMENT_SELECTED
    };
};

/**
 * delete image by id
 * @param {number} id
 */
export const deleteImage = id => {
    return {
        type: DELETE_IMAGE,
        payload: id
    };
};

/**
 * Delete selected images -- all images with property selected set to true
 */
export const deleteSelectedImages = () => {
    return {
        type: DELETE_SELECTED_IMAGES
    };
};

/**
 * Change selected => false on all photos
 */
export const deselectAllImages = () => {
    return {
        type: DESELECT_ALL_IMAGES
    };
};

/**
 * Delete selected web image
 * web image - image that are uploaded from web but not tagged
 */
export const deleteWebImage = (token, photoId, enableAdminTagging) => {
    return async dispatch => {
        let response;

        try {
            response = await axios({
                url: URL + '/api/photos/delete',
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {photoId}
            });

            console.log('deleteWebImgResp', response.data);
        } catch (error) {
            console.log('delete web image.error', error);

            dispatch({
                type: DELETE_IMAGE,
                payload: photoId
            });
        }
        if (response && response?.data?.success) {
            console.log('deleteWebImageSuccess', response.data);

            console.log({enableAdminTagging});

            dispatch({
                type: DELETE_IMAGE,
                payload: photoId
            });
        }
    };
};

/**
 * Increment the amount of photos selected for deletion
 */
export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
    };
};

/**
 * remove a tag from image
 */
export const removeTagFromImage = data => {
    return {
        type: REMOVE_TAG_FROM_IMAGE,
        payload: data
    };
};

/**
 * remove custom tag from image
 * @param {number} tagIndex --> index of tag in customTags array.
 * @param {number} currentIndex --> current index of image
 */
export const removeCustomTagFromImage = ({tagIndex, currentIndex}) => {
    return {
        type: REMOVE_CUSTOM_TAG_FROM_IMAGE,
        payload: {tagIndex, currentIndex}
    };
};

/**
 * toggles picked_up status on an image based on id
 * @param id
 */
export const togglePickedUp = id => {
    return {
        type: TOGGLE_PICKED_UP,
        payload: id
    };
};

/**
 * Toggle if the user wants to Select images for deletion
 */
export const toggleSelecting = () => {
    return {
        type: TOGGLE_SELECTING
    };
};

/**
 * toggle selected property of a image object
 * @param {number} id
 */
export const toggleSelectedImage = id => {
    return {
        type: TOGGLE_SELECTED_IMAGES,
        payload: id
    };
};

/**
 * Upload images with or without tags
 *
 * image.tags & image.custom_tags may or may not have values
 *
 * @param {string} token
 * @param imageData: FormData
 * @param imageId: int
 * @param enableAdminTagging: bool
 * @param isTagged: bool
 *
 * @returns
 */
export const uploadImage = (token, imageData, imageId, enableAdminTagging, isTagged) => {
    return async dispatch => {
        try {
            const response = await axios(URL + '/api/photos/upload/with-or-without-tags', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'multipart/form-data'
                },
                data: imageData
            });

            if (response.data?.success) {
                if (enableAdminTagging || isTagged) {
                    dispatch({
                        type: DELETE_IMAGE,
                        payload: imageId
                    });
                } else {
                    dispatch({
                        type: 'UPDATE_IMAGE_AS_UPLOADED',
                        payload: {
                            originalImageId: imageId,
                            newImageId: response.data.photo_id
                        }
                    });
                }

                return {
                    success: true,
                    photo_id: response.data.photo_id
                };
            }
        } catch (error) {
            console.log('images_action.uploadImage.catch', error);

            let errorMessage = 'none';

            if (error.response) {
                switch (error.response.data?.msg) {
                    case 'photo-already-uploaded':
                        errorMessage = 'photo-already-uploaded';
                        break;
                    case 'invalid-coordinates':
                        errorMessage = 'invalid-coordinates';
                        break;
                    default:
                        errorMessage = error.response.data?.msg || 'unknown';
                }

                // log error in sentry
                Sentry.captureException(JSON.stringify(error?.response?.data, null, 2), {
                    level: 'error',
                    tags: {
                        section: 'image_upload',
                        errorMessage: errorMessage
                    }
                });
            }
            return {
                success: false,
                errorMessage
            };
        }
    };
};

/**
 * Upload the tags that were applied to a WEB image
 * This fn is used only for WEB images as those images are already uploaded from website.
 * These can now include images uploaded from the app.
 *
 * @param {string} token
 * @param  image - the image object
 */
export const uploadTagsToWebImage = (token, image) => {
    return async dispatch => {
        let response;

        try {
            response = await axios(URL + '/api/v2/add-tags-to-uploaded-image', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token
                },
                data: {
                    photo_id: image.id,
                    tags: image.tags,
                    custom_tags: image.customTags,
                    picked_up: image.picked_up ? 1 : 0
                }
            });
        } catch (error) {
            // Better error handling needed here
            // console.log(error);
            // console.log(error.response.data);
            return {
                success: false
            };
        }

        if (response && response?.data?.success) {
            dispatch({
                type: DELETE_IMAGE,
                payload: image.id
            });
            return {
                success: true
            };
        }
    };
};
