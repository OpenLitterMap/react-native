import React from 'react';
import axios from 'axios';
import {
    ADD_PHOTO,
    LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_SESSION_TAGS,
    DELETE_SELECTED_PHOTO, // current session
    DESELECT_ALL_CAMERA_PHOTOS,
    RESET_PHOTOS_TOTAL_TO_UPLOAD,
    RESET_SESSION_COUNT,
    CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
    TOGGLE_SELECTED_PHOTO,
    UPDATE_COUNT_REMAINING,
    UPDATE_PERCENT,
    URL
} from './types';

/**
 * Add a photo from camera - current session
 */
export const addPhoto = (photo) => {
    return {
        type: ADD_PHOTO,
        payload: photo
    };
}

/**
 * When the app loads, if any camera photos exist, load them here
 */
export const loadCameraPhotosFromAsyncStorage = (photos) => {
  return {
      type: LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
      payload: photos
  };
}

/**
 * Confirm Button Pressed on LitterPicker
 */
export const confirmSessionTags = (data) => {
    return {
        type: CONFIRM_SESSION_TAGS,
        payload: data
    };
}

/**
 * Delete selected photo
 */
export const deleteSelectedPhoto = (index) => {
    return {
        type: DELETE_SELECTED_PHOTO,
        payload: index
    };
}

/**
 * Change selected => false on all photos
 */
export const deselectAllCameraPhotos = () => {
    return {
        type: DESELECT_ALL_CAMERA_PHOTOS // REMOVE_ALL_SELECTED_PHOTOS
    };
}

/**
 * Reset session count to 0 when all uploads completed successfully
 */
export const resetSessionCount = () => {
    return {
        type: RESET_SESSION_COUNT
    };
}

/**
 * When uploading, reset x (x / total) to 0
 */
export const resetPhotosToUpload = () => {
    return {
        type: RESET_PHOTOS_TOTAL_TO_UPLOAD
    };
}

/**
 * An index of photos taken from the camera has been selected for delete
 */
export const toggleSelectedPhoto = (index) => {
    return {
        type: TOGGLE_SELECTED_PHOTO,
        payload: index
    };
}

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const cameraPhotoUploadedSuccessfully = (index) => {
    return {
        type: CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
        payload: index
    };
}

/**
 * Update progress percentage upload 0-100
 */
export const updatePercent = (percent) => {
    return {
        type: UPDATE_PERCENT,
        payload: percent
    };
}

/**
 *
 */
export const updateRemainingCount = (count) => {
    return {
        type: UPDATE_COUNT_REMAINING,
        payload: count
    };
}

/**
 * Upload a photo taken using the camera app
 *
 * 1 photo uploaded per request
 *
 *  - note onUploadProgress percentCompleted is different in development and production
 *    https://github.com/axios/axios/issues/639
 **/
export const uploadTaggedCameraPhoto = (data, token, tags) => {

    // let progress = null;
    return (dispatch) => {
        return axios(URL + '/api/photos/submit', {
            method:'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/form-data'
            },
            data: data,
            // need to debug this and make it smooooooth
            // onUploadProgress: (p) => {
            //    progress = p.loaded / p.total; // ( total ) / 2
            //    progress = Math.round(progress * 100);
            //    console.log("Prog 1", progress);
            //    dispatch({
            //      type: CHANGE_UPLOAD_PROGRESS,
            //      payload: progress
            //    });
            //  }
        })
        .then(response => {
            console.log("SUCCESS - Image uploaded - now upload associated data");
            if (response.status === 200)
            {
                return axios(URL + '/api/photos/update', {
                    method:'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    data: {
                        litter: tags,
                        photo_id: response.data.photo_id
                    },
                    // // need to debug this and make it smooth
                    // onUploadProgress: (p) => {
                    //     progress = p.loaded / p.total
                    //     progress = Math.round(progress * 100);
                    //     console.log("Prog 2", progress);
                    //     // dispatch({
                    //     //   type: CHANGE_UPLOAD_PROGRESS,
                    //     //   payload: progress
                    //     // });
                    // }
                })
                .then(resp => {
                    if (resp.status === 200)
                    {
                        console.log("SUCCESS - final status 200");
                        return {
                            success: true
                        };
                    }
                })
                .catch(err => {
                    console.log(err);
                });
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
}

/**
 * Check & get an image uploaded on web that is ready for tagging
 */
export const checkForWebUpload = (token) => {
    return (dispatch) => {
        return axios({
            method: 'get',
            url: URL + '/api/check',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(resp => {
            console.log(resp);
        })
        .catch(err => {
            console.log(err);
        });
    }
}
