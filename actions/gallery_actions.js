import React from 'react'
import axios from 'axios'

import {
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_GALLERY_ITEM,
    DELETE_GALLERY_UPLOAD_SUCCESS,
    DELETE_SELECTED_GALLERY,
    NEW_SELECTED,
    GALLERY_ITEM_SELECTED,
    GALLERY_REMOVED_FOR_DELETE,
    GALLERY_SELECTED_FOR_DELETE,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    INCREMENT_SELECTED,
    DECREMENT_SELECTED,
    PHOTOS_FROM_GALLERY,
    REMOVE_ALL_SELECTED_GALLERY,
    RESET_GALLERY_COUNT,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    RESET_TOTAL_GALLERY_UPLOADED_COUNT,
    TOGGLE_IMAGE_BROWSER,
    UPDATE_GALLERY_COUNT,
    UPLOAD_TAGGED_GALLERY,
    URL,
    URL_DEV,
    URL_PRODUCTION
} from './types'

/**
 *
 */
export const confirmGalleryItem = data => {
    return {
        type: CONFIRM_GALLERY_ITEM,
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
 *
 */
// export const galleryItemSelected = (item) => {
//   // console.log("action - itemSelected");
//   return {
//     type: ITEM_SELECTED,
//     payload: item
//   };
// }


// todo - could probably merge these into toggle.
/**
 * An index of gallery has been removed for delete
 */
export const galleryIndexRemoveForDelete = (index) => {
    return {
        type: GALLERY_REMOVED_FOR_DELETE,
        payload: index
    };
}

/**
 * An index of gallery has been selected for delete
 */
export const galleryIndexSelectedForDelete = (index) => {
    return {
        type: GALLERY_SELECTED_FOR_DELETE,
        payload: index
    };
}

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const galleryPhotoUploadedSuccessfully = (index, id) => {
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

// TODO - delete the images.
// return async (dispatch) => {
//   try {
//     console.log("Try - delete image from users device");
//     // let path = data["_parts"][0][1]['uri'];
//     // path = path.replace("ph", "file")
//     // console.log("Image path to delete", path);
//     // let del = await FileSystem.deleteAsync(path);
//     let del = await MediaLibrary.deleteAssetsAsync([ id ]);
//
//     console.log("deleted?", del);
//
//     dispatch({
//        type: GALLERY_UPLOADED_SUCCESSFULLY,
//        payload: index
//      });
//
//   } catch (e) {
//     console.log("Error deleting", e);
//   }
// }
// }

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
 *
 */
export const newSelected = (selected) => {
    // console.log('- action -', selected);
    return {
        type: NEW_SELECTED,
        payload: selected
    };
}

/**
 * Remove ['selected'] from any gallery items set to be deleted
 */
export const removeAllSelectedGallery = () => {
    return {
        type: REMOVE_ALL_SELECTED_GALLERY
    };
}

/**
 * Reset gallery count to 0 when all uploads finished successfully
 */
export const resetGalleryCount = () => {
    return {
        type: RESET_GALLERY_COUNT
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
 * Number of images the user has selected in their gallery
 */
export const updateSelectedGalleryCount = (count) => {
    return {
        type: UPDATE_GALLERY_COUNT,
        payload: count
    };
}

/**
 * 1) Upload each gallery photo async that has data
 * 2) then upload the data associated with it
 * todo - delete the image on the users device
 * todo - try and upload all data in 1 request
 * todo - upload images earlier as a background process
 * @data = name, type (gallery, session), uri, lat, lon, presence, model
 * @litterData = smoking: cigarettes: 3.....
 */
export const uploadTaggedGalleryPhoto = (data, token, litterData) => {
    console.log('Action - upload tagged Gallery photo', data);

    let progress = null;
    return async (dispatch) => {
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
            //    console.log('Prog 1', progress);
            //    dispatch({
            //      type: CHANGE_UPLOAD_PROGRESS,
            //      payload: progress
            //    });
            //  }
        })
            .then(response => {
                // console.log('SUCCESS - Image uploaded - now upload associated data');
                if (response.status == 200) {
                    return axios(URL + '/api/photos/update', {
                        method:'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        },
                        data: {
                            litter: litterData,
                            photo_id: response.data.photo_id
                        } //,
                        // need to debug this and make it smooooooth
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
                            // console.log('SUCCESS - Litter data for image updated');
                            // console.log(resp.data);
                            if (resp.status == 200) {
                                // console.log('SUCCESS - final status 200');

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
