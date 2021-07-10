import React from 'react';
import axios from 'axios';
import {
  ADD_PHOTO,
  ADD_TAGS_TO_CAMERA_PHOTO,
  CAMERA_INDEX_CHANGED,
  LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
  CHANGE_UPLOAD_PROGRESS,
  CONFIRM_SESSION_TAGS,
  DELETE_SELECTED_PHOTO, // current session
  DESELECT_ALL_CAMERA_PHOTOS,
  RESET_PHOTOS_TOTAL_TO_UPLOAD,
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
 * One of the photos was selected for tagging
 */
export const cameraIndexChanged = index => {
  return {
    type: CAMERA_INDEX_CHANGED,
    payload: index
  };
};

// /**
//  *
//  */
// export const addTag = (tag) => {
//     return {
//         type: 'ADD_TAG',
//         payload: tag
//     };
// }

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
 * Confirm Button Pressed on LitterPicker
 */
export const confirmSessionTags = data => {
  return {
    type: CONFIRM_SESSION_TAGS,
    payload: data
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
 * When uploading, reset x (x / total) to 0
 */
export const resetPhotosToUpload = () => {
  return {
    type: RESET_PHOTOS_TOTAL_TO_UPLOAD
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
