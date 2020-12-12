import {
    ADD_PHOTO,
    CLOSE_LITTER_MODAL,
    CONFIRM_SESSION_ITEM,
    // DELETE_SELECTED_GALLERY,
    DELETE_SELECTED_PHOTO,
    LOGOUT,
    PHOTOS_FROM_GALLERY,
    INCREMENT,
    INCREMENT_SELECTED,
    DECREMENT_SELECTED,
    // ITEM_SELECTED,
    RESET_PHOTOS_TOTAL_TO_UPLOAD,
    REMOVE_ALL_SELECTED_PHOTOS,
    RESET_SESSION_COUNT,
    SESSION_REMOVED_FOR_DELETE,
    SESSION_SELECTED_FOR_DELETE,
    SESSION_UPLOADED_SUCCESSFULLY,
    // TOGGLE_MODAL,
    // TOGGLE_LITTER,
    // TOGGLE_UPLOAD,
    // TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTING,
    UPDATE_PERCENT,
    UPLOAD_PHOTOS,
    UPDATE_COUNT_REMAINING,
    UPLOAD_COMPLETE_SUCCESS,
    UNIQUE_VALUE
} from '../actions/types';

// moved to Shared_Reducer
// // modalVisible: false,
// // litterVisible: false,
// uploadVisible: false,

const INITIAL_STATE = {
    photos: [],
    photosData: [],
    // photoSelected: null,
    progress: 0,
    gallery: [],
    imageBrowserOpen: false,
    isSelecting: false,
    remainingCount: 0,
    selected: 0,
    totalSessionUploaded: 0,
    totalCount: null,
    totalTaggedSessionCount: 0,
    uniqueValue: 0
};

export default function(state = INITIAL_STATE, action) {

    switch(action.type)
    {
        /**
         * The user has manually taken a photo with the Camera
         */
        case ADD_PHOTO:

            let photos = [...state.photos];
            photos.push({
                lat: action.payload.lat,
                lon: action.payload.lon,
                uri: action.payload.result.uri,
                filename: action.payload.filename,
                date: action.payload.date,
                type: 'session' // Photos taken this session
            });

            return {
                ...state,
                photos
            };

        // case CLOSE_LITTER_MODAL:
        //   return {
        //     ...state,
        //     modalVisible: false,
        //     litterVisible: false
        //   };

        /**
         * The Litter tagged on this image is correct.
         * We also save the previous tags, so the user can easily select them on the next image
         */
        case CONFIRM_SESSION_ITEM:
            return {
                ...state,
                totalTaggedSessionCount: state.totalTaggedSessionCount+1,
                photos: state.photos.map((photo, index) => {
                    if (index !== action.payload.index) return {...photo};
                    return {
                        ...photo,
                        litter: {
                            ...action.payload.data
                        },
                        presence: action.payload.presence
                    };
                })
            };

        case DELETE_SELECTED_PHOTO:
            return {
                ...state,
                photos: [
                    ...state.photos.slice(0, action.payload),
                    ...state.photos.slice(action.payload + 1)
                ],
                selected: 0,
                isSelecting: false
            };

        case INCREMENT:
            return {
                ...state,
                remainingCount: state.remainingCount + 1 // todo make immutable
            };

        // case ITEM_SELECTED:
        //   console.log("- photos reducer - item selected");
        //   console.log(action.payload);
        //   return {
        //     ...state,
        //     photoSelected: action.payload,
        //     modalVisible: true, // todo - make this immutable
        //     litterVisible: true, // todo - make this immutable
        //   };

        case LOGOUT:
        // return INITIAL_STATE;

        /**
         * When uploading reset x (x / total) to 0
         */
        case RESET_PHOTOS_TOTAL_TO_UPLOAD:
            return {
                ...state,
                totalSessionUploaded: 0
            };

        /**
         * Delete any selected = true tags from Photos
         */
        case REMOVE_ALL_SELECTED_PHOTOS:
            return {
                ...state,
                photos: state.photos.map(image => {
                    if (image.selected) {
                        delete image.selected;
                    }

                    return {...image};
                })
            };

        /**
         * Reset session count to 0 when all items uploaded successfully
         */
        case RESET_SESSION_COUNT:
            return {
                ...state,
                totalTaggedSessionCount: 0
            };

        /**
         * Delete image['selected'].
         */
        case SESSION_REMOVED_FOR_DELETE:
            return {
                ...state,
                photos: state.photos.map((image, index) => {
                    if (index !== action.payload) return {...image};

                    delete image.selected;
                    return {...image};
                })
            };

        /**
         * Return image['selected'] = true;
         */
        case SESSION_SELECTED_FOR_DELETE:
            return {
                ...state,
                photos: state.photos.map((image, index) => {
                    console.log('LOG', index);
                    if (index !== action.payload) return {...image};
                    return {
                        ...image,
                        selected: true
                    };
                })
            };

        /**
         * Session Photo + Data has been uploaded successfully
         - todo, give the user the ability to delete the image from their device
         */
        case SESSION_UPLOADED_SUCCESSFULLY:
            return {
                ...state,
                photos: [
                    ...state.photos.slice(0, action.payload),
                    ...state.photos.slice(action.payload + 1)
                ],
                // total number of tagged photos can be decremented
                totalTaggedSessionCount: state.totalTaggedSessionCount -1,
                // total number of successfully uploaded photos can be incremented
                // this process could be improved (without need to map and count large arrays)
                totalSessionUploaded: state.totalSessionUploaded +1,
            };

        case TOGGLE_SELECTING:
            // console.log('reducer - toggle selecting');
            return {
                ...state,
                selected: 0,
                isSelecting: ! state.isSelecting,
                uniqueValue: state.uniqueValue + 1
            };

        case UPDATE_COUNT_REMAINING:
            return {
                ...state,
                remainingCount: action.payload
            };

        case UPDATE_PERCENT:
            return {
                ...state,
                progress: action.payload
            };

        case UPLOAD_COMPLETE_SUCCESS:
            return {
                ...state,
                // modalVisible: action.payload.modal
            };

        // case UNIQUE_VALUE:
        //   return {
        //     ...state,
        //     uniqueValue: state.uniqueValue + 1
        //   };

        default:
            return state;
    }
}
