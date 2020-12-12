import {
    CLOSE_ALL_SETTINGS_MODALS,
    CLOSE_SECOND_SETTING_MODAL,
    SAVE_SETTING,
    SET_MODEL,
    SETTINGS_INIT,
    SETTINGS_UPDATE_SUCCESS,
    START_UPDATING_SETTINGS,
    TOGGLE_SETTINGS_MODAL,
    TOGGLE_SECOND_SETINGS_MODAL,
    TOGGLE_SETTINGS_WAIT,
    UPDATE_SETTINGS_PROP
} from '../actions/types';

const INITIAL_STATE = {
    model: '',
    settingsModalVisible: false,
    secondSettingsModalVisible: false,
    settingsEdit: false,
    settingsEditProp: '',
    wait: false,
    dataToEdit: null,
    updateSettingsSuccess: false,
    updatingSettings: false
};

export default function (state = INITIAL_STATE, action) {

    switch (action.type)
    {
        case CLOSE_ALL_SETTINGS_MODALS:
            return {
                ...state,
                // success message
                updateSettingsSuccess: false,
                // activity indicator
                updatingSettings: false,
                // editing modal
                secondSettingsModalVisible: false,

                // Settings Modal
                // settingsModalVisible: false,
                // SettingsComponent
                // settingsEdit: false,
                // wait: false
            };

        case CLOSE_SECOND_SETTING_MODAL:
            return {
                ...state,
                // success message
                updateSettingsSuccess: false,
                // activity indicator
                updatingSettings: false,
                // editing modal
                secondSettingsModalVisible: false,
            };

        // case SAVE_SETTING:
        //   return {
        //     ...state,
        //
        //   };

        /**
         * Set Model
         */
        case SET_MODEL:
            return {
                ...state,
                model: action.payload
            };

        /**
         * Initialize the settings value for edit / update
         */
        case SETTINGS_INIT:
            // const init = Object.assign({}, action.payload);
            return {
                ...state,
                settingsEditProp: action.payload
            };

        /**
         * Settings have been updated successfully - show success message
         */
        case SETTINGS_UPDATE_SUCCESS:
            return {
                ...state,
                updateSettingsSuccess: ! state.updateSettingsSuccess
            };

        /**
         * There is a second modal in a modal to wait for POST request to complete
         */
        case START_UPDATING_SETTINGS:
            return {
                ...state,
                secondSettingsModalVisible: ! state.secondSettingsModalVisible,
                updatingSettings: ! state.updatingSettings
            };

        /**
         * Change name / username / email component is inside a modal
         */
        case TOGGLE_SETTINGS_MODAL:
            // todo - immutability for dataToEdit
            // const data = Object.assign({}, action.payload);
            return {
                ...state,
                settingsModalVisible: ! state.settingsModalVisible,
                settingsEdit: ! state.settingsEdit,
                dataToEdit: action.payload
            };

        /**
         * Toggle ActivityIndicator when changing Switch value
         */
        case TOGGLE_SETTINGS_WAIT:
            return {
                ...state,
                wait: ! state.wait,
                settingsModalVisible: ! state.settingsModalVisible
            };


        /**
         * User wants to change text in SettingsComponent
         */
        case UPDATE_SETTINGS_PROP:
            return {
                ...state,
                settingsEditProp: action.payload
            };

        /**
         * Default
         */
        default:
            return state;
    }
};
