import produce from 'immer';
import {
    ADD_GEOTAGGED_IMAGES,
    ADD_TAGS_TO_GALLERY_IMAGE,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    REMOVE_TAG_FROM_GALLERY_PHOTO,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY
} from '../actions/types';

const INITIAL_STATE = {
    gallery: [], // array of selected images
    imageBrowserOpen: false,
    // imagesLoading: true, // inside the photo gallery, turn on to show spinner
    imagesLoading: false,
    geotaggedImages: [], // array of geotagged images
    camerarollImageFetched: false,
    lastFetchTime: null
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * Add or update tags object on a gallery image
             */
            case ADD_TAGS_TO_GALLERY_IMAGE:
                let image = draft.gallery[action.payload.currentIndex];
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
             * Delete selected images from the gallery array
             */
            case DELETE_SELECTED_GALLERY:
                draft.gallery.splice(action.payload, 1);
                break;

            /**
             * Change selected => false for all photos
             */
            case DESELECT_ALL_GALLERY_PHOTOS:
                draft.gallery.map(photo => {
                    photo.selected = false;
                });
                break;

            /**
             * Gallery Photo + Data has been uploaded successfully
             */
            case GALLERY_UPLOADED_SUCCESSFULLY:
                draft.gallery.splice(action.payload, 1);
                break;

            /**
             * The users images have finished loading
             */
            case TOGGLE_IMAGES_LOADING:
                draft.imagesLoading = action.payload;
                break;
            /**
             * Return the selected photos from the Camera Roll
             */
            case PHOTOS_FROM_GALLERY:
                action.payload.forEach(photo => draft.gallery.push(photo));
                break;
            /**
             * Remove a tag that has been pressed
             */
            case REMOVE_TAG_FROM_GALLERY_PHOTO:
                let photo = draft.gallery[action.payload.currentIndex];

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
             * Open or Close the Image Picker for Gallery Photos
             */
            case TOGGLE_IMAGE_BROWSER:
                draft.imageBrowserOpen = !draft.imageBrowserOpen;

            /**
             * Toggle the value of photo.selected
             */
            case TOGGLE_SELECTED_GALLERY:
                draft.gallery[action.payload].selected = !draft.gallery[
                    action.payload
                ].selected;

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
                break;

            default:
                return draft;
        }
    });
}
