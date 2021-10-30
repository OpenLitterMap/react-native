import produce from 'immer';

import {
    ADD_IMAGE,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES
} from '../actions/types';

const INITIAL_STATE = {
    images: [],
    isSelecting: false,
    selected: 0
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            //
            case ADD_IMAGE:
                const images = action.payload.images;
                images &&
                    images.map(image => {
                        draft.images.push({
                            id: draft.images.length,
                            lat: image.lat,
                            lon: image.lon,
                            uri: image.uri,
                            filename: image.filename,
                            date: image.date,
                            type: action.payload.type,
                            selected: false,
                            tags: {},
                            picked_up: false
                        });
                    });

                break;

            /**
             * Decrement the count of images selected for deletion
             */
            case DECREMENT_SELECTED:
                draft.selected = draft.selected - 1;

                break;

            /**
             * delete image by id
             *
             * here id  ===  index
             */

            case DELETE_IMAGE:
                console.log('================');
                console.log(action.payload);
                draft.images.splice(action.payload, 1);
                break;
            /**
             * Delete selected images -- all images with property selected set to true
             */

            case DELETE_SELECTED_IMAGES:
                draft.images = draft.images.filter(image => !image.selected);
                draft.selected = 0;
                break;

            /**
             * When isSelecting is turned off,
             *
             * Change selected value on every image to false
             */

            case DESELECT_ALL_IMAGES:
                draft.images.map(image => {
                    image.selected = false;
                });

                break;

            /**
             * Increment the count of images selected for deletion
             */

            case INCREMENT_SELECTED:
                draft.selected = draft.selected + 1;

                break;

            /**
             * Toggles isSelecting -- selecting images for deletion
             */
            case TOGGLE_SELECTING:
                draft.selected = 0;
                draft.isSelecting = !draft.isSelecting;

                break;

            /**
             * toggle selected property of a image object
             */

            case TOGGLE_SELECTED_IMAGES:
                draft.images[action.payload].selected = !draft.images[
                    action.payload
                ].selected;

                break;

            default:
                return draft;
        }
    });
}
