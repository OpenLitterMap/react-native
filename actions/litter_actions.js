import React from 'react'

import {
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    CHANGE_SWIPER_INDEX,
    LITTER_SELECTED,
    PHOTO_SELECTED_FOR_TAGGING,
    REMOVE_TAG,
    RESET_LITTER_STATE,
    RESET_TAGS,
    UPDATE_PREVIOUS_TAGS,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SUGGEST_TAGS,
    TAG_LITTER,
    TOGGLE_SWITCH,
    UPDATE_TAGS,
    UPDATE_TAGS_X_POS,
    UPDATE_QUANTITY,
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
 * Change the index of the swiper
 *
 * Needs to be extracted to Redux as the number of web-photos changes when 1 is submitted
 */
export const swiperIndexChanged = index => {
    return {
        type: CHANGE_SWIPER_INDEX,
        payload: index
    };
}

/**
 * Text to suggest tags by
 */
export const suggestTags = (data) => {
    return {
        type: SUGGEST_TAGS,
        payload: {
            text: data.text,
            lang: data.lang
        }
    };
}

/**
 * New - A photo has been selected for tagging
 *
 * Can be one of Web, Camera, or Gallery
 */
export const photoSelectedForTagging = (photo) => {
    return {
        type: PHOTO_SELECTED_FOR_TAGGING,
        payload: photo
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
 * Reset the tags only
 *
 * Used when web-image is submitted with tags
 */
export const resetTags = () => {
    return {
        type: RESET_TAGS
    };
}

/**
 * Reset the state
 */
export const resetLitterTags = () => {
    return {
        type: RESET_LITTER_STATE
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
 * Capture the X positions of the tags when they are added / change
 */
export const updateTagXPosition = (data) => {
    return {
        type: UPDATE_TAGS_X_POS,
        payload: data
    };
}
