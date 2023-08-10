import { produce } from 'immer';
import { LOAD_MORE_WEB_IMAGES } from '../actions/types';

// state.auth.email
const INITIAL_STATE = {
    count: 0, // This is the count of all photos to tag
    photos: [] // We load 10 images at a time here
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * At the end of swiping web.photos, load more images
             */
            case LOAD_MORE_WEB_IMAGES:
                action.payload.map(photo => {
                    draft.photos.push(photo);
                    draft.count++;
                });

                break;

            default:
                return draft;
        }
    });
}
