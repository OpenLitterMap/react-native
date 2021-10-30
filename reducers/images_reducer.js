import produce from 'immer';

import {
    ADD_IMAGE,
    DELETE_SELECTED_IMAGES,
    TOGGLE_SELECTED_IMAGES
} from '../actions/types';

const INITIAL_STATE = {
    images: []
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
             * Delete selected images -- all images with property selected set to true
             */

            case DELETE_SELECTED_IMAGES:
                return draft.images.filter(image => !image.selected);
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
