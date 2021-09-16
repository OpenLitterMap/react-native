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
    switch (action.type) {
        /**
         * Apply tags to one of the web images
         */
        case ADD_TAGS_TO_WEB_IMAGE:
            let webPhotos = [...state.photos];

            let image = webPhotos[action.payload.currentIndex];

            // update tags on image
            let newTags = { ...image.tags };

            // update tags on image
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

                    if (quantityChanged) {
                        quantity = action.payload.tag.quantity;
                    } else {
                        quantity++;
                    }
                }
            }

            // create a new object with the new values
            newTags = {
                ...newTags,
                [payloadCategory]: {
                    ...newTags[payloadCategory],
                    [payloadTitle]: quantity
                }
            };

            image.tags = newTags;

            return {
                ...state,
                photos: webPhotos
            };

        /**
         * Remove a tag that has been pressed
         */
        case REMOVE_TAG_FROM_WEB_IMAGE:
            let updatedWebPhotos = [...state.photos];

            let img = updatedWebPhotos[action.payload.currentIndex];
            delete img.tags[action.payload.category][action.payload.tag];

            // Delete the category if empty
            if (Object.keys(img.tags[action.payload.category]).length === 0) {
                delete img.tags[action.payload.category];
            }

            return {
                ...state,
                photos: updatedWebPhotos
            };

        /**
         * At the end of swiping web.photos, load more images
         */
        case LOAD_MORE_WEB_IMAGES:
            let web_images = [...state.photos];

            action.payload.photos.forEach(photo => {
                web_images.push(photo);
            });

            return {
                ...state,
                photos: web_images
            };

        /**
         * After submitting an image + tags, we filter it from the photos array
         *
         * and decrement the count
         */
        case REMOVE_WEB_IMAGE:
            const filtered = state.photos.filter(
                photo => photo.id !== action.payload
            );

            const count = state.count - 1;

            return {
                ...state,
                photos: filtered,
                count
            };

        /**
         * Images have been uploaded from the web
         */
        case WEB_IMAGES:
            const photos = (state.photos = [
                ...state.photos.slice(0, 0),
                ...state.photos.slice(1)
            ]);

            return {
                ...state,
                count: action.payload.count,
                photos: action.payload.photos
            };

        default:
            return state;
    }
}
