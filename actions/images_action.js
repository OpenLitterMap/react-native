import axios from 'axios';
import {
    ADD_IMAGE,
    ADD_TAGS_TO_IMAGE,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES,
    URL
} from './types';

/**
 * action to add images to state
 * @param {Array} images
 * @param {('CAMERA' | 'GALLERY' | 'WEB')} type
 */

export const addImage = (images, type, pickedUp) => {
    // console.log(images);
    return {
        type: ADD_IMAGE,
        payload: { images, type, pickedUp }
    };
};

/**
 * Add tags to images
 */

export const addTagsToImages = (payload) => {
    return {
        type: ADD_TAGS_TO_IMAGE,
        payload: payload
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

export const deleteImage = (id) => {
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
export const removeTagFromImage = (data) => {
    return {
        type: REMOVE_TAG_FROM_IMAGE,
        payload: data
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

export const toggleSelectedImage = (id) => {
    return {
        type: TOGGLE_SELECTED_IMAGES,
        payload: id
    };
};

/**
 * fn to upload images along with tags
 * @param {string} token
 * @param  image form data
 * @returns
 */
export const uploadImage = (token, image, imageId) => {
    let response;
    return async (dispatch) => {
        try {
            response = await axios(URL + '/api/photos/submit-with-tags', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'multipart/form-data'
                },
                data: image
            });
        } catch (error) {
            if (error.response) {
                console.log(
                    'ERROR: shared_actions.upload_photo',
                    JSON.stringify(error?.response?.data, null, 2)
                );
            } else {
                // Other errors -- NETWORK ERROR
                console.log(error);
            }

            return {
                success: false
            };
        }
        console.log('Response: shared_actions.uploadPhoto', response?.data);

        if (response && response.data?.success) {
            dispatch({
                type: DELETE_IMAGE,
                payload: imageId
            });
            // return the photo.id that has been created on the backend
            return {
                success: true,
                photo_id: response.data.photo_id
            };
        }
    };
};

/**
 * Upload the tags that were applied to an image
 * @param {string} token
 * @param  image - the image object
 */
export const uploadTags = (token, image) => {
    return async (dispatch) => {
        let response;
        try {
            response = await axios(URL + '/api/add-tags', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token
                },
                data: {
                    litter: image.tags,
                    photo_id: image.photoId,
                    picked_up: image.pickedUp ? 1 : 0
                }
            });
        } catch (error) {
            console.log(error);
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
