import axios from 'axios';
import {
    ADD_IMAGES,
    ADD_TAG_TO_IMAGE,
    ADD_CUSTOM_TAG_TO_IMAGE,
    CHANGE_LITTER_STATUS,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_PICKED_UP,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES,
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
        payload: { images, type, picked_up }
    };
};

/**
 * Add tag to image
 */
export const addTagToImage = ({ tag, currentIndex, quantityChanged }) => {
    return {
        type: ADD_TAG_TO_IMAGE,
        payload: { tag, currentIndex, quantityChanged }
    };
};

/**
 * Add tag to image
 */
export const addCustomTagToImage = ({ tag, currentIndex }) => {
    return {
        type: ADD_CUSTOM_TAG_TO_IMAGE,
        payload: { tag, currentIndex }
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
 * Get images uploaded from website but not yet tagged
 *
 * @param token - jwt
 * @param picked_up - default user setting if litter is picked_up or not
 *
 */
export const checkForImagesOnWeb = (token, picked_up) => {
    return async dispatch => {
        let response;

        try {
            response = await axios({
                url: URL + '/api/v2/photos/web/index',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
        } catch (error) {
            if (error?.response) {
                console.log('checkForImagesOnWeb', error?.response?.data);
            } else {
                console.log('checkForImagesOnWeb -- Network Error');
            }
        }
        if (response && response?.data?.photos) {
            let photos = response.data.photos;
            dispatch({
                type: ADD_IMAGES,
                payload: {
                    images: photos,
                    type: 'WEB',
                    picked_up
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
export const deleteWebImage = (token, photoId, id) => {
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
                params: { photoId }
            });
        } catch (error) {
            console.log('delete web image', error);
        }
        if (response && response?.data?.success) {
            dispatch({
                type: DELETE_IMAGE,
                payload: id
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
 * fn to upload images along with tags
 * @param {string} token
 * @param  image form data
 * @param imageId
 * @returns
 */
export const uploadImage = (token, image, imageId) => {
    let response;
    return async dispatch => {
        try {
            response = await axios(URL + '/api/photos/upload-with-tags', {
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
 * Upload the tags that were applied to a WEB image
 * This fn is used only for WEB images as those images are already uploaded from website.
 *
 * @param {string} token
 * @param  image - the image object
 */
export const uploadTagsToWebImage = (token, image) => {
    return async dispatch => {
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
                    picked_up: image.picked_up ? 1 : 0
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
