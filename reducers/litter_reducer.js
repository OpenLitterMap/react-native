import produce from 'immer';
import {
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    CHANGE_QUANTITY_STATUS,
    CONFIRM_FOR_UPLOAD,
    CHANGE_SWIPER_INDEX,
    RESET_LITTER_STATE,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SUGGEST_TAGS,
    TOGGLE_SWITCH,
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
    totalLitterCount: 0,
    quantityChanged: false
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * Change category
             *
             * @category = Object => title: 'smoking", 'path: '../filepath.png'
             * @items = Array of objects [ { id, key }, { id, key } ]
             * @item = First key from array 'butts'
             */
            // FIXME: Make it pure fn
            case CHANGE_CATEGORY:
                const category = CATEGORIES.find(
                    cat => cat.title === action.payload
                );
                const items = LITTERKEYS[category.title];
                const item = items[0].key;
                draft.category = category;
                draft.items = items;
                draft.item = item;
                draft.q = 1;

                break;

            /**
             * Change item key within a category
             *
             * @return 'butts', 'facemask', etc.
             */
            case CHANGE_ITEM:
                draft.item = action.payload;
                draft.q = '1';

                break;

            /**
             * Change quantity
             *
             * set quantityChanged to true so that next time Add Tag
             * is pressed before changing tag quantity in increased by 1;
             */

            case CHANGE_Q:
                draft.q = action.payload;
                draft.quantityChanged = true;

                break;

            /**
             * Change Status of quantity change
             * picker wheel rotated status == True
             * after tag is added satus set to false
             */

            case CHANGE_QUANTITY_STATUS:
                draft.quantityChanged = action.payload;

                break;

            /**
             * Change the index of the Swiper on LitterPicker.Swiper.LitterImage
             */

            case CHANGE_SWIPER_INDEX:
                draft.swiperIndex = action.payload;

                break;

            // Reset tags to null and close LitterPicker modal
            // TODO: test this
            case RESET_LITTER_STATE:
                return INITIAL_STATE;
                // const category1 = CATEGORIES[0];
                // const items1 = LITTERKEYS[category1.title];
                // const item1 = items1[0].key;

                // return Object.assign({}, state, {
                //     category: category1,
                //     items: items1,
                //     item: item1,
                //     q: '1',
                //     tags: {},
                //     switchValue: true,
                //     totalLitterCount: 0,
                //     // collectionModalVisible: false,
                //     tagsModalVisible: false,
                //     collectionLength: 0,
                //     hasLitter: false
                // });
                break;

            /**
             * Content to show in the modal on LitterPicker
             */

            case SHOW_ALL_TAGS:
                draft.displayAllTags = action.payload;

                break;

            /**
             * Show the modal on LitterPicker.js
             * Need to set the content separately
             */

            case SHOW_INNER_MODAL:
                draft.tagsModalVisible = !draft.tagsModalVisible;

                break;
            /**
             * Filter all translated tag values
             *
             * Return all results
             *
             * Note: We are passing auth.lang as a prop which could be access from auth_reducer
             */
            case SUGGEST_TAGS:
                // return array of suggested tags based on payload text
                let suggestedTagsArray = [];

                Object.entries(LITTERKEYS).some(tags => {
                    tags[1].some(tag => {
                        const translatedText = getTranslation(
                            `${action.payload.lang}.litter.${tags[0]}.${
                                tag.key
                            }`
                        );

                        if (
                            translatedText
                                .toLowerCase()
                                .includes(action.payload.text.toLowerCase())
                        ) {
                            suggestedTagsArray.push({
                                category: tags[0],
                                key: tag.key
                            });
                        }
                    });
                });

                draft.suggestedTags = suggestedTagsArray;

                break;

            /**
             * This will toggle the value for the Switch, not the value for each individual image.
             */
            // INFO: This is not used currently
            // TODO: will need to change presence on particular image
            case TOGGLE_SWITCH:
                draft.presence = !draft.presence;

                break;

            /**
             * Update X-position of tags
             */
            // TODO: Test this -- not sure if it works
            // payload.item is not passed from -litterTags

            case UPDATE_TAGS_X_POS:
                let positions = Object.assign({}, state.positions);
                positions[action.payload.item] = action.payload.x;

                draft.positions = positions;

                break;

            default:
                return draft;
        }
    });
}
