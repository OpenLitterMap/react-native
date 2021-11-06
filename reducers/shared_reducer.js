import produce from 'immer';
import {
    CHECK_APP_VERSION,
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
    return produce(state, draft => {
        switch (action.type) {
            /**
             * Gets and saves latest app version available on playstores
             */

            case CHECK_APP_VERSION:
                draft.appVersion = action.payload;

                break;

            /**
             * Toggle the modal and the litter (Add tags) component
             */
            case TOGGLE_LITTER:
                draft.modalVisible = !draft.modalVisible;
                draft.litterVisible = !draft.litterVisible;

                break;

            /**
             * Toggles thank you modal after image uploaded
             */
            case TOGGLE_THANK_YOU:
                draft.modalVisible = !draft.modalVisible;
                draft.thankYouVisible = !draft.thankYouVisible;

                break;

            /**
             * Toggle the modal and the upload component
             */
            case TOGGLE_UPLOAD:
                draft.modalVisible = !draft.modalVisible;
                draft.uploadVisible = !draft.uploadVisible;

                break;

            default:
                return draft;
        }
    });
}
