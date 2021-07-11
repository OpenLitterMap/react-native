import React from 'react';
import axios from 'axios';
import {
    ADD_PHOTO,
    ADD_TAGS_TO_CAMERA_PHOTO,
    LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
    DELETE_SELECTED_PHOTO,
    DESELECT_ALL_CAMERA_PHOTOS,
    CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
    REMOVE_TAG_FROM_CAMERA_PHOTO,
    TOGGLE_SELECTED_PHOTO,
    UPDATE_COUNT_REMAINING,
    UPDATE_PERCENT,
    URL
} from './types';

/**
 * Add a photo from camera - current session
 */
export const addPhoto = photo => {
    return {
        type: ADD_PHOTO,
        payload: photo
    };
};

/**
 *
 */
export const addTagsToCameraPhoto = payload => {
    return {
        type: ADD_TAGS_TO_CAMERA_PHOTO,
        payload: payload
    };
};

/**
 * Check & get an image uploaded on web that is ready for tagging
 */
export const checkForWebUpload = token => {
    return dispatch => {
        return axios({
            method: 'get',
            url: URL + '/api/check',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
            .then(resp => {
                console.log(resp);
            })
            .catch(err => {
                console.log(err);
            });
    };
};

/**
 * When the app loads, if any camera photos exist, load them here
 */
export const loadCameraPhotosFromAsyncStorage = photos => {
    return {
        type: LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
        payload: photos
    };
};

/**
 * Delete selected photo
 */
export const deleteSelectedPhoto = index => {
    return {
        type: DELETE_SELECTED_PHOTO,
        payload: index
    };
};

/**
 * Change selected => false on all photos
 */
export const deselectAllCameraPhotos = () => {
    return {
        type: DESELECT_ALL_CAMERA_PHOTOS // REMOVE_ALL_SELECTED_PHOTOS
    };
};

/**
 * A tag has been clicked
 */
export const removeTagFromCameraPhoto = data => {
    console.log('action.removeTagFromCameraPhoto');
    return {
        type: REMOVE_TAG_FROM_CAMERA_PHOTO,
        payload: data
    };
};

/**
 * An index of photos taken from the camera has been selected for delete
 */
export const toggleSelectedPhoto = index => {
    return {
        type: TOGGLE_SELECTED_PHOTO,
        payload: index
    };
};

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const cameraPhotoUploadedSuccessfully = index => {
    return {
        type: CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
        payload: index
    };
};

/**
 * Update progress percentage upload 0-100
 */
export const updatePercent = percent => {
    return {
        type: UPDATE_PERCENT,
        payload: percent
    };
};

/**
 *
 */
export const updateRemainingCount = count => {
    return {
        type: UPDATE_COUNT_REMAINING,
        payload: count
    };
};
