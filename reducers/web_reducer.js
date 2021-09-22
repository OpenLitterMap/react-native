import produce from 'immer';
import {
    ADD_TAGS_TO_WEB_IMAGE,
    LOAD_MORE_WEB_IMAGES,
    REMOVE_TAG_FROM_WEB_IMAGE,
    REMOVE_WEB_IMAGE,
    WEB_IMAGES
} from '../actions/types';

// state.auth.email
const INITIAL_STATE = {
    count: 0, // This is the count of all photos to tag
    photos: [] // We load 10 images at a time here
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * Apply tags to one of the web images
             */
            case ADD_TAGS_TO_WEB_IMAGE:
                let image = draft.photos[action.payload.currentIndex];
                let newTags = image.tags;

                let quantity = 1;
                // if quantity exists, assign it
                if (action.payload.tag.hasOwnProperty('quantity')) {
                    quantity = action.payload.tag.quantity;
                }
                let payloadCategory = action.payload.tag.category;
                let payloadTitle = action.payload.tag.title;
                let quantityChanged = action.payload.quantityChanged
                    ? action.payload.quantityChanged
                    : false;

                // check if category of incoming payload already exist in image tags
                if (newTags.hasOwnProperty(payloadCategory)) {
                    // check if title of incoming payload already exist
                    if (newTags[payloadCategory].hasOwnProperty(payloadTitle)) {
                        quantity = newTags[payloadCategory][payloadTitle];

                        // if quantity is changed from picker wheel assign it
                        // else increase quantity by 1
                        quantity = quantityChanged
                            ? action.payload.tag.quantity
                            : quantity + 1;
                    }
                    image.tags[payloadCategory][payloadTitle] = quantity;
                } else {
                    // if incoming payload category doesn't exist on image tags add it
                    image.tags[payloadCategory] = {
                        [payloadTitle]: quantity
                    };
                }

                break;
            /**
             * Remove a tag that has been pressed
             */
            case REMOVE_TAG_FROM_WEB_IMAGE:
                let photo = draft.photos[action.payload.currentIndex];

                // if only one tag in payload category delete the category also
                // else delete only tag
                if (
                    Object.keys(photo.tags[action.payload.category]).length ===
                    1
                ) {
                    delete photo.tags[action.payload.category];
                } else {
                    delete photo.tags[action.payload.category][
                        action.payload.tag
                    ];
                }

                break;

            /**
             * At the end of swiping web.photos, load more images
             */
            case LOAD_MORE_WEB_IMAGES:
                action.payload.map(photo => {
                    draft.photos.push(photo);
                    draft.count++;
                });
                break;

            /**
             * After submitting an image + tags, we filter it from the photos array
             *
             * and decrement the count
             */
            case REMOVE_WEB_IMAGE:
                const index = draft.photos.findIndex(
                    photo => photo.id === action.payload
                );
                if (index !== -1) draft.photos.splice(index, 1);

                draft.count = draft.count - 1;

                break;

            /**
             * Images have been uploaded from the web
             */
            case WEB_IMAGES:
                draft.photos = action.payload.photos;
                draft.count = action.payload.count;
                break;
            default:
                return draft;
        }
    });
}
