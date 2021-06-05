import React from 'react'
import axios from 'axios'

import {
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_GALLERY_TAGS,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY,
    URL,
} from './types'

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
 */
export const uploadTaggedGalleryPhoto = (data, token, tags) =>
{
    // let progress = null;
    return async (dispatch) => {
        return await axios(URL + '/api/photos/submit', {
            method:'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/form-data'
            },
            data: data,
            // need to debug this and make it smooth
            // onUploadProgress: (p) => {
            //    progress = p.loaded / p.total; // ( total ) / 2
            //    progress = Math.round(progress * 100);
            //    console.log('Prog 1', progress);
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
                return axios(URL + '/api/v2/add-tags', {
                    method:'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    data: {
                        litter: tags,
                        photo_id: response.data.photo_id
                    }
                    // need to debug this and make it smooth
                    // onUploadProgress: (p) => {
                    //    progress = p.loaded / p.total
                    //    progress = Math.round(progress * 100);
                    //    console.log('Prog 2', progress);
                    //    // dispatch({
                    //    //   type: CHANGE_UPLOAD_PROGRESS,
                    //    //   payload: progress
                    //    // });
                    //  }
                })
                .then(resp => {
                    console.log('upload_tags_after_image', resp.data);

                    if (resp.data.success)
                    {
                        // todo - delete image from users device
                        // try {
                        //   console.log("Try - delete image from users device");
                        //   let path = data["_parts"][0][1]['uri'];
                        //   console.log("Image path to delete", path);
                        //   let resp = FileSystem.deleteAsync(path);
                        //
                        //   console.log(resp);
                        // } catch (e) {
                        //   console.log("Error deleting", e);
                        // }

                        // dispatch({
                        //   type: DELETE_GALLERY_UPLOAD_SUCCESS,
                        //   payload: data
                        // });

                        return {
                            success: true
                        };
                    }
                })
                .catch(err => {
                    console.log('uploadGalleryPhotoTags', err.response.data);
                });
            }
        })
        .catch(error => {
            console.log('uploadTaggedGalleryPhoto', error.response.data);
        });
    }
}
