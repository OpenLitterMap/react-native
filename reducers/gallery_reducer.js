import CameraRoll from '@react-native-community/cameraroll';
import {
    ADD_TAGS_TO_GALLERY_IMAGE,
    CHANGE_UPLOAD_PROGRESS,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    REMOVE_TAG_FROM_GALLERY_PHOTO,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY,
    ADD_GEOTAGGED_IMAGES
} from '../actions/types';
import Lodash from 'lodash';

const INITIAL_STATE = {
    gallery: [], // array of selected images
    imageBrowserOpen: false,
    imagesLoading: true, // inside the photo gallery, turn on to show spinner
    galleryUploadProgress: 0,
    geotaggedImages: [] // array of geotagged images
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        /**
         * Add or update tags object on a gallery image
         */
        case ADD_TAGS_TO_GALLERY_IMAGE:
            let images = [...state.gallery];

            let image = images[action.payload.currentIndex];

            let newTags = Object.assign({}, image.tags);

            try {
                // update tags on image
                // duplicated by photos_reducer
                let quantity = 1;

                // if quantity exists, assign it
                if (action.payload.hasOwnProperty('quantity')) {
                    quantity = action.payload.quantity;
                }

                const category = action.payload.tag.category;
                const title = action.payload.tag.title;

                // Increment quantity from the text filter
                // sometimes (when tag is being added from text-filter, quantity does not exist
                // we check to see if it exists on the object, if so, we can increment it
                if (newTags.hasOwnProperty(category)) {
                    if (newTags[category].hasOwnProperty(title)) {
                        quantity = newTags[category][title];

                        if (newTags[category][title] === quantity) quantity++;
                    }
                }

                // create a new object with the new values
                newTags = {
                    ...newTags,
                    [category]: {
                        ...newTags[category],
                        [title]: quantity
                    }
                };
            } catch (e) {
                console.log({ e });
            }

            image.tags = newTags;

            return {
                ...state,
                gallery: images
            };

        /**
         * User is uploading photos
         */
        case CHANGE_UPLOAD_PROGRESS:
            return {
                ...state,
                galleryUploadProgress: action.payload
            };

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
            if (Object.keys(img.tags[action.payload.category]).length === 0) {
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
            if (!Lodash.isEqual(state.geotaggedImages, action.payload)) {
                // let geotaggedImages = [
                //     ...action.payload,
                //     ...state.geotaggedImages
                // ];
                let geotaggedImages = [...action.payload];
                return {
                    ...state,
                    geotaggedImages
                };
            } else {
                return state;
            }

        default:
            return state;
    }
}
