import React from 'react';
import {
    CLOSE_LITTER_MODAL,
    INCREMENT_SELECTED,
    DECREMENT_SELECTED,
    // TOGGLE_MODAL,
    TOGGLE_LITTER,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
    UNIQUE_VALUE,
    UPDATE_COUNT_TOTAL, URL
} from './types';
import axios from "axios";

/**
 * Close the Litter Picker Modal
 */
export const closeLitterModal = () => {
   return {
       type: CLOSE_LITTER_MODAL
   };
}

/**
 * Decrement the amount of photos selected
 * also - update random variable to change state
 *      - not sure if this is actually necessary?
 */
export const decrementSelected = () => {
    return {
        type: DECREMENT_SELECTED
    };
}

/**
 * Increment the amount of photos selected
 * also - update random variable to change state
 *      - not sure if this is actually necessary?
 */
export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
    };
}

 /**
  * Increment the Unique value to force change state
  ** todo - probably not this.
  */
export const incrUnique = () => {
    return {
        type: UNIQUE_VALUE
    };
}

/**
 * Update the total number of photos to be uploaded
 */
export const updateTotalCount = (count) => {
    return {
        type: UPDATE_COUNT_TOTAL,
        payload: count
    };
}

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
export const uploadPhoto = (token, image) =>
{
    // let progress = null;
    return (dispatch) => {
        return axios(URL + '/api/photos/submit', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/form-data'
            },
            data: image
            // need to debug this and make it smooth
            // onUploadProgress: (p) => {
            //    progress = p.loaded / p.total; // ( total ) / 2
            //    progress = Math.round(progress * 100);
            //    console.log(progress);
            //    dispatch({
            //      type: CHANGE_UPLOAD_PROGRESS,
            //      payload: progress
            //    });
            //  }
        })
        .then(response => {
            console.log('Response: shared_actions.uploadPhoto', response.data);

            if (response.data.success)
            {
                // return the photo.id that has been created on the backend
                return {
                    success: true,
                    photo_id: response.data.photo_id
                }
            }
        })
        .catch(error => {
            console.log('ERROR: shared_actions.upload_photo', error.response.data);
        });
    }
}

/**
 * Upload the tags that were applied to an image
 */
export const uploadTags = (token, tags, photo_id) => {
    return (dispatch) => {
        return axios(URL + '/api/add-tags', {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + token
            },
            data: {
                litter: tags,
                photo_id: photo_id
            }
            // need to debug this and make it smooth
            // onUploadProgress: (p) => {
            //    progress = p.loaded / p.total
            //    progress = Math.round(progress * 100);
            //    console.log(progress);
            //    // dispatch({
            //    //   type: CHANGE_UPLOAD_PROGRESS,
            //    //   payload: progress
            //    // });
            //  }
        })
        .then(resp => {
            console.log('uploadGalleryPhotoTags', resp.data);

            if (resp.data.success)
            {
                return {
                    success: true
                };
            }
        })
        .catch(err => {
            console.log('uploadGalleryPhotoTags', err);
        });
    }
}

/**
 * Toggle Litter content inside Modal on / off
 */
export const toggleLitter = () => {
    return {
        type: TOGGLE_LITTER
    };
}

export const toggleThankYou = () => {
    return {
        type: TOGGLE_THANK_YOU
    };
}

/**
 * Toggle Uploaad content inside modal on / off
 */
export const toggleUpload = () => {
    return {
        type: TOGGLE_UPLOAD
    };
}

/**
 * Toggle if the user wnts to Select + Delete a photo
 */
export const toggleSelecting = () => {
    return {
        type: TOGGLE_SELECTING
    };
}
