import {
    ADD_PHOTO,
    SET_PHOTOS,
    CLOSE_LITTER_MODAL,
    CONFIRM_SESSION_TAGS,
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
    SESSION_UPLOADED_SUCCESSFULLY,
    TOGGLE_SELECTED_PHOTO,
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

            let photos1 = [...state.photos];

            let id = 0;
            if (photos1.length > 0) id = photos1[photos1.length - 1].id + 1;

            photos1.push({
                id,
                lat: action.payload.lat,
                lon: action.payload.lon,
                uri: action.payload.result.uri,
                filename: action.payload.filename,
                date: action.payload.date,
                type: 'camera', // Photos taken from the camera
                selected: false,
                tags: null
            });

            return {
                ...state,
                photos: photos1
            };

        case SET_PHOTOS:

            return {
                ...state,
                photos: action.payload
            };

        // case CLOSE_LITTER_MODAL:
        //   return {
        //     ...state,
        //     modalVisible: false,
        //     litterVisible: false
        //   };

        /**
         * Confirm the tags for a Photo taken from the Camera
         */
        case CONFIRM_SESSION_TAGS:

            console.log('confirmSessionTags', action.payload);

            let photos = [...state.photos];

            let photo1 = photos[action.payload.index];

            photo1.tags = action.payload.tags;
            photo1.presence = action.payload.presence;

            return {
                ...state,
                totalTaggedSessionCount: state.totalTaggedSessionCount +1,
                photos
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
         * Change the selected value of a photo
         *
         * @payload action.payload = index
         * @param selected = bool
         */
        case TOGGLE_SELECTED_PHOTO:

            let photos2 = [...state.photos];

            let photo = photos2[action.payload];

            photo.selected = ! photo.selected;

            return {
                ...state,
                photos: photos2
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
