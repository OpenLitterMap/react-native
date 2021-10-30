import { ADD_IMAGE, DELETE_SELECTED_IMAGES } from './types';

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
        type: DELETE_SELECTED_IMAGES,
        payload: ids
    };
};
