import {
    ADD_PHOTO,
    ADD_TAGS_TO_CAMERA_PHOTO,
    CAMERA_INDEX_CHANGED,
    LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
    CONFIRM_SESSION_TAGS,
    DELETE_SELECTED_PHOTO,
    DESELECT_ALL_CAMERA_PHOTOS,
    LOGOUT,
    INCREMENT,
    RESET_PHOTOS_TOTAL_TO_UPLOAD,
    REMOVE_TAG_FROM_CAMERA_PHOTO,
    RESET_SESSION_COUNT,
    CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
    TOGGLE_SELECTED_PHOTO,
    TOGGLE_SELECTING,
    UPDATE_PERCENT,
    UPDATE_COUNT_REMAINING,
    UPLOAD_COMPLETE_SUCCESS,
} from '../actions/types';

const INITIAL_STATE = {
    photos: [],
    progress: 0,
    indexSelected: 0,
    isSelecting: false,
    remainingCount: 0,
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
                tags: {},
                picked_up: false
            });

            return {
                ...state,
                photos: photos1
            };

        /**
         * Add or update tags object on a gallery image
         */
        case ADD_TAGS_TO_CAMERA_PHOTO:

            let photos4 = [...state.photos];

            let image = photos4[action.payload.currentIndex];

            // update tags on image
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
            if (newTags.hasOwnProperty(action.payload.tag.category))
            {
                if (newTags[action.payload.tag.category].hasOwnProperty(action.payload.tag.title))
                {
                    quantity = newTags[action.payload.tag.category][action.payload.tag.title];

                    if (newTags[action.payload.tag.category][action.payload.tag.title] === quantity) quantity++;
                }
            }

            // create a new object with the new values
            newTags = {
                ...newTags,
                [action.payload.tag.category]: {
                    ...newTags[action.payload.tag.category],
                    [action.payload.tag.title]: quantity
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

            console.log({ newTags });

            image.tags = newTags;

            return {
                ...state,
                photos: photos4
            };

        /**
         * One of the photos were selected for tagging
         *
         * Or, the swiperIndex has changed on LitterPicker
         *
         * @param action.payload int (index)
         */
        case CAMERA_INDEX_CHANGED:

            console.log("camera_index_changed", action.payload);

            return {
                ...state,
                indexSelected: action.payload
            };

        case LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE:

            return {
                ...state,
                photos: action.payload
            };

        /**
         * Confirm the tags for a Photo taken from the Camera
         */
        case CONFIRM_SESSION_TAGS:

            console.log('confirm_session_tags', action.payload);

            let photos = [...state.photos];
            let photo1 = photos[action.payload.index];

            photo1.tags = action.payload.tags;

            return {
                ...state,
                photos
            };

        /**
         * When isSelecting is turned off,
         *
         * Change selected value on every photo to false
         */
        case DESELECT_ALL_CAMERA_PHOTOS:

            let photos3 = [...state.photos];

            photos3 = photos3.map(photo => {
                photo.selected = false;

                return photo;
            });

            return {
                ...state,
                photos: photos3
            };

        case DELETE_SELECTED_PHOTO:
            return {
                ...state,
                photos: [
                    ...state.photos.slice(0, action.payload),
                    ...state.photos.slice(action.payload + 1)
                ],
                isSelecting: false
            };

        case INCREMENT:
            return {
                ...state,
                remainingCount: state.remainingCount + 1 // todo make immutable
            };

        case LOGOUT:
            // return INITIAL_STATE;

        /**
         * A tag has been pressed
         */
        case REMOVE_TAG_FROM_CAMERA_PHOTO:

            let untaggedPhotos = [...state.photos];

            let img = untaggedPhotos[action.payload.currentIndex];
            delete img.tags[action.payload.category][action.payload.tag];

            // Delete the category if empty
            if (Object.keys(img.tags[action.payload.category]).length === 0)
            {
                delete img.tags[action.payload.category];
            }

            return {
                ...state,
                photos: untaggedPhotos
            }

        /**
         * When uploading reset x (x / total) to 0
         */
        case RESET_PHOTOS_TOTAL_TO_UPLOAD:
            return {
                ...state,
                totalCameraPhotosUploaded: 0
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
         */
        case CAMERA_PHOTO_UPLOADED_SUCCESSFULLY:
            return {
                ...state,
                photos: [
                    ...state.photos.slice(0, action.payload),
                    ...state.photos.slice(action.payload + 1)
                ],
                // total number of successfully uploaded photos can be incremented
                totalCameraPhotosUploaded: state.totalCameraPhotosUploaded +1,
            };

        case TOGGLE_SELECTING:
            // console.log('reducer - toggle selecting');
            return {
                ...state,
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
