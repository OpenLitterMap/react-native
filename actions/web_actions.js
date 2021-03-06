import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {
    URL,
    CLIENT_SECRET,
    CLIENT_ID,
    REMOVE_WEB_IMAGE,
    WEB_CONFIRM,
    WEB_IMAGES,
    WEB_UPLOAD
} from './types';
import axios from 'axios';

/**
 * When LeftPage didMount, check web for any images
 * @return [id, filename]
 */
export const checkForImagesOnWeb = token => {
    return dispatch => {
        return axios({
            url: URL + '/api/v2/photos/web/index',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        .then(resp => {
            console.log('images_from_web', resp);

            dispatch({ type: WEB_IMAGES, payload: {
                count: resp.data.count,
                photos: resp.data.photos
            }});
        })
        .catch(err => {
            console.log('web', err);
        });
    }
}

/**
 * User has clicked Confirm on LitterPicker
 * Post to server and return 200
 */
export const confirmWebPhoto = data => {
    return dispatch => {
        return axios({
            url: URL + '/api/photos/update',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + data.token
            },
            data: {
                photo_id: data.id,
                litter: data.tags
            }
        })
        .then(resp => {
            console.log('confirmWebPhoto', resp.data);

            return true;
        })
        .catch(err => {
            console.log({ err });
        });
    }
}

export const removeWebImage = id => {
    console.log('removeWebImage', id);
    return {
        type: REMOVE_WEB_IMAGE,
        payload: id
    };
};

export const toggleWebImageSuccess = bool => {
    return {
        type: WEB_CONFIRM,
        payload: bool
    }
};
