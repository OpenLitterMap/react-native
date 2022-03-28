import produce from 'immer';
import { ADD_GEOTAGGED_IMAGES, TOGGLE_IMAGES_LOADING } from '../actions/types';

const INITIAL_STATE = {
    imagesLoading: false,
    geotaggedImages: [], // array of geotagged images
    camerarollImageFetched: false,
    lastFetchTime: null,
    isNextPageAvailable: false,
    lastImageCursor: null
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * The users images have finished loading
             */

            case TOGGLE_IMAGES_LOADING:
                draft.imagesLoading = action.payload;

                break;

            /**
             * add array of geotagged images to state
             */

            case ADD_GEOTAGGED_IMAGES:
                const geotaggedImages = [
                    ...action.payload.geotagged,
                    ...draft.geotaggedImages
                ];

                draft.geotaggedImages = geotaggedImages;
                draft.camerarollImageFetched = true;
                draft.lastFetchTime = Math.floor(new Date().getTime());
                draft.imagesLoading = false;
                if (action.payload.fetchType !== 'TIME') {
                    draft.isNextPageAvailable = action.payload.hasNextPage;
                    draft.lastImageCursor = action.payload.endCursor;
                }

                break;

            default:
                return draft;
        }
    });
}
