import produce from 'immer';
import {
    ADD_PHOTO,
    ADD_TAGS_TO_CAMERA_PHOTO,
    LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE,
    DELETE_SELECTED_PHOTO,
    DESELECT_ALL_CAMERA_PHOTOS,
    LOGOUT,
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
    return produce(state, draft => {
        switch (action.type) {
            /**
             * The user has manually taken a photo with the Camera
             */
            case ADD_PHOTO:
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
                break;

            /**
             * Add or update tags object on a gallery image
             */

            case ADD_TAGS_TO_CAMERA_PHOTO:
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
                    image.tags[payloadCategory] = {
                        [payloadTitle]: quantity
                    };
                }

                break;
            /**
             * load camera photos from async store
             */
            case LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE:
                draft.photos = action.payload;
                break;

            /**
             * When isSelecting is turned off,
             *
             * Change selected value on every photo to false
             */
            case DESELECT_ALL_CAMERA_PHOTOS:
                draft.photos.map(photo => {
                    photo.selected = false;
                });
                break;

            case DELETE_SELECTED_PHOTO:
                draft.photos.splice(action.payload, 1);
                draft.isSelecting = false;
                break;
            /**
             * A tag has been pressed
             *
             */
            case REMOVE_TAG_FROM_CAMERA_PHOTO:
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

                break;

            /**
             * Change the selected value of a photo
             *
             * @payload action.payload = index
             * @param selected = bool
             */
            case TOGGLE_SELECTED_PHOTO:
                draft.photos[action.payload].selected = !draft.photos[
                    action.payload
                ].selected;

                break;
            /**
             * Session Photo + Data has been uploaded successfully
             * TODO: DELETE_SELECTED_PHOTO can be used insted of replicating
             */
            case CAMERA_PHOTO_UPLOADED_SUCCESSFULLY:
                draft.photos.splice(action.payload, 1);

                break;

            // FIXME: uniqueValue is probably not useful anymore
            // check and remove if not useful
            case TOGGLE_SELECTING:
                draft.isSelecting = !draft.isSelecting;
                draft.uniqueValue = draft.uniqueValue + 1;

                break;

            // FIXME: Unused reducer and action check and remove
            case UPDATE_COUNT_REMAINING:
                draft.remainingCount = action.payload;
                break;
            // FIXME: Unused reducer and action check and remove
            case UPDATE_PERCENT:
                draft.progress = action.payload;
                break;
            default:
                return draft;
        }
    });
}
