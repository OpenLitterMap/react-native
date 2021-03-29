import {
    ADD_PREVIOUS_TAG,
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    CONFIRM_FOR_UPLOAD,
    CHANGE_SWIPER_INDEX,
    // FILTER_TAGS,
    ITEM_SELECTED,
    LITTER_SELECTED,
    REMOVE_PREVIOUS_TAG,
    REMOVE_TAG,
    RESET_TAGS,
    RESET_LITTER_STATE,
    UPDATE_PREVIOUS_TAGS,
    SELECT_PHOTO,
    SHOW_ALL_TAGS,
    SHOW_INNER_MODAL,
    SLIDE_IN_NEXT_GALLERY,
    SUGGEST_TAGS,
    TAG_LITTER,
    TOGGLE_SWITCH,
    UPDATE_TAGS,
    UPDATE_TAGS_X_POS,
    UPDATE_QUANTITY
} from '../actions/types';

import CATEGORIES from '../screens/pages/data/categories';
import LITTERKEYS from "../screens/pages/data/litterkeys";

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
    photoSelected: null,
    presence: true,
    positions: {}, // coordinates of each tag for animation
    suggestedTags: [],
    swiperIndex: 0,
    tags: {},
    tagsModalVisible: false,
    totalImagesToUpload: 0,
    totalLitterCount: 0
};

export default function (state = INITIAL_STATE, action)
{
    switch (action.type)
    {
        /**
         * Change category
         *
         * @category = Object => title: 'smoking", 'path: '../filepath.png'
         * @items = Array of objects [ { id, key }, { id, key } ]
         * @item = First key from array 'butts'
         */
        case CHANGE_CATEGORY:

            const category = CATEGORIES.find(cat => cat.title === action.payload);
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
         * Change item key within a category
         *
         * @return 'butts', 'facemask', etc.
         */
        case CHANGE_ITEM:

            return {
                ...state,
                item: action.payload,
                q: "1"
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

        // case FILTER_TAGS:
        //     console.log('filter_tags.reducer', action.payload);
        //     return {
        //         ...state
        //     };

        /**
         * An item has been selected
         */
        case ITEM_SELECTED:

            // Check if any litter already exists on this item / index?
            console.log('reducer.item_selected', action.payload);

            let newTags1 = Object.assign({}, action.payload.litter);
            let newImage = Object.assign({}, action.payload);

            console.log({ newImage });

            return {
                ...state,
                photoSelected: newImage,
                // modalVisible: true,
                litterVisible: true,
                tags: newTags1,
                q: "1"
            };
        
        case LITTER_SELECTED:

          // Check if any litter already exists on this item / index?
          // console.log('litter_reducer.item_selected', action.payload);

          let newTags2 = Object.assign({}, action.payload.litter);

          return {
              ...state,
              // modalVisible: true,
              litterVisible: true,
              tags: newTags2,
              q: "1"
          };

        /**
         * Remove a tag
         */
        case REMOVE_TAG:

            // console.log("removetag", action.payload);
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
                q: "1",
                tags: {},
                switchValue: true,
                totalLitterCount: 0,
                // collectionModalVisible: false,
                tagsModalVisible: false,
                collectionLength: 0,
                hasLitter: false
            });

        /**
         * The user has selected a photo
         * @return first photo selected from gallery
         * else
         * @return photo from camera roll
         */
        case SELECT_PHOTO:

            return Object.assign({}, state, {
                photoSelected: action.payload
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
                tagsModalVisible: ! state.tagsModalVisible
            });

        /**
         * Slide in the next photo for tagging
         * todo - not just for gallery
         * todo - create slide in animation
         * todo - allow the user to swipe left & right between images
         */
        case SLIDE_IN_NEXT_GALLERY:
            // console.log("reducer - litter Slide In Next", action.payload);

            console.log('slide_in_next_gallery');

            const category2 = CATEGORIES.find(cat => cat.title === action.payload);
            const items2 = LITTERKEYS[category2.title];
            const item2 = items2[0].key;

            return Object.assign({}, state, {
                category: category2,
                items: items2,
                item: item2,
                q: "1",
                // collection: [],
                tags: action.payload.tags,
                previousTags: {},
                switchValue: true,
                totalLitterCount: 0,
                // collectionModalVisible: false,
                tagsModalVisible: false,
                collectionLength: 0,
                hasLitter: false,
                photoSelected: action.payload.item
            });

        /**
         * Filter all translated tag values
         *
         * Return all results
         *
         * We are passing auth.lang as a prop which could be access from auth_reducer
         */
        case SUGGEST_TAGS:

            let x = [];

            Object.entries(LITTERKEYS).some(tags => {

                tags[1].some(tag => {

                    const t = getTranslation(`${action.payload.lang}.litter.${tags[0]}.${tag.key}`);

                    if (t.toLowerCase().includes(action.payload.text.toLowerCase()))
                    {
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
         * Add litter data to tags
         * category[title] = quantity
         * eg Smoking['Cigarette Butts'] = 4
         *    Alcohol['Beer Cans'] = 5
         *    etc
         *
         * ++ Increment the quantity if button pressed repeatedly
         */
        case TAG_LITTER:

            let newTags = Object.assign({}, state.tags);

            let quantity = 1;

            // if quantity exists, assign it
            if (action.payload.hasOwnProperty('quantity'))
            {
                quantity = action.payload.quantity;
            }

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

            return {
                ...state,
                tags: newTags,
                totalLitterCount: litter_total,
                collectionLength: litter_length,
                q: quantity
            };

        /**
         * This will toggle the value for the Switch, not the value for each individual image.
         */
        case TOGGLE_SWITCH:

            return Object.assign({}, state, {
                presence: ! state.presence
            });


        /**
         * When previous tags is true, we re-apply them to the next image here
         */
        case UPDATE_TAGS:

            let updateTags = Object.assign({}, action.payload);

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
