import {
    ADD_IMAGE,
    DECREMENT_SELECTED,
    DELETE_SELECTED_IMAGES,
    INCREMENT_SELECTED,
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
 * Delete selected images -- all images with property selected set to true
 */

export const deleteSelectedImages = () => {
    return {
        type: DELETE_SELECTED_IMAGES
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
 * Increment the amount of photos selected for deletion
 */

export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
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

export const toggleSelectedImage = id => {
    return {
        type: TOGGLE_SELECTED_IMAGES,
        payload: id
    };
};
