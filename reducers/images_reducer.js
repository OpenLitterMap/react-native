import produce from 'immer';

import {
    ADD_IMAGE,
    ADD_TAGS_TO_IMAGE,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES
} from '../actions/types';

const INITIAL_STATE = {
    images: [],
    isSelecting: false,
    selected: 0,
    selectedImages: []
};

export default function (state = INITIAL_STATE, action) {
    return produce(state, (draft) => {
        switch (action.type) {
            /**
             * Add images to state
             *
             * Three type of images --
             * "CAMERA" --> Image taken from OLM App camera
             * "GALLERY" --> Selected from phone gallery
             * "WEB" --> Uploaded from web app but not yet tagged
             *
             * CAMERA & GALLERY image have same shape object
             *
             * if WEB --> check if image with same photoId already exist in state
             * if not add it to images array
             *
             * WEB images dont have lat/long properties but they are geotagged because
             * web app only accepts geotagged images.
             *
             */
            case ADD_IMAGE:
                const images = action.payload.images;

                images &&
                    images.map((image) => {
                        if (action.payload.type === 'WEB') {
                            const index = draft.images.findIndex(
                                (webimg) => webimg.photoId === image.id
                            );
                            if (index === -1) {
                                draft.images.push({
                                    id: draft.images.length,
                                    uri: image.filename,
                                    filename: image.filename,
                                    type: action.payload.type,
                                    selected: false,
                                    tags: {},
                                    pickedUp: image.pickedUp,
                                    photoId: image.id
                                });
                            }
                        } else {
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
                                pickedUp: image.pickedUp
                            });
                        }
                    });

                break;

            /**
             * Add or update tags object on a gallery image
             */

            case ADD_TAGS_TO_IMAGE:
                let image = draft.images[action.payload.currentIndex];
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
             * Decrement the count of images selected for deletion
             */
            case DECREMENT_SELECTED:
                draft.selected = draft.selected - 1;

                break;

            /**
             * delete image by id
             */

            case DELETE_IMAGE:
                const index = draft.images.findIndex(
                    (image) => image.id === action.payload
                );
                if (index !== -1) draft.images.splice(index, 1);
                break;
            /**
             * Delete selected images -- all images with property selected set to true
             */

            case DELETE_SELECTED_IMAGES:
                draft.images = draft.images.filter((image) => !image.selected);
                draft.selected = 0;
                break;

            /**
             * When isSelecting is turned off,
             *
             * Change selected value on every image to false
             */

            case DESELECT_ALL_IMAGES:
                draft.images.map((image) => {
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
             * remove the tag from image based on index
             */

            case REMOVE_TAG_FROM_IMAGE:
                let photo = draft.images[action.payload.currentIndex];

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
                draft.images[action.payload].selected =
                    !draft.images[action.payload].selected;

                break;

            default:
                return draft;
        }
    });
}
