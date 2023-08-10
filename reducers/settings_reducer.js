import {produce} from 'immer';
import {
    CLOSE_SECOND_SETTING_MODAL,
    SET_MODEL,
    SETTINGS_INIT,
    SETTINGS_UPDATE_STATUS_MESSAGE,
    START_UPDATING_SETTINGS,
    TOGGLE_SETTINGS_MODAL,
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
    deleteAccountError: '',
    updateSettingsStatusMessage: '',
    updatingSettings: false
};

export default function (state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            case CLOSE_SECOND_SETTING_MODAL:
                draft.updateSettingsStatusMessage = '';
                draft.updatingSettings = false;
                draft.secondSettingsModalVisible = false;

                break;

            /**
             * The users delete-account attempt failed due to wrong password
             */
            case 'SET_DELETE_ACCOUNT_ERROR':
                draft.deleteAccountError = action.payload;
                break;

            /**
             * sets current device modal
             */
            case SET_MODEL:
                draft.model = action.payload;

                break;

            /**
             * Initialize the settings value for edit / update
             *
             * when user selects a field to edit current value of that field is set in settingsEditProp
             * to be used as initial value in textfield in edit modal
             */
            case SETTINGS_INIT:
                draft.settingsEditProp = action.payload;

                break;

            /**
             * Update the status message after api call to update user data
             * 'SUCCESS'/'ERROR'
             *
             * Used to render Success/Error modal based on the value --> 'SUCCESS'/'ERROR'
             *
             * TODO: use better name than updateSettingsStatusMessage
             */
            case SETTINGS_UPDATE_STATUS_MESSAGE:
                draft.updateSettingsStatusMessage = action.payload;

                break;

            /**
             * There is a second modal in a modal to wait for POST request to complete
             */
            case START_UPDATING_SETTINGS:
                draft.secondSettingsModalVisible = true;
                draft.updatingSettings = true;

                break;

            /**
             * Change name / username / email component is inside a modal
             */
            case TOGGLE_SETTINGS_MODAL:
                draft.settingsModalVisible = !draft.settingsModalVisible;
                draft.settingsEdit = !draft.settingsEdit;
                draft.dataToEdit = action.payload;

                break;

            /**
             * Toggle ActivityIndicator when changing Switch value
             */
            case TOGGLE_SETTINGS_WAIT:
                draft.wait = !draft.wait;
                draft.settingsModalVisible = !draft.settingsModalVisible;

                break;

            /**
             * User wants to change text in SettingsComponent
             */
            case UPDATE_SETTINGS_PROP:
                draft.settingsEditProp = action.payload;

                break;

            /**
             * Default
             */
            default:
                return draft;
        }
    });
}
