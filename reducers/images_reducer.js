import produce from 'immer';

import {
    ADD_IMAGES,
    ADD_TAG_TO_IMAGE,
    CHANGE_LITTER_STATUS,
    DECREMENT_SELECTED,
    DELETE_IMAGE,
    DELETE_SELECTED_IMAGES,
    DESELECT_ALL_IMAGES,
    INCREMENT_SELECTED,
    REMOVE_TAG_FROM_IMAGE,
    TOGGLE_PICKED_UP,
    TOGGLE_SELECTING,
    TOGGLE_SELECTED_IMAGES,
    ADD_CUSTOM_TAG_TO_IMAGE,
    REMOVE_CUSTOM_TAG_FROM_IMAGE
} from '../actions/types';

const INITIAL_STATE = {
    imagesArray: [],
    isSelecting: false,
    selected: 0,
    selectedImages: [],
    previousTags: []
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
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
            case ADD_IMAGES:
                const images = action.payload.images;

                images &&
                    images.map(image => {
                        if (action.payload.type === 'WEB') {
                            const index = draft.imagesArray.findIndex(
                                webimg => webimg.photoId === image.id
                            );
                            if (index === -1) {
                                draft.imagesArray.push({
                                    id: draft.imagesArray.length,
                                    uri: image.filename,
                                    filename: image.filename,
                                    type: action.payload.type,
                                    selected: false,
                                    tags: {},
                                    picked_up: action.payload.picked_up,
                                    photoId: image.id
                                });
                            }
                        } else {
                            draft.imagesArray.push({
                                id: draft.imagesArray.length,
                                lat: image.lat,
                                lon: image.lon,
                                uri: image.uri,
                                filename: image.filename,
                                date: image.date,
                                type: action.payload.type,
                                selected: false,
                                tags: {},
                                picked_up: action.payload.picked_up
                            });
                        }
                    });

                break;

            /**
             * Add or update tags object on a gallery image
             *
             * payload = {tag, currentIndex, quantityChanged}
             * quantityChanged = true if quantity is changed from picker wheel
             *
             * check if tag `category` already exist on image index
             * if false --> add tag to image
             * if true --> check if title is already present
             * title if false --> add tag title to the category with quantity: 1
             * title is true (already present) -->
             * if quantityChanged change the quantity to that number
             * else add 1 to quantity
             *
             * after adding tag save tag to previousTags array.
             * max 10 tags in previousTags array remove old tags if it exceeds limits.
             */

            case ADD_TAG_TO_IMAGE:
                let image = draft.imagesArray[action.payload.currentIndex];
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

                // check if tag already exist in prev tags array
                const prevImgIndex = draft.previousTags.findIndex(
                    tag => tag.key === payloadTitle
                );

                // if tag doesn't exist add tag to array
                // if length < 10 then add at the start of array
                // else remove the last element and add new tag to the start of array

                // if item in array remove it and add to the start of array

                if (prevImgIndex === -1) {
                    if (draft.previousTags.length <= 10) {
                        draft.previousTags.unshift({
                            category: payloadCategory,
                            key: payloadTitle
                        });
                    } else {
                        draft.previousTags.pop();
                        draft.previousTags.unshift({
                            category: payloadCategory,
                            key: payloadTitle
                        });
                    }
                } else {
                    draft.previousTags.splice(prevImgIndex, 1);
                    draft.previousTags.unshift({
                        category: payloadCategory,
                        key: payloadTitle
                    });
                }
                // draft.previousTags = [];
                break;

            case ADD_CUSTOM_TAG_TO_IMAGE:
                let currentImage =
                    draft.imagesArray[action.payload.currentIndex];
                let customTags = action.payload.tag;

                if (currentImage.customTags) {
                    currentImage.customTags.push(customTags);
                } else {
                    currentImage.customTags = [customTags];
                }
                break;

            /**
             * Changes litter picked up status of all images
             * to payload
             *
             * action.payload -- {boolean}
             */
            case CHANGE_LITTER_STATUS:
                draft.imagesArray.map(img => (img.picked_up = action.payload));

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
                const index = draft.imagesArray.findIndex(
                    delImg => delImg.id === action.payload
                );
                if (index !== -1) {
                    draft.imagesArray.splice(index, 1);
                }

                break;

            /**
             * Delete selected images -- all images with property selected set to true
             */

            case DELETE_SELECTED_IMAGES:
                draft.imagesArray = draft.imagesArray.filter(
                    img => !img.selected
                );
                draft.selected = 0;

                break;

            /**
             * When isSelecting is turned off,
             *
             * Change selected value on every image to false
             */

            case DESELECT_ALL_IMAGES:
                draft.imagesArray.map(image => {
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
                let photo = draft.imagesArray[action.payload.currentIndex];

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

            case REMOVE_CUSTOM_TAG_FROM_IMAGE:
                draft.imagesArray[
                    action.payload.currentIndex
                ].customTags.splice(action.payload.tagIndex, 1);
                break;
            /**
             * toggles picked_up status on an image based on id
             */
            case TOGGLE_PICKED_UP:
                const imageIndex = draft.imagesArray.findIndex(
                    image => image.id === action.payload
                );
                if (imageIndex !== -1)
                    draft.imagesArray[imageIndex].picked_up = !draft
                        .imagesArray[imageIndex].picked_up;

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
                draft.imagesArray[action.payload].selected = !draft.imagesArray[
                    action.payload
                ].selected;

                break;

            default:
                return draft;
        }
    });
}
