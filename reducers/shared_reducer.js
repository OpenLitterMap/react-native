import {
    CHECK_APP_VERSION,
    CLOSE_LITTER_MODAL,
    DECREMENT_SELECTED,
    INCREMENT_SELECTED,
    TOGGLE_LITTER,
    TOGGLE_SELECTING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD
} from '../actions/types';

const INITIAL_STATE = {
    selected: 0,
    isSelecting: false,
    litterVisible: false, // show LitterPicker
    modalVisible: false,
    thankYouVisible: false,
    uploadVisible: false,
    appVersion: null
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case CHECK_APP_VERSION:
            return {
                ...state,
                appVersion: action.payload
            };
        case CLOSE_LITTER_MODAL:
            return {
                ...state,
                modalVisible: false,
                litterVisible: false
            };

        case DECREMENT_SELECTED:
            return {
                ...state,
                selected: state.selected - 1
            };

        case INCREMENT_SELECTED:
            return {
                ...state,
                selected: state.selected + 1
            };

        /**
         * Toggle the modal and the litter component
         */
        case TOGGLE_LITTER:
            return {
                ...state,
                modalVisible: !state.modalVisible,
                litterVisible: !state.litterVisible
            };

        case TOGGLE_THANK_YOU:
            return {
                ...state,
                modalVisible: !state.modalVisible,
                thankYouVisible: !state.thankYouVisible
            };

        /**
         * Toggle the modal and the upload component
         */
        case TOGGLE_UPLOAD:
            return {
                ...state,
                modalVisible: !state.modalVisible,
                uploadVisible: !state.uploadVisible
            };

        /**
         * Does the User want to delete selected photos?
         */
        case TOGGLE_SELECTING:
            return {
                ...state,
                selected: 0,
                isSelecting: !state.isSelecting
            };

        default:
            return state;
    }
}
