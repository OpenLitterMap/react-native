import React from 'react';
import {
    CANCEL_UPLOAD,
    CHECK_APP_VERSION,
    CLOSE_THANK_YOU_MESSAGES,
    DECREMENT_SELECTED,
    INCREMENT_SELECTED,
    SHOW_FAILED_TAGGED_UPLOADS,
    SHOW_THANK_YOU_MESSAGES_AFTER_UPLOAD,
    SHOW_TAGGED_UPLOADS,
    START_UPLOADING,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
    URL,
    WEB_NOT_TAGGED
} from './types';
import axios from 'axios';

/**
 *
 */
export const cancelUpload = () => {
    return {
        type: CANCEL_UPLOAD
    };
}

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
 * After uploading,
 * Thank you messages are shown,
 * Now we hide the modal and messages.
 */
export const closeThankYouMessages = () => {
    return {
        type: CLOSE_THANK_YOU_MESSAGES
    };
}

/**
 * Uploading Tags to Already Uploaded images was a success
 */
export const showTaggedUploads = () => {
    return {
        type: SHOW_TAGGED_UPLOADS
    };
}

/**
 * Uploading Tags to Already Uploaded images failed
 */
export const showFailedTaggedUploads = () => {
    return {
        type: SHOW_FAILED_TAGGED_UPLOADS
    };
}

/**
 *
 */
export const showThankYouMessagesAfterUpload = () => {
    return {
        type: SHOW_THANK_YOU_MESSAGES_AFTER_UPLOAD
    };
}

export const startUploading = () => {
    return {
        type: START_UPLOADING
    };
}

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
 * Show a modal that tells the user Web images are available
 *
 * But they are not tagged.
 */
export const toggleWebImagesNotTagged = () => {
    return {
        type: WEB_NOT_TAGGED
    };
};
