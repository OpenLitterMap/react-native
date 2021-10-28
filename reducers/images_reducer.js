import produce from 'immer';

import { ADD_IMAGE } from '../actions/types';

const INITIAL_STATE = {
    images: []
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            //
            case ADD_IMAGE:
                // console.log(JSON.stringify(action.payload, null, 2));
                action.payload.images.map(image => {
                    draft.images.push({
                        id: draft.images.length,
                        lat: image.lat,
                        lon: image.lon,
                        uri: image.result.uri,
                        filename: image.filename,
                        date: image.date,
                        type: action.payload.type,
                        selected: false,
                        tags: {},
                        picked_up: false
                    });
                });

                break;

            default:
                return draft;
        }
    });
}
