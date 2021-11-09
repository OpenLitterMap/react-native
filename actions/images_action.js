import {
    ADD_IMAGE,
    ADD_TAGS_TO_IMAGE,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES
} from './types';

/**
 * action to add images to state
 * @param {Array} images
 * @param {('CAMERA' | 'GALLERY' | 'WEB')} type
 */

export const addImage = (images, type) => {
    // console.log(images);
    return {
        type: ADD_IMAGE,
        payload: { images, type }
    };
};

/**
 * Add tags to images
 */

export const addTagsToImages = (payload) => {
    return {
        type: ADD_TAGS_TO_IMAGE,
        payload: payload
    };
};

/**
 * Decrement the amount of photos selected for deletion
 */
export const decrementSelected = () => {
    return {
        type: DECREMENT_SELECTED
    };
};

/**
 * delete image by id
 * @param {number} id
 */

export const deleteImage = (id) => {
    return {
        type: DELETE_IMAGE,
        payload: id
    };
};

/**
 * Delete selected images -- all images with property selected set to true
 */

export const deleteSelectedImages = () => {
    return {
        type: DELETE_SELECTED_IMAGES
    };
};

/**
 * Change selected => false on all photos
 */
export const deselectAllImages = () => {
    return {
        type: DESELECT_ALL_IMAGES
    };
};

/**
 * Increment the amount of photos selected for deletion
 */

export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
    };
};

/**
 * remove a tag from image
 */
export const removeTagFromImage = (data) => {
    return {
        type: REMOVE_TAG_FROM_IMAGE,
        payload: data
    };
};

/**
 * Toggle if the user wants to Select images for deletion
 */
export const toggleSelecting = () => {
    return {
        type: TOGGLE_SELECTING
    };
};

/**
 * toggle selected property of a image object
 * @param {number} id
 */

export const toggleSelectedImage = (id) => {
    return {
        type: TOGGLE_SELECTED_IMAGES,
        payload: id
    };
};
