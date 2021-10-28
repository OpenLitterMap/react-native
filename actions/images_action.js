import { ADD_IMAGE } from './types';

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
