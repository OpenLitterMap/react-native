import {
    CHANGE_UPLOAD_PROGRESS,
    CONFIRM_GALLERY_ITEM,
    DECREMENT_SELECTED,
    DELETE_GALLERY_UPLOAD_SUCCESS,
    DELETE_SELECTED_GALLERY,
    GALLERY_REMOVED_FOR_DELETE,
    GALLERY_SELECTED_FOR_DELETE,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    INCREMENT_SELECTED,
    NEW_SELECTED,
    PHOTOS_FROM_GALLERY,
    REMOVE_ALL_SELECTED_GALLERY,
    RESET_GALLERY_COUNT,
    RESET_GALLERY_TOTAL_TO_UPLOAD,
    TOGGLE_IMAGE_BROWSER,
    UPDATE_GALLERY_COUNT,
    UPLOAD_TAGGED_GALLERY
} from '../actions/types';
import AsyncStorage from '@react-native-community/async-storage';

const INITIAL_STATE = {
    // selected Gallery images for upload
    gallery: [],
    imageBrowserOpen: false,
    imagesLoading: true,
    totalGalleryUploaded: 0,
    totalTaggedGalleryCount: 0, // increment when image has been tagged, decrement when deleted or uploaded?
    selectedGallery: 0,
    isSelectingGallery: false,
    galleryUploadProgress: 0,
    totalGallerySelected: 0, // updated dynamically when an image is selected. Reset to 0 when photos album opened
    galleryTotalCount: 0, // gallery.length
};

export default function (state = INITIAL_STATE, action) {

    switch (action.type)
    {

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
        case CONFIRM_GALLERY_ITEM:
            // console.log("reducer - confirm gallery item", action.payload);
            const newGalleryArray = state.gallery.map((image,index) => {
                // console.log('galleryItem', image);
                if (index === action.payload.index) {
                    return {
                        ...image,
                        // litter: tags,
                        litter: {
                            ...action.payload.data
                        },
                        presence: action.payload.presence
                    };
                }

                return {...image};
            });

            return {
                ...state,
                totalTaggedGalleryCount: state.totalTaggedGalleryCount+1,
                gallery: newGalleryArray
            };

        /**
         * Todo - add setting and try to achieve this
         * Gallery photo has been uploaded successfully - delete it from the users device
         */
        // case DELETE_GALLERY_UPLOAD_SUCCESS:
        //   return {
        //     ...state,
        //     gallery: [
        //       ...state.gallery.slice(0, action.payload),
        //       ...state.gallery.slice(action.payload + 1)
        //     ],
        //     // totalGalleryUploaded: state.totalGalleryUploaded +1
        //   };

        /**
         * Delete selected images from the gallery array
         */
        case DELETE_SELECTED_GALLERY:
            return {
                ...state,
                gallery: [
                    ...state.gallery.slice(0, action.payload),
                    ...state.gallery.slice(action.payload + 1)
                ],
                selectedGallery: 0,
                isSelectingGallery: false,

            };

        /**
         * Delete -> (obj) image['selected'] }
         */
        case GALLERY_REMOVED_FOR_DELETE:
            return {
                ...state,
                gallery: state.gallery.map((image, index) => {
                    if (index !== action.payload) return {...image};

                    delete image.selected;
                    return {...image};
                })
            };

        /**
         * Return image['selected'] = true;
         */
        case GALLERY_SELECTED_FOR_DELETE:
            return {
                ...state,
                gallery: state.gallery.map((image, index) => {
                    if (index !== action.payload) return {...image};
                    return {
                        ...image,
                        selected: true
                    };
                })
            };

        /**
         * Gallery Photo + Data has been uploaded successfully
         - todo, give the user the ability to delete the image from their device
         - can be done with permission 1 at a time... can we get permission for multiple?
         */
        case GALLERY_UPLOADED_SUCCESSFULLY:
            return {
                ...state,
                gallery: [
                    ...state.gallery.slice(0, action.payload),
                    ...state.gallery.slice(action.payload + 1)
                ],
                // total number of tagged photos can be decremented
                totalTaggedGalleryCount: state.totalTaggedGalleryCount -1,
                // total number of successfully uploaded photos can be incremented
                // could this convention be improved, without need to map and count potentially large arrays?
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
            // console.log('PHOTOS_FROM_GALLERY', action.payload);
            return {
                ...state,
                gallery: action.payload,
                galleryTotalCount: action.payload.length
            };

        /**
         *
         */
        case NEW_SELECTED:
            // console.log('- reducer, new selected -', action.payload);
            return {
                ...state
                // selected: { action }
            };

        /**
         * Delete any selected = true tags from gallery
         */
        case REMOVE_ALL_SELECTED_GALLERY:
            return {
                ...state,
                gallery: state.gallery.map(image => {
                    console.log("Delete", image);
                    if (image.selected) {
                        if (image.litter) {
                            totalTaggedGalleryCount: state.totalTaggedGalleryCount -1
                        }
                        delete image.selected;
                    }

                    return {...image};
                })
            };

        /**
         * Reset all gallery count when uploads finished successfully
         */
        case RESET_GALLERY_COUNT:
            return {
                ...state,
                totalTaggedGalleryCount: 0
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
         * Number of images the user has selected in the MediaList
         */
        case UPDATE_GALLERY_COUNT:
            return {
                ...state,
                totalGallerySelected: action.payload
            };

        /**
         * Upload any Gallery items that are tagged
         * change upload progress
         * todo - delete uploaded image from users device
         * then close UploadModal on Shared_Reducer
         */
        case UPLOAD_TAGGED_GALLERY:
            console.log("todo - upload tagged gallery??");
            return {
                ...state
            };

        default:
            return state;
    }
};
