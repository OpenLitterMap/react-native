import React from 'react';
import {
    CHECK_APP_VERSION,
    DECREMENT_SELECTED,
    INCREMENT_SELECTED,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
    URL,
    WEB_NOT_TAGGED
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
