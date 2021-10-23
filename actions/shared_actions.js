import React from 'react';
import {
    CHECK_APP_VERSION,
    DECREMENT_SELECTED,
    INCREMENT_SELECTED,
    TOGGLE_LITTER,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
    URL
} from './types';
import axios from 'axios';

/**
 * check for new app version
 *
 */

export const checkAppVersion = () => {
    return async dispatch => {
        try {
            const response = await axios({
                url: URL + '/api/mobile-app-version',
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });
            if (response.data) {
                dispatch({
                    type: CHECK_APP_VERSION,
                    payload: response.data
                });
            }
        } catch (error) {
            console.log('appversion check ' + error);
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
 * Increment the amount of photos selected for deletion
 */

export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
    };
};

/**
 * Toggle Litter content inside Modal on / off
 */
export const toggleLitter = () => {
    return {
        type: TOGGLE_LITTER
    };
};

/**
 * Toggles thank you modal after image uploaded
 */

export const toggleThankYou = () => {
    return {
        type: TOGGLE_THANK_YOU
    };
};

/**
 * Toggle Upload content inside modal on / off
 */
export const toggleUpload = () => {
    return {
        type: TOGGLE_UPLOAD
    };
};

/**
 * Toggle if the user wnts to Select + Delete a photo
 */
export const toggleSelecting = () => {
    return {
        type: TOGGLE_SELECTING
    };
};

/**
 * Upload a photo.
 * - camera_photo
 * - gallery_image
 *
 * Note: We upload the tags separately.
 *
 * todo - delete the gallery image on the users device
 * todo - try and upload the tags and the image data in 1 request
 * todo - upload images earlier as a background process
 */
export const uploadPhoto = (token, image) => {
    // let progress = null;
    let response;
    return async dispatch => {
        try {
            response = await axios(URL + '/api/photos/submit', {
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
 */
export const uploadTags = (token, tags, photo_id) => {
    return async dispatch => {
        let response;
        try {
            response = await axios(URL + '/api/add-tags', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token
                },
                data: {
                    litter: tags,
                    photo_id: photo_id
                }
            });
        } catch (error) {
            console.log('uploadTags', error);
            return {
                success: false
            };
        }

        console.log('uploadTags', response.data);

        if (response && response?.data?.success) {
            return {
                success: true
            };
        }
    };
};
