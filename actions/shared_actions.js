import React from 'react';
import {
  CLOSE_LITTER_MODAL,
  INCREMENT_SELECTED,
  DECREMENT_SELECTED,
  // TOGGLE_MODAL,
  TOGGLE_LITTER,
  TOGGLE_SELECTING,
  TOGGLE_THANK_YOU,
  TOGGLE_UPLOAD,
  UNIQUE_VALUE,
  UPDATE_COUNT_TOTAL
} from './types';

/**
 * Close the Litter Picker Modal
 */
export const closeLitterModal = () => {
   return {
       type: CLOSE_LITTER_MODAL
   };
}

/**
 * Decrement the amount of photos selected
 * also - update random variable to change state
 *      - not sure if this is actually necessary?
 */
export const decrementSelected = () => {
    return {
        type: DECREMENT_SELECTED
    };
}

/**
 * Increment the amount of photos selected
 * also - update random variable to change state
 *      - not sure if this is actually necessary?
 */
export const incrementSelected = () => {
    return {
        type: INCREMENT_SELECTED
    };
}

 /**
  * Increment the Unique value to force change state
  ** todo - probably not this.
  */
export const incrUnique = () => {
    return {
        type: UNIQUE_VALUE
    };
}

/**
 * Update the total number of photos to be uploaded
 */
export const updateTotalCount = (count) => {
    return {
        type: UPDATE_COUNT_TOTAL,
        payload: count
    };
}

// /**
//  * Turn Modal on / off
//  */
// -> deleted.
// export const toggleModal = () => {
//   return {
//     type: TOGGLE_MODAL
//   };
// }

/**
 * Toggle Litter content inside Modal on / off
 */
export const toggleLitter = () => {
    return {
        type: TOGGLE_LITTER
    };
}

export const toggleThankYou = () => {
    return {
        type: TOGGLE_THANK_YOU
    };
}

/**
 * Toggle Uploaad content inside modal on / off
 */
export const toggleUpload = () => {
    return {
        type: TOGGLE_UPLOAD
    };
}

/**
 * Toggle if the user wnts to Select + Delete a photo
 */
export const toggleSelecting = () => {
    return {
        type: TOGGLE_SELECTING
    };
}
