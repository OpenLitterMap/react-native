import {
    ADD_TAGS_TO_GALLERY_IMAGE,
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_GALLERY_TAGS,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_INDEX_CHANGED,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY
} from '../actions/types';

const INITIAL_STATE = {
    gallery: [], // array of selected images
    imageBrowserOpen: false,
    imagesLoading: true,
    indexSelected: 0,
    totalGalleryUploaded: 0,
    galleryUploadProgress: 0
};

export default function (state = INITIAL_STATE, action)
{
    switch (action.type)
    {
        /**
         * Add or update tags object on a gallery image
         */
        case ADD_TAGS_TO_GALLERY_IMAGE:

            let images = [...state.gallery];

            let image = images[state.indexSelected];

            // update tags on image
            // This is also duplicated by photos.js
            let newTags = Object.assign({}, image.tags);

            let quantity = 1;

            // if quantity exists, assign it
            if (action.payload.hasOwnProperty('quantity'))
            {
                quantity = action.payload.quantity;
            }

            // Increment quantity from the text filter
            // sometimes (when tag is being added from text-filter, quantity does not exist
            // we check to see if it exists on the object, if so, we can increment it
            if (newTags.hasOwnProperty(action.payload.category))
            {
                if (newTags[action.payload.category].hasOwnProperty(action.payload.title))
                {
                    quantity = newTags[action.payload.category][action.payload.title];

                    if (newTags[action.payload.category][action.payload.title] === quantity) quantity++;
                }
            }

            // create a new object with the new values
            newTags = {
                ...newTags,
                [action.payload.category]: {
                    ...newTags[action.payload.category],
                    [action.payload.title]: quantity
                }
            };

            // create new total values (Bottom Right total)
            let litter_total = 0;
            let litter_length = 0;
            Object.keys(newTags).map(category => {
                Object.values(newTags[category]).map(values => {
                    litter_total += parseInt(values);
                    litter_length++;
                });
            });

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
                galleryUploadProgress: action.payload,
            };

        /**
         * Add tags to the image at the index
         */
        case CONFIRM_GALLERY_TAGS:

            console.log("CONFIRM_GALLERY_TAGS", action.payload);

            let photos2 = [...state.gallery];
            let photo2 = photos2[action.payload.index];

            photo2.tags = action.payload.tags;
            photo2.picked_up = action.payload.picked_up;

            return {
                ...state,
                gallery: photos2
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
         * One of the gallery images has been selected
         *
         * @param int action.payload (index)
         */
        case GALLERY_INDEX_CHANGED:

            return {
                ...state,
                indexSelected: action.payload
            };

        /**
         * Gallery Photo + Data has been uploaded successfully
         - todo, give the user the ability to delete the image from their device
         - This can be done with permission 1 at a time... can we get permission for multiple?
         */
        case GALLERY_UPLOADED_SUCCESSFULLY:

            return {
                ...state,
                gallery: [
                    ...state.gallery.slice(0, action.payload),
                    ...state.gallery.slice(action.payload + 1)
                ],
                // total number of photos that were successfully uploaded
                totalGalleryUploaded: state.totalGalleryUploaded +1,
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

            // Copy the current stored gallery:
            let photos = [...state.gallery];

            action.payload.forEach(photo => {
                photos.push(photo);
            });

            // Store new version of gallery:
            return {
                ...state,
                gallery: photos,
            };

        /**
         * When uploading, reset x / total -> x = 0
         */
        case RESET_GALLERY_TOTAL_TO_UPLOAD:
            return {
                ...state,
                totalGalleryUploaded: 0
            };

        /**
         * Open or Close the Image Picker for Gallery Photos
         */
        case TOGGLE_IMAGE_BROWSER:
            return {
                ...state,
                imageBrowserOpen: ! state.imageBrowserOpen
            };

        /**
         * Toggle the value of photo.selected
         */
        case TOGGLE_SELECTED_GALLERY:

            let gallery = [...state.gallery];

            let photo = gallery[action.payload];

            photo.selected = ! photo.selected;

            return {
                ...state,
                gallery
            };

        default:
            return state;
    }
};
