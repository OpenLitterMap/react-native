import {
    CLOSE_LITTER_MODAL,
    DECREMENT_SELECTED,
    INCREMENT_SELECTED,
    // TOGGLE_MODAL,
    TOGGLE_LITTER,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
    UNIQUE_VALUE,
    UPDATE_COUNT_TOTAL
} from '../actions/types';

const INITIAL_STATE = {
    selected: 0,
    isSelecting: false,
    litterVisible: false,
    modalVisible: false,
    thankYouVisible: false,
    totalImagesToUpload: 0,
    uniqueValue: 0,
    uploadVisible: false,
};

export default function(state = INITIAL_STATE, action) {

    switch (action.type)
    {
        case CLOSE_LITTER_MODAL:
            return {
                ...state,
                modalVisible: false,
                litterVisible: false
            };

        case DECREMENT_SELECTED:
            return {
                ...state,
                selected: state.selected - 1,
                uniqueValue: state.uniqueValue +1
            };

        case INCREMENT_SELECTED:
            return {
                ...state,
                selected: state.selected + 1,
                uniqueValue: state.uniqueValue +1
            };

        // /**
        //  * Toggle only the modal
        //  */
        // case TOGGLE_MODAL:
        //   return {
        //     ...state,
        //     modalVisible: ! state.modalVisible
        //   };

        /**
         * Toggle the modal and the litter component
         */
        case TOGGLE_LITTER:
            return {
                ...state,
                modalVisible: ! state.modalVisible,
                litterVisible: ! state.litterVisible
            };

        case TOGGLE_THANK_YOU:
            return {
                ...state,
                modalVisible: ! state.modalVisible,
                thankYouVisible: ! state.thankYouVisible
            };

        /**
         * Toggle the modal and the upload component
         */
        case TOGGLE_UPLOAD:
            return {
                ...state,
                modalVisible: ! state.modalVisible,
                uploadVisible: ! state.uploadVisible
            };

        /**
         * Does the User want to delete selected photos?
         */
        case TOGGLE_SELECTING:
            return {
                ...state,
                selected: 0,
                isSelecting: ! state.isSelecting
                // uniqueValue: state.uniqueValue + 1
            };

        case UNIQUE_VALUE:
            return {
                ...state,
                uniqueValue: state.uniqueValue + 1
            };

        case UPDATE_COUNT_TOTAL:
            return {
                ...state,
                totalImagesToUpload: action.payload
            };

        default:
            return state;
    }
};
