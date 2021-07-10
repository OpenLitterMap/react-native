import {
    ADD_TAGS_TO_WEB_IMAGE,
    LOAD_MORE_WEB_IMAGES,
    REMOVE_WEB_IMAGE,
    WEB_CONFIRM,
    WEB_IMAGES,
    WEB_INDEX_CHANGED
} from '../actions/types';

// state.auth.email
const INITIAL_STATE = {
    count: 0, // This is the count of all photos to tag
    photos: [], // We load 10 images at a time here
    indexSelected: 0
};

export default function(state = INITIAL_STATE, action)
{
    switch (action.type)
    {
        /**
         * Apply tags to one of the web images
         */
        case ADD_TAGS_TO_WEB_IMAGE:

            let webPhotos = [...state.photos];

            let image = webPhotos[action.payload.currentIndex];

            // update tags on image
            let newTags = Object.assign({}, image.tags);

            let quantity = 1;

            // if quantity exists, assign it
            if (action.payload.hasOwnProperty('quantity'))
            {
                quantity = action.payload.quantity;
            }

            // Increment quantity from the text filter
            // sometimes (when tag is being added from text-filter, quantity does not exist)
            // we check to see if it exists on the object, if so, we can increment it
            if (newTags.hasOwnProperty(action.payload.tag.category))
            {
                if (newTags[action.payload.tag.category].hasOwnProperty(action.payload.tag.title))
                {
                    quantity = newTags[action.payload.tag.category][action.payload.tag.title];

                    if (newTags[action.payload.tag.category][action.payload.tag.title] === quantity) quantity++;
                }
            }

            // create a new object with the new values
            newTags = {
                ...newTags,
                [action.payload.tag.category]: {
                    ...newTags[action.payload.tag.category],
                    [action.payload.tag.title]: quantity
                }
            };

            console.log({ newTags });

            image.tags = newTags;

            return {
                ...state,
                photos: webPhotos
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
            }

        /**
         * After submitting an image + tags, we filter it from the photos array
         *
         * and decrement the count
         */
        case REMOVE_WEB_IMAGE:

            const filtered = state.photos.filter(photo => photo.id !== action.payload);

            const count = state.count - 1;

            return {
                ...state,
                photos: filtered,
                count
            };

        // /**
        //  * Toggle webImageSuccess to show modal content on LitterPicker
        //  */
        // case WEB_CONFIRM:
        //
        //     const photos = state.photos = [
        //         ...state.photos.slice(0, 0),
        //         ...state.photos.slice(1)
        //     ];
        //
        //     return {
        //         ...state,
        //         photos
        //     };

        /**
         * Images have been uploaded from the web
         */
        case WEB_IMAGES:
            return {
                ...state,
                count: action.payload.count,
                photos: action.payload.photos
            };

        /**
         * One of the web images has been seleted for tagging
         */
        case WEB_INDEX_CHANGED:
            return {
                ...state,
                indexSelected: action.payload
            };

        default:
            return state;
    }
}
