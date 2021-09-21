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
                return {
                    ...state,
                    gallery: [
                        ...state.gallery.slice(0, action.payload),
                        ...state.gallery.slice(action.payload + 1)
                    ]
                };

            /**
             * Change selected => false for all photos
             */
            case DESELECT_ALL_GALLERY_PHOTOS:
                let photos1 = [...state.gallery];

                photos1 = photos1.map(photo => {
                    photo.selected = false;
                    return photo;
                });

                return {
                    ...state,
                    gallery: photos1
                };

            /**
             * Gallery Photo + Data has been uploaded successfully
             */
            case GALLERY_UPLOADED_SUCCESSFULLY:
                return {
                    ...state,
                    gallery: [
                        ...state.gallery.slice(0, action.payload),
                        ...state.gallery.slice(action.payload + 1)
                    ]
                };

            /**
             * The users images have finished loading
             */
            case TOGGLE_IMAGES_LOADING:
                return {
                    ...state,
                    imagesLoading: action.payload,
                    totalGallerySelected: 0
                };

            /**
             * Return the selected photos from the Camera Roll
             */
            case PHOTOS_FROM_GALLERY:
                let photos = [...state.gallery];

                action.payload.forEach(photo => {
                    photos.push(photo);
                });

                return {
                    ...state,
                    gallery: photos
                };

            /**
             * Remove a tag that has been pressed
             */
            case REMOVE_TAG_FROM_GALLERY_PHOTO:
                let deletedTagGallery = [...state.gallery];

                let img = deletedTagGallery[action.payload.currentIndex];
                delete img.tags[action.payload.category][action.payload.tag];

                // Delete the category if empty
                if (
                    Object.keys(img.tags[action.payload.category]).length === 0
                ) {
                    delete img.tags[action.payload.category];
                }

                return {
                    ...state,
                    gallery: deletedTagGallery
                };

            /**
             * Open or Close the Image Picker for Gallery Photos
             */
            case TOGGLE_IMAGE_BROWSER:
                return {
                    ...state,
                    imageBrowserOpen: !state.imageBrowserOpen
                };

            /**
             * Toggle the value of photo.selected
             */
            case TOGGLE_SELECTED_GALLERY:
                let gallery = [...state.gallery];

                let photo = gallery[action.payload];

                photo.selected = !photo.selected;

                return {
                    ...state,
                    gallery
                };
            /**
             * add array of geotagged images to state
             */
            case ADD_GEOTAGGED_IMAGES:
                const geotaggedImages = [
                    ...action.payload.geotagged,
                    ...state.geotaggedImages
                ];
                return {
                    ...state,
                    geotaggedImages,
                    camerarollImageFetched: true,
                    lastFetchTime: Math.floor(new Date().getTime()),
                    imagesLoading: false
                };

            default:
                return state;
        }
    });
}
