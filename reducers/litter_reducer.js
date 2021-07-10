import {
    CHANGE_CATEGORY,
    CHANGE_PHOTO_TYPE,
    CHANGE_ITEM,
    CHANGE_Q,
    CONFIRM_FOR_UPLOAD,
    CHANGE_SWIPER_INDEX,
    REMOVE_TAG,
    RESET_TAGS,
    RESET_LITTER_STATE,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SUGGEST_TAGS,
    TOGGLE_SWITCH,
    UPDATE_TAGS,
    UPDATE_TAGS_X_POS,
    UPDATE_QUANTITY
} from '../actions/types';

import CATEGORIES from '../screens/pages/data/categories';
import LITTERKEYS from '../screens/pages/data/litterkeys';

import { getTranslation } from 'react-native-translation';

const INITIAL_STATE = {
    category: CATEGORIES[0],
    items: LITTERKEYS['smoking'],
    item: 'butts',
    q: 1,
    collectionLength: 0,
    displayAllTags: false,
    hasLitter: false,
    index: null,
    indexSelected: null, // index of camera_photos, gallery or web
    // photoSelected: null,
    photoType: '', // gallery, camera, or web.
    presence: true,
    positions: {}, // coordinates of each tag for animation
    suggestedTags: [],
    swiperIndex: 0, // the index of all camera, web, gallery photos
    tags: {},
    tagsModalVisible: false,
    totalImagesToUpload: 0,
    totalLitterCount: 0
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        /**
         * Change category
         *
         * @category = Object => title: 'smoking", 'path: '../filepath.png'
         * @items = Array of objects [ { id, key }, { id, key } ]
         * @item = First key from array 'butts'
         */
        case CHANGE_CATEGORY:
            const category = CATEGORIES.find(
                cat => cat.title === action.payload
            );
            const items = LITTERKEYS[category.title];
            const item = items[0].key;

            return {
                ...state,
                category,
                items,
                item,
                q: 1
            };

        /**
         * Change the type of photo being selected for tagging
         *
         * @payload type string "camera", "gallery", or "web"
         */
        case CHANGE_PHOTO_TYPE:
            return {
                ...state,
                photoType: action.payload
            };

        /**
         * Change item key within a category
         *
         * @return 'butts', 'facemask', etc.
         */
        case CHANGE_ITEM:
            return {
                ...state,
                item: action.payload,
                q: '1'
            };

        /**
         * Change quantity
         *
         * @return 1,2,3...
         */
        case CHANGE_Q:
            return {
                ...state,
                q: action.payload
            };

        /**
         * Change the index of the Swiper on LitterPicker.Swiper.LitterImage
         */
        case CHANGE_SWIPER_INDEX:
            return {
                ...state,
                swiperIndex: action.payload
            };

        /**
         * When a web-image is submitted, we need to reset the tags
         */
        case RESET_TAGS:
            return {
                ...state,
                tags: {}
            };

        /**
         * The user has pressed the "confirm" button
         *
         * @return this image can be uploaded
         */
        case CONFIRM_FOR_UPLOAD:
            // console.log("reducer, index", action.payload);
            return {
                ...state
            };

        /**
         * Remove a tag
         */
        case REMOVE_TAG:
            console.log('remove_tag', action.payload);

            let tags2 = Object.assign({}, state.tags);
            delete tags2[action.payload.category][action.payload.item];

            let total = 0;
            let length = 0;
            Object.keys(tags2).map(category => {
                if (Object.keys(tags2[category]).length > 0) {
                    Object.values(tags2[category]).map(values => {
                        total += parseInt(values);
                        length++;
                    });
                } else {
                    // remove category
                    delete tags2[category];
                }
            });

            // console.log({ tags2 });

            return {
                ...state,
                tags: tags2,
                totalLitterCount: total,
                collectionLength: length
            };

        // Reset tags to null and close LitterPicker modal
        case RESET_LITTER_STATE:
            const category1 = CATEGORIES[0];
            const items1 = LITTERKEYS[category1.title];
            const item1 = items1[0].key;

            return Object.assign({}, state, {
                category: category1,
                items: items1,
                item: item1,
                q: '1',
                tags: {},
                switchValue: true,
                totalLitterCount: 0,
                // collectionModalVisible: false,
                tagsModalVisible: false,
                collectionLength: 0,
                hasLitter: false
            });

        /**
         * Content to show in the modal on LitterPicker
         */
        case SHOW_ALL_TAGS:
            return {
                ...state,
                displayAllTags: action.payload
            };

        /**
         * Show the modal on LitterPicker.js
         * Need to set the content separately
         */
        case SHOW_INNER_MODAL:
            return Object.assign({}, state, {
                tagsModalVisible: !state.tagsModalVisible
            });

        /**
         * Filter all translated tag values
         *
         * Return all results
         *
         * Note: We are passing auth.lang as a prop which could be access from auth_reducer
         */
        case SUGGEST_TAGS:
            // return array of suggested tags based on payload text
            let x = [];

            Object.entries(LITTERKEYS).some(tags => {
                tags[1].some(tag => {
                    const t = getTranslation(
                        `${action.payload.lang}.litter.${tags[0]}.${tag.key}`
                    );

                    if (
                        t
                            .toLowerCase()
                            .includes(action.payload.text.toLowerCase())
                    ) {
                        x.push({
                            category: tags[0],
                            key: tag.key
                        });
                    }
                });
            });

            return {
                ...state,
                suggestedTags: x
            };

        /**
         * This will toggle the value for the Switch, not the value for each individual image.
         */
        case TOGGLE_SWITCH:
            return Object.assign({}, state, {
                presence: !state.presence
            });

        /**
         * When previous tags is true, we re-apply them to the next image here
         */
        case UPDATE_TAGS:
            const updateTags = Object.assign({}, action.payload);

            return {
                ...state,
                tags: updateTags
            };

        /**
         * Update X-position of tags
         */
        case UPDATE_TAGS_X_POS:
            let positions = Object.assign({}, state.positions);
            positions[action.payload.item] = action.payload.x;

            return {
                ...state,
                positions
            };

        /**
         *
         */
        case UPDATE_QUANTITY:
            return {
                ...state,
                tags: {
                    [action.payload.title]: action.payload.quantity
                }
            };

        default:
            return state;
    }
}
