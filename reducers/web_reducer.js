import {
    WEB_CONFIRM,
    WEB_IMAGES
} from '../actions/types';

// state.auth.email
const INITIAL_STATE = {
    images: [],
};

export default function(state = INITIAL_STATE, action) {

    switch (action.type) {

        /**
         * Toggle webImageSuccess to show modal content on LitterPicker
         */
        case WEB_CONFIRM:

            let images = state.images = [
                ...state.images.slice(0, 0),
                ...state.images.slice(0 + 1)
            ];

            return {
                ...state,
                images
            };

        /**
         * Images have been uploaded from the web
         */
        case WEB_IMAGES:
            return {
                ...state,
                images: action.payload
            };

        default:
            return state;
    }
}
