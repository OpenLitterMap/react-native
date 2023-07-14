import { produce } from 'immer';

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
             *
             * Platform: mobile
             * type: "gallery" or "camera"
             * "CAMERA" --> Image taken from OLM App camera (currently disabled)
             * "GALLERY" --> Selected from phone gallery
             *
             * Platform: web
             * type: "web"
             * "WEB" --> Uploaded from web app. May or may not be tagged
             *
             * CAMERA & GALLERY image have same shape object
             *
             * if WEB --> check if image with same photoId already exist in state
             * if not add it to images array
             *
             * WEB images dont display lat/long properties at the moment
             * but they are geotagged because web app only accepts geotagged images.
             */
            case ADD_IMAGES:
                const images = action.payload.images;

                images &&
                    images.map(image => {

                        let index;

                        if (image.platform === 'mobile') {
                            // image type can be gallery or camera

                            if (image.uploaded) {
                                index = draft.imagesArray.findIndex(
                                    img => img.id === image.id
                                );
                            } else {
                                index = draft.imagesArray.findIndex(
                                    img => img.uri === image.uri
                                );
                            }
                        }

                        // size, height, width?

                        // If index is -1, it was not found
                        if (index === -1) {
                            draft.imagesArray.push({
                                id: image.id,
                                date: image.date ?? null,
                                lat: image.lat ?? 0,
                                lon: image.lon ?? 0,
                                filename: image.filename,
                                uri: image.uri,
                                type: image.type, // gallery, camera, or web
                                platform: image.platform, // web or mobile

                                tags: image.tags,
                                customTags: image.customTags,
                                picked_up: action.payload.picked_up,

                                // photoId: image.id, // need to remove this duplicate
                                selected: false,
                                uploaded: image.uploaded
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
            case ADD_TAG_TO_IMAGE: {
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
                    if (draft.previousTags.length < 10) {
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

                break;
            }

            /**
             * The user can add custom tags to an image
             */
            case ADD_CUSTOM_TAG_TO_IMAGE: {
                let currentImage =
                    draft.imagesArray[action.payload.currentIndex];
                let customTags = action.payload.tag;

                if (currentImage.customTags) {
                    currentImage.customTags.push(customTags);
                } else {
                    currentImage.customTags = [customTags];
                }

                // check if tag already exist in prev tags array
                const prevImgIndex = draft.previousTags.findIndex(
                    tag => tag.key === action.payload.tag
                );

                // if tag doesn't exist add tag to array
                // if length < 10 then add at the start of array
                // else remove the last element and add new tag to the start of array

                // if item in array remove it and add to the start of array

                if (prevImgIndex === -1) {
                    if (draft.previousTags.length < 10) {
                        draft.previousTags.unshift({
                            category: 'custom-tag',
                            key: action.payload.tag
                        });
                    } else {
                        draft.previousTags.pop();
                        draft.previousTags.unshift({
                            category: 'custom-tag',
                            key: action.payload.tag
                        });
                    }
                } else {
                    draft.previousTags.splice(prevImgIndex, 1);
                    draft.previousTags.unshift({
                        category: 'custom-tag',
                        key: action.payload.tag
                    });
                }
                break;
            }

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
             * After setting enable_admin_tagging changes to False,
             *
             * We want to clear the users uploaded un-tagged images.
             */
            case 'CLEAR_UPLOADED_WEB_IMAGES':
                draft.imagesArray = draft.imagesArray.filter(img => {
                    return img.type === 'WEB' && img.hasOwnProperty('photoId');
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

            /**
             * After an untagged image was uploaded,
             *
             * If user.enable_admin_tagging is false,
             * Update the image as uploaded which will show a cloud emoji
             */
            case 'UPDATE_IMAGE_AS_UPLOADED':
                draft.imagesArray = draft.imagesArray.map(img => {
                    if (
                        img.type === 'gallery' &&
                        img.id === action.payload.originalImageId
                    ) {
                        img.id = action.payload.newImageId;
                        img.type = 'web';
                    }

                    img.uploaded = true;

                    return img;
                });

                break;

            default:
                return draft;
        }
    });
}
