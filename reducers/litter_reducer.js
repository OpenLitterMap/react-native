import {
    ADD_PREVIOUS_TAG,
    CHANGE_CATEGORY,
    CHANGE_ITEM,
    CHANGE_Q,
    CONFIRM_FOR_UPLOAD,
    // FILTER_TAGS,
    ITEM_SELECTED,
    REMOVE_PREVIOUS_TAG,
    REMOVE_TAG,
    RESET_LITTER_COLLECTION_OBJECT,
    UPDATE_PREVIOUS_TAGS,
    SAVE_PREVIOUS_TAGS,
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

const INITIAL_STATE = {
    category: CATEGORIES[0].title,
    items: CATEGORIES[0].items,
    item: CATEGORIES[0].items[0],
    q: "1",
    // collection: [],
    // collectionModalVisible: false,
    collectionLength: 0,
    currentTotalItems: false, // LitterPicker modal option 1
    displayAllTags: false,
    hasLitter: false,
    index: null,
    photoSelected: null,
    presence: true,
    positions: {}, // coordinates of each tag for animation
    suggestedTags: [],
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
         * @return Smoking, Alcohol, Food..... and associated items
         */
        case CHANGE_CATEGORY:
            // select from array by ID
            const category   = CATEGORIES[action.payload]['title'];
            const items      = CATEGORIES[action.payload]['items'];
            const first      = CATEGORIES[action.payload]['items'][0];

            return {
                ...state,
                category: category,
                items: items,
                item: first,
                q: "1"
            };

        /**
         * Change item within a category
         * @return cigarette butts, lighters, packaging....
         */
        case CHANGE_ITEM:
            // console.log("reducer, changeItem", action.payload);
            return {
                ...state,
                item: action.payload,
                q: "1"
            };

        /**
         * Change quantity
         * @return 1,2,3...
         */
        case CHANGE_Q:
            return {
                ...state,
                q: action.payload
            };

        /**
         * The user has pressed the "confirm" button
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
            // console.log('litter_reducer.item_selected', action.payload);

            let newTags1 = Object.assign({}, action.payload.litter);

            let newImage = Object.assign({}, action.payload);

            return {
                ...state,
                photoSelected: newImage,
                // modalVisible: true,
                litterVisible: true,
                tags: newTags1,
                q: "1"
            };

        /**
         * Remove a tag
         */
        case REMOVE_TAG:
            // console.log("removetag", action.payload);
            let tags2 = Object.assign({}, state.tags);
            delete tags2[action.payload.category][action.payload.item];

            var total = 0;
            var length = 0;
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
        case RESET_LITTER_COLLECTION_OBJECT:
            return Object.assign({}, state, {
                category: CATEGORIES[0].title,
                items: CATEGORIES[0].items,
                item: CATEGORIES[0].items[0],
                q: "1",
                // collection: [],
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

            return Object.assign({}, state, {
                category: CATEGORIES[0].title,
                items: CATEGORIES[0].items,
                item: CATEGORIES[0].items[0],
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
         * Return 6 suggested tags based on text input
         */
        case SUGGEST_TAGS:

            let x = [];

            CATEGORIES.some(cat => {
                cat.items.some(item => {
                    if (item.toLowerCase().includes(action.payload.toLowerCase()))
                    {
                        x.push({ cat: cat.title, item });

                        return x.length == 6;
                    }
                });

                return x.length == 6;
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

                    if (newTags[action.payload.category][action.payload.title] == quantity) quantity++;
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
         *
         */
        case TOGGLE_SWITCH:
            return Object.assign({}, state, {
                presence: ! state.presence
            });


        /**
         *
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
