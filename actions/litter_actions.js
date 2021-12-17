import React from 'react';

import {
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    CHANGE_QUANTITY_STATUS,
    CHANGE_SWIPER_INDEX,
    RESET_LITTER_STATE,
    UPDATE_PREVIOUS_TAGS,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SUGGEST_TAGS,
    TOGGLE_SWITCH,
    UPDATE_TAGS_X_POS,
    UPDATE_QUANTITY
} from './types';

/**
 * Change the category of litter eg Smoking, Alcohol
 */
export const changeCategory = id => {
    return {
        type: CHANGE_CATEGORY,
        payload: id
    };
};

/**
 * Change the item of litter in a category eg butts, lighters
 */
export const changeItem = item => {
    return {
        type: CHANGE_ITEM,
        payload: item
    };
};

/**
 * Change Quantity of litter
 */
export const changeQ = q => {
    return {
        type: CHANGE_Q,
        payload: q
    };
};

/**
 * Change Status of quantity change
 * picker wheel rotated status == True
 * after tag is added satus set to false
 *
 * If quantityChanged is true -- then while clicking Add Tag button
 * the quantilty value currently in PICKER is added to tag
 *
 * else if quantityChanged is false -- then while clicking Add Tag button
 * quantity currently on TAG + 1 is added on tag.
 *
 * @param {boolean} boolValue
 */
export const changeQuantityStatus = boolValue => {
    return {
        type: CHANGE_QUANTITY_STATUS,
        payload: boolValue
    };
};

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
};

/**
 * Text to suggest tags by
 */
export const suggestTags = (text, lang) => {
    return {
        type: SUGGEST_TAGS,
        payload: {
            text: text,
            lang: lang
        }
    };
};

/**
 * Reset the state
 */
export const resetLitterTags = () => {
    return {
        type: RESET_LITTER_STATE
    };
};

/**
 * Content to show in LitterPicker modal
 * @show allTags
 */
export const showAllTags = bool => {
    return {
        type: SHOW_ALL_TAGS,
        payload: bool
    };
};

/**
 * Open / Close the modal on LitterPicker.js
 */
export const setLitterPickerModal = bool => {
    return {
        type: SHOW_INNER_MODAL,
        payload: bool
    };
};

/**
 * Is the litter still there, or has it been picked up?
 */
export const toggleSwitch = () => {
    return {
        type: TOGGLE_SWITCH
    };
};

/**
 *
 */
export const updatePreviousTags = tags => {
    return {
        type: UPDATE_PREVIOUS_TAGS,
        payload: tags
    };
};

/**
 * Capture the X positions of the tags when they are added / change
 */
export const updateTagXPosition = data => {
    return {
        type: UPDATE_TAGS_X_POS,
        payload: data
    };
};
