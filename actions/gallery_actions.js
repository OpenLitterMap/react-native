import React from 'react';

import {
    ADD_TAGS_TO_GALLERY_IMAGE,
    CHANGE_UPLOAD_PROGRESS,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    REMOVE_TAG_FROM_GALLERY_PHOTO,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY,
    URL
} from './types';

/**
 * Create or Update tags on a gallery image
 */
export const addTagsToGalleryImage = tags => {
    return {
        type: ADD_TAGS_TO_GALLERY_IMAGE,
        payload: tags
    };
};

/**
 * Delete selected gallery / camera roll photo
 */
export const deleteSelectedGallery = photo => {
    return {
        type: DELETE_SELECTED_GALLERY,
        payload: photo
    };
};

/**
 * Change selected => false on all gallery photos
 */
export const deselectAllGalleryPhotos = () => {
    return {
        type: DESELECT_ALL_GALLERY_PHOTOS
    };
};

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const galleryPhotoUploadedSuccessfully = index => {
    return {
        type: GALLERY_UPLOADED_SUCCESSFULLY,
        payload: index
    };
};

/**
 * Toggle ActivityIndicator when Photo Albums are finished / loading
 */
export const setImagesLoading = bool => {
    return {
        type: TOGGLE_IMAGES_LOADING,
        payload: bool
    };
};

/**
 * Add photos from gallery to redux
 */
export const photosFromGallery = photos => {
    return {
        type: PHOTOS_FROM_GALLERY,
        payload: photos
    };
};

/**
 * A tag has been selected from a gallery photo
 */
export const removeTagFromGalleryPhoto = data => {
    return {
        type: REMOVE_TAG_FROM_GALLERY_PHOTO,
        payload: data
    };
};

/**
 * Open or Close the Gallery Image Picker
 */
export const toggleImageBrowser = () => {
    return {
        type: TOGGLE_IMAGE_BROWSER
    };
};

/**
 * When uploading, reset x ( x / total )
 */
export const resetGalleryToUpload = () => {
    return {
        type: RESET_GALLERY_TOTAL_TO_UPLOAD
    };
};

/**
 * Toggle the value of a photo.selected
 */
export const toggleSelectedGallery = index => {
    return {
        type: TOGGLE_SELECTED_GALLERY,
        payload: index
    };
};