import React from 'react';
import axios from 'axios';
import {
    ADD_PHOTO,
    CHANGE_UPLOAD_PROGRESS,
    CLOSE_LITTER_MODAL,
    CONFIRM_SESSION_ITEM,
    // DELETE_SELECTED_GALLERY, // camera roll
    DELETE_SELECTED_PHOTO, // current session
    PHOTOS_FROM_GALLERY,
    INCREMENT,
    // ITEM_SELECTED,
    REMOVE_ALL_SELECTED_PHOTOS,
    RESET_PHOTOS_TOTAL_TO_UPLOAD,
    RESET_SESSION_COUNT,
    SESSION_REMOVED_FOR_DELETE,
    SESSION_SELECTED_FOR_DELETE,
    SESSION_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTING,
    UPDATE_COUNT_REMAINING,
    UPDATE_PERCENT,
    UPLOAD_PHOTOS,
    UPLOAD_COMPLETE_SUCCESS,
    UNIQUE_VALUE,
    URL
} from './types';

/**
 * Add a photo from camera - current session
 */
export const addPhoto = (photo) => {
    // console.log("Photo actions, add session photo", photo);
    return {
        type: ADD_PHOTO,
        payload: photo
    };
}

/**
 * Confirm Button Pressed on LitterPicker
 */
export const confirmSessionItem = (data) => {
    return {
        type: CONFIRM_SESSION_ITEM,
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
 * Remove ['selected'] from any gallery items set to be deleted
 */
export const removeAllSelectedPhotos = () => {
    return {
        type: REMOVE_ALL_SELECTED_PHOTOS
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

// todo - could probably merge these into toggle.
/**
 * An index of gallery has been removed for delete
 */
export const sessionIndexRemoveForDelete = (index) => {
    return {
        type: SESSION_REMOVED_FOR_DELETE,
        payload: index
    };
}

/**
 * An index of gallery has been selected for delete
 */
export const sessionIndexSelectedForDelete = (index) => {
    return {
        type: SESSION_SELECTED_FOR_DELETE,
        payload: index
    };
}

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const sessionPhotoUploadedSuccessfully = (index) => {
    return {
        type: SESSION_UPLOADED_SUCCESSFULLY,
        payload: index
    };
}

/**
 * The user selected a photo on LeftPage
 */
// export const itemSelected = (item) => {
//   console.log("photos action - itemSelected");
//   console.log(item);
//   return {
//     type: ITEM_SELECTED,
//     payload: item
//   };
// }

// export const toggleSelecting = () => {
//   return {
//     type: TOGGLE_SELECTING
//   };
// }

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
 * Upload 1 photo per request
 *  - note onUploadProgress percentCompleted is different in development and production
 *    https://github.com/axios/axios/issues/639
 **/
export const uploadTaggedSessionPhotos = (data, token, litterData) => {
    console.log("Action - upload tagged Gallery photo");
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
            if (response.status == 200) {
                return axios(URL + '/api/photos/update', {
                    method:'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    data: {
                        litter: litterData,
                        photo_id: response.data.photo_id
                    },
                    // need to debug this and make it smooooooth
                    onUploadProgress: (p) => {
                        progress = p.loaded / p.total
                        progress = Math.round(progress * 100);
                        console.log("Prog 2", progress);
                        // dispatch({
                        //   type: CHANGE_UPLOAD_PROGRESS,
                        //   payload: progress
                        // });
                    }
                })
                    .then(resp => {
                        console.log("SUCCESS - Litter data for image updated");
                        console.log(resp.data);
                        if (resp.status == 200) {
                            console.log("SUCCESS - final status 200");
                            return {
                                message: 'success'
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
