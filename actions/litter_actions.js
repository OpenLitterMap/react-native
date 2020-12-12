import React from 'react'

import {
    ADD_PREVIOUS_TAG,
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    // CONFIRM_FOR_UPLOAD,
    ITEM_SELECTED,
    REMOVE_PREVIOUS_TAG,
    REMOVE_TAG,
    RESET_LITTER_COLLECTION_OBJECT,
    UPDATE_PREVIOUS_TAGS,
    SAVE_PREVIOUS_TAGS,
    SELECT_PHOTO,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SLIDE_IN_NEXT_GALLERY,
    SUGGEST_TAGS,
    TAG_LITTER,
    TOGGLE_SWITCH,
    UPDATE_TAGS,
    UPDATE_TAGS_X_POS,
    UPDATE_QUANTITY
} from './types';

/**
 * Change the category of litter eg Smoking, Alcohol
 */
export const changeCategory = (id) => {
    return {
        type: CHANGE_CATEGORY,
        payload: id
    };
}

/**
 * Change the item of litter in a category eg butts, lighters
 */
export const changeItem = (item) => {
    return {
        type: CHANGE_ITEM,
        payload: item
    };
}

/**
 * Change Quantity of litter
 */
export const changeQ = (q) => {
    return {
        type: CHANGE_Q,
        payload: q
    };
}

/**
 * Text to suggest tags by
 */
export const suggestTags = (text) => {
    return {
        type: SUGGEST_TAGS,
        payload: text
    };
}

/**
 * Select the photo passed
 */
export const selectPhoto = (photo) => {
    return {
        type: SELECT_PHOTO,
        payload: photo
    };
}

/**
 * The user has selected a photo from Web, Photos or Gallery on Leftpage or LitterPicker
 */
export const itemSelected = item => {
    return {
        type: ITEM_SELECTED,
        payload: item
    };
}

/**
 * Remove a tag and its quantity
 */
export const removeTag = tags => {
    return {
        type: REMOVE_TAG,
        payload: tags
    };
}

/**
 * Reset the state, collectionObject and close the LitterPicker modal
 */
export const resetLitterObject = () => {
    return {
        type: RESET_LITTER_COLLECTION_OBJECT
    };
}

/**
 * Slide in the next photo for tagging
 */
export const slideInNext = (item) => {
    return {
        type: SLIDE_IN_NEXT_GALLERY,
        payload: item
    };
}

/**
 * User.previous_tags is true
 */
export const updateTags = tags => {
    return {
        type: UPDATE_TAGS,
        payload: tags
    };
}

/**
 * Content to show in LitterPicker modal
 * @show allTags
 */
export const showAllTags = bool => {
    return {
        type: SHOW_ALL_TAGS,
        payload: bool
    };
}

/**
 * Open / Close the modal on LitterPicker.js
 */
export const setLitterPickerModal = (bool) => {
    return {
        type: SHOW_INNER_MODAL,
        payload: bool
    };
}

/**
 * Is the litter still there, or has it been picked up?
 */
export const toggleSwitch = () => {
    return {
        type: TOGGLE_SWITCH
    };
}

/**
 * Add data + quantity to tags
 */
export const tagLitter = (tags) => {
    return {
        type: TAG_LITTER,
        payload: tags
    };
}

/**
 * Change the quantity of an existing piece of litter
 */
export const updateLitterQuantity = (tags) => {
    return {
        type: UPDATE_QUANTITY,
        payload: tags
    };
}

/**
 *
 */
export const updatePreviousTags = tags => {
    return {
        type: UPDATE_PREVIOUS_TAGS,
        payload: tags
    };
}

/**
 * Some users want to quickly select previous tags
 */
export const savePreviousTags = tags => {
    return {
        type: SAVE_PREVIOUS_TAGS,
        payload: tags
    };
}

/**
 * Capture the X positions of the tags when they are added / change
 */
export const updateTagXPosition = (data) => {
    return {
        type: UPDATE_TAGS_X_POS,
        payload: data
    };
}
