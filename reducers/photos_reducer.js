import {
    ADD_PHOTO,
    ADD_TAGS_TO_CAMERA_PHOTO,
    LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
    DELETE_SELECTED_PHOTO,
    DESELECT_ALL_CAMERA_PHOTOS,
    LOGOUT,
    INCREMENT,
    REMOVE_TAG_FROM_CAMERA_PHOTO,
    CAMERA_PHOTO_UPLOADED_SUCCESSFULLY,
    TOGGLE_SELECTED_PHOTO,
    TOGGLE_SELECTING,
    UPDATE_PERCENT,
    UPDATE_COUNT_REMAINING,
    UPLOAD_COMPLETE_SUCCESS
} from '../actions/types';

const INITIAL_STATE = {
    photos: [],
    progress: 0,
    isSelecting: false,
    remainingCount: 0,
    uniqueValue: 0
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
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
            let photos = [...state.photos];
            let image = photos[action.payload.currentIndex];

            // update tags on image
            let newTags = { ...image.tags };

            let quantity = 1;
            console.log(action.payload);
            // if quantity exists, assign it
            if (action.payload.tag.hasOwnProperty('quantity')) {
                quantity = action.payload.tag.quantity;
            }

            // Increment quantity from the text filter
            // sometimes (when tag is being added from text-filter, quantity does not exist
            // we check to see if it exists on the object, if so, we can increment it
            let payloadCategory = action.payload.tag.category;
            let payloadTitle = action.payload.tag.title;
            let quantityChanged = action.payload.quantityChanged
                ? action.payload.quantityChanged
                : false;

            console.log('===> ' + quantityChanged);
            // check if category of incoming payload already exist in image tags
            if (newTags.hasOwnProperty(payloadCategory)) {
                // check if title of incoming payload already exist
                if (newTags[payloadCategory].hasOwnProperty(payloadTitle)) {
                    quantity = newTags[payloadCategory][payloadTitle];
                    console.log(action.payload.quantityChanged);
                    if (quantityChanged) {
                        quantity = action.payload.tag.quantity;
                    } else {
                        quantity++;
                    }
                }
            }

            // create a new object with the new values
            newTags = {
                ...newTags,
                [payloadCategory]: {
                    ...newTags[payloadCategory],
                    [payloadTitle]: quantity
                }
            };

            console.log({ newTags });

            image.tags = newTags;

            return {
                ...state,
                photos: photos
            };

        case LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE:
            return {
                ...state,
                photos: action.payload
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

        // case LOGOUT:
        // return INITIAL_STATE;

        /**
         * A tag has been pressed
         *
         * Bug: Why is this being called from logout? SettingsScreen@logout
         */
        case REMOVE_TAG_FROM_CAMERA_PHOTO:
            console.log('remove_tag_from_camera_photo', action.payload);

            // For some reason, this is being called on logout.
            if (action.payload) {
                let untaggedPhotos = [...state.photos];

                let img = untaggedPhotos[action.payload.currentIndex];
                delete img.tags[action.payload.category][action.payload.tag];

                // Delete the category if empty
                if (
                    Object.keys(img.tags[action.payload.category]).length === 0
                ) {
                    delete img.tags[action.payload.category];
                }

                return {
                    ...state,
                    photos: untaggedPhotos
                };
            }

            break;

        /**
         * Change the selected value of a photo
         *
         * @payload action.payload = index
         * @param selected = bool
         */
        case TOGGLE_SELECTED_PHOTO:
            let photos2 = [...state.photos];

            let photo = photos2[action.payload];

            photo.selected = !photo.selected;

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
                ]
            };

        case TOGGLE_SELECTING:
            // console.log('reducer - toggle selecting');
            return {
                ...state,
                isSelecting: !state.isSelecting,
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
                ...state
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
