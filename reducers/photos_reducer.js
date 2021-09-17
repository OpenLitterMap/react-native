import produce from 'immer';
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
            return produce(state, draft => {
                draft.photos.push({
                    id: draft.photos.length > 0 ? draft.photos.length - 1 : 0,
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
            });
            break;

        /**
         * Add or update tags object on a gallery image
         */

        case ADD_TAGS_TO_CAMERA_PHOTO:
            return produce(state, draft => {
                let image = draft.photos[action.payload.currentIndex];
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
                    image.tags[payloadCategory] = { [payloadTitle]: quantity };
                }
            });
            break;

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
            return produce(state, draft => {
                draft.photos.map(photo => {
                    photo.selected = false;
                });
            });
            break;

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
         */
        case REMOVE_TAG_FROM_CAMERA_PHOTO:
            return produce(state, draft => {
                console.log('remove_tag_from_camera_photo', action.payload);
                let photo = draft.photos[action.payload.currentIndex];

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
            });

            break;

        /**
         * Change the selected value of a photo
         *
         * @payload action.payload = index
         * @param selected = bool
         */
        case TOGGLE_SELECTED_PHOTO:
            return produce(state, draft => {
                draft.photos[action.payload].selected = !draft.photos[
                    action.payload
                ].selected;
            });
            break;
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
