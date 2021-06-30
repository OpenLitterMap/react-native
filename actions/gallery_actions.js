import React from 'react'
import axios from 'axios'

import {
    ADD_TAGS_TO_GALLERY_IMAGE,
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_GALLERY_TAGS,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_INDEX_CHANGED,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    REMOVE_TAG_FROM_GALLERY_PHOTO,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY,
    URL,
} from './types';

/**
 * Create or Update tags on a gallery image
 */
export const addTagsToGalleryImage = tags => {
    return {
        type: ADD_TAGS_TO_GALLERY_IMAGE,
        payload: tags
    };
}

/**
 * Apply the selected tags to one of the users selected images
 */
export const confirmGalleryTags = data => {
    return {
        type: CONFIRM_GALLERY_TAGS,
        payload: data
    };
}

/**
 * Delete selected gallery / camera roll photo
 */
export const deleteSelectedGallery = (photo) => {
    return {
        type: DELETE_SELECTED_GALLERY,
        payload: photo
    };
}

/**
 * Change selected => false on all gallery photos
 */
export const deselectAllGalleryPhotos = () => {
    return {
        type: DESELECT_ALL_GALLERY_PHOTOS
    };
}

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const galleryPhotoUploadedSuccessfully = (index) => {
    return {
        type: GALLERY_UPLOADED_SUCCESSFULLY,
        payload: index
    };
}

/**
 * A gallery index has been selected for tagging
 */
export const galleryIndexChanged = (index) => {
    return {
        type: GALLERY_INDEX_CHANGED,
        payload: index
    };
}

/**
 * Toggle ActivityIndicator when Photo Albums are finished / loading
 */
export const setImagesLoading = (bool) => {
    return {
        type: TOGGLE_IMAGES_LOADING,
        payload: bool
    };
}

/**
 * Add photos from gallery to redux
 */
export const photosFromGallery = (photos) => {
    return {
        type: PHOTOS_FROM_GALLERY,
        payload: photos
    };
}

/**
 * A tag has been selected from a gallery photo
 */
export const removeTagFromGalleryPhoto = (data) => {
    return {
        type: REMOVE_TAG_FROM_GALLERY_PHOTO,
        payload: data
    };
}

/**
 * Open or Close the Gallery Image Picker
 */
export const toggleImageBrowser = () => {
    return {
        type: TOGGLE_IMAGE_BROWSER
    };
}

/**
 * When uploading, reset x ( x / total )
 */
export const resetGalleryToUpload = () => {
    return {
        type: RESET_GALLERY_TOTAL_TO_UPLOAD
    };
}

/**
 * Toggle the value of a photo.selected
 */
export const toggleSelectedGallery = (index) => {
    return {
        type: TOGGLE_SELECTED_GALLERY,
        payload: index
    };
}

/**
 * Upload a photo selected from the users gallery
 *
 * 1) Upload each gallery photo async that has data
 * 2) then upload the data associated with it
 *
 * todo - delete the image on the users device
 * todo - try and upload all data in 1 request
 * todo - upload images earlier as a background process
 *
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiNGM0OWM5MDdjYTE2MGY5Y2Q0YzEyNGNlYzZjOTczMGM3YjFhN2U4MWZmNTFkMzYzYmY2NDBmOGE3MzNkMjJkNGQ5MTlkYTkzOTExM2E1MjIiLCJpYXQiOjE2MjQ0ODU3OTEsIm5iZiI6MTYyNDQ4NTc5MSwiZXhwIjoxNjU2MDIxNzkxLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.DQIHGpxjIQUmnpmZUYxEXMGUYSSYa4i9x3hxkm_BdMy1AWaXLc6f78G8BLZA1X0rnKCKZHXVLmcguarzA7f0pLXwy9gpikSMfi8iWN4xSPincwFkNKcOefsmwT_mGlY341Hd3oVWD-CDwrtq0O45ViOzFAVsQnwXSqxjaqu-jRdCqy2b5uJdsRZqDT_ZFF-t3Ylk_dFeLJij6SKO_CcaTw-vPi9B-wRfT-QhfWJ7Y2F7PfqZi-IGvS21cjtKwZJO9KhEe8LCc-CtWUQ0mOeB51DT_2A8CEWoX_HGOshaa0xH7c_b_58Ug7TcFAku99aKPPAvvGgm0-sOoshBgbiyfr0IZQBkrlNPoSs6e1diBOgyiyGBbXNn4GqBx3CLm3n2UYymL2OG9P8ROKjIrpj19xOo8nb_X_cJJBrF1G2cZjP0d9eboESwClBiKdW0e_p_v99XVtt2jE0q7Ul8CYZ8PZ5vy4qersOmehsObQA3vcQ4K_p1bSYbyRsJrrpALg0Ok8_I6xVIVDqPBV9PxVDRtsPVif4COcxjOxPnaTO_uf4DlvA61zSpzHXAyOKFk7QmOwNSthf3wajMJDkd3nJqPn4TFQxUjHxm1BcyRhbBI5K9YfnnMKkGFSNuHizYbVMNHDms3GCFtiLyc0UA7kH8-TApWd3WfuWFZju5xYcBEf
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiNGM0OWM5MDdjYTE2MGY5Y2Q0YzEyNGNlYzZjOTczMGM3YjFhN2U4MWZmNTFkMzYzYmY2NDBmOGE3MzNkMjJkNGQ5MTlkYTkzOTExM2E1MjIiLCJpYXQiOjE2MjQ0ODU3OTEsIm5iZiI6MTYyNDQ4NTc5MSwiZXhwIjoxNjU2MDIxNzkxLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.DQIHGpxjIQUmnpmZUYxEXMGUYSSYa4i9x3hxkm_BdMy1AWaXLc6f78G8BLZA1X0rnKCKZHXVLmcguarzA7f0pLXwy9gpikSMfi8iWN4xSPincwFkNKcOefsmwT_mGlY341Hd3oVWD-CDwrtq0O45ViOzFAVsQnwXSqxjaqu-jRdCqy2b5uJdsRZqDT_ZFF-t3Ylk_dFeLJij6SKO_CcaTw-vPi9B-wRfT-QhfWJ7Y2F7PfqZi-IGvS21cjtKwZJO9KhEe8LCc-CtWUQ0mOeB51DT_2A8CEWoX_HGOshaa0xH7c_b_58Ug7TcFAku99aKPPAvvGgm0-sOoshBgbiyfr0IZQBkrlNPoSs6e1diBOgyiyGBbXNn4GqBx3CLm3n2UYymL2OG9P8ROKjIrpj19xOo8nb_X_cJJBrF1G2cZjP0d9eboESwClBiKdW0e_p_v99XVtt2jE0q7Ul8CYZ8PZ5vy4qersOmehsObQA3vcQ4K_p1bSYbyRsJrrpALg0Ok8_I6xVIVDqPBV9PxVDRtsPVif4COcxjOxPnaTO_uf4DlvA61zSpzHXAyOKFk7QmOwNSthf3wajMJDkd3nJqPn4TFQxUjHxm1BcyRhbBI5K9YfnnMKkGFSNuHizYbVMNHDms3GCFtiLyc0UA7kH8-TApWd3WfuWFZju5xYcBEfM
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
            console.log('uploadTaggedGalleryPhoto', response.data);

            if (response.data.success)
            {
                return {
                    success: true,
                    photo_id: response.data.photo_id
                }
            }
        })
        .catch(error => {
            console.log('ERROR:uploadTaggedGalleryPhoto', error.response.data);
        });
    }
}

/**
 * Upload the tags associated with a photo
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