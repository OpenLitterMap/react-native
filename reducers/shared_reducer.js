import { produce } from 'immer';
import {
    CANCEL_UPLOAD,
    CHECK_APP_VERSION,
    CLOSE_THANK_YOU_MESSAGES,
    SHOW_THANK_YOU_MESSAGES_AFTER_UPLOAD,
    START_UPLOADING,
    TOGGLE_THANK_YOU,
    TOGGLE_UPLOAD,
} from '../actions/types';

const INITIAL_STATE = {
    appVersion: null,
    isSelecting: false,
    isUploading: false,
    selected: 0,
    showModal: false,
    showThankYouMessages: false,
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * During upload, the user pressed cancel.
             */
            case CANCEL_UPLOAD:
                draft.showModal = false;
                draft.isUploading = false;
                break;

            /**
             * Gets and saves latest app version available on playstores
             */
            case CHECK_APP_VERSION:
                draft.appVersion = action.payload;
                break;

            /**
             * After uploading,
             * Thank you messages are shown,
             * Now we hide the modal and messages.
             */
            case CLOSE_THANK_YOU_MESSAGES:
                draft.showModal = false;
                draft.showThankYouMessages = false;
                break;

            /**
             * Show Thank You + upload messages after uploading
             */
            case SHOW_THANK_YOU_MESSAGES_AFTER_UPLOAD:
                draft.isUploading = false;
                draft.showThankYouMessages = true;
                break;

            /**
             * We have begun uploading
             *
             * 1. Show the modal
             * 2. Show the Uploading component
             */
            case START_UPLOADING:
                draft.showModal = true;
                draft.isUploading = true;
                break;

            // /**
            //  * Toggles thank you modal after image uploaded
            //  */
            // case TOGGLE_THANK_YOU:
            //     draft.showModal = !draft.showModal;
            //     draft.thankYouVisible = !draft.thankYouVisible;
            //     break;

            // /**
            //  * Toggle the modal and the upload component
            //  */
            // case TOGGLE_UPLOAD:
            //     draft.showModal = !draft.showModal;
            //     draft.isUploading = !draft.isUploading;
            //     break;

            default:
                return draft;
        }
    });
}
