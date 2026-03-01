import axios from "axios";
import { URL } from '../actions/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserObject, logout } from './auth_reducer';
import { clearUploadedWebImages } from './images_reducer';

const initialState = {
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

/**
 * API Requests
 *
 * - deleteAccount
 * - saveSettings
 * - saveSocialAccounts
 */

export const deleteAccount = createAsyncThunk(
    'account/delete',
    async ({ password, token }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${URL}/api/settings/delete-account/`, {
                password
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data.success && response.data.msg === 'password does not match') {
                return rejectWithValue('Your password did not match');
            } else {
                // Consider handling side effects like AsyncStorage outside of the redux flow or use middleware
                await AsyncStorage.clear();

                return response.data;
            }
        } catch (error) {
            console.error('ERROR DELETE_ACCOUNT', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
        }
    }
);

export const saveSettings = createAsyncThunk(
    'settings/save',
    async ({ dataKey, dataValue, token }, { rejectWithValue, dispatch }) => {

        const keyMap = {
            name: 'Name',
            username: 'Username',
            email: 'Email',
            picked_up: 'picked_up',
            global_flag: 'global_flag',
            enable_admin_tagging: 'enable_admin_tagging'
        };

        const key = keyMap[dataKey] || dataKey; // Default to the original key if not mapped

        try
        {
            const response = await axios({
                url: `${URL}/api/settings/update/`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'content-type': 'application/json'
                },
                data: {
                    key,
                    value: dataValue
                }
            });

            if (response.data.success) {
                // Get user and parse json to Object
                let user = await AsyncStorage.getItem('user');

                user = JSON.parse(user);

                user[dataKey] = dataValue;

                // save updated user data
                await AsyncStorage.setItem('user', JSON.stringify(user));

                dispatch(updateUserObject(user));

                if (key === 'enable_admin_tagging') {
                    if (dataValue) {
                        dispatch(clearUploadedWebImages());
                    }
                }

                return {
                    key: dataKey,
                    value: dataValue,
                    message: 'SUCCESS',
                    clearUploadedImages: key === 'enable_admin_tagging' && dataValue
                };
            } else {
                return rejectWithValue('Failed to update settings');
            }
        }
        catch (error)
        {
            console.error('saveSettings', error);
            return rejectWithValue('ERROR');
        }
    }
);

export const saveSocialAccounts = createAsyncThunk(
    'settings/saveSocialAccounts',
    async ({ values, token }, { rejectWithValue, dispatch }) => {
        try
        {
            const response = await axios({
                url: `${URL}/api/settings`,
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'content-type': 'application/json'
                },
                data: {
                    ...values
                }
            });

            if (response?.data?.message === 'success') {

                let user = await AsyncStorage.getItem('user');
                user = JSON.parse(user);
                user.settings = values;
                await AsyncStorage.setItem('user', JSON.stringify(user));

                dispatch(updateUserObject(user));

                return 'SUCCESS';
            } else {
                return rejectWithValue('ERROR');
            }
        }
        catch (error)
        {
            // console.log('saveSocialAccounts', error);
            return rejectWithValue('ERROR');
        }
    }
);

export const toggleSettingsSwitch = createAsyncThunk(
    'settings/toggleSwitch',
    async ({ id, token }, { rejectWithValue, dispatch }) => {
        const endpointMap = {
            4: 'maps/name',
            5: 'maps/username',
            6: 'leaderboard/name',
            7: 'leaderboard/username',
            8: 'createdby/name',
            9: 'createdby/username',
            10: 'toggle-previous-tags'
        };

        const endUrl = endpointMap[id] || '';

        try
        {
            const response = await axios.post(`${URL}/api/settings/privacy/${endUrl}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'content-type': 'application/json'
                }
            });

            if (response.status === 200) {
                const key = Object.keys(response.data)[0];
                let value = Object.values(response.data)[0];

                // Convert boolean values to 0 or 1 for certain keys
                if (key !== 'show_name' && key !== 'show_username') {
                    value = value === false ? 0 : 1;
                }

                let user = await AsyncStorage.getItem('user');
                user = JSON.parse(user);
                user[key] = value;

                await AsyncStorage.setItem('user', JSON.stringify(user));

                dispatch(updateUserObject(user));

                return response.data;
            } else {
                return rejectWithValue('Failed to update settings');
            }
        } catch (error) {
            // console.log('Error: toggleSettingsSwitch', error);
            return rejectWithValue('Failed to toggle setting');
        }
    }
);

const settingsSlice = createSlice({

    name: 'settings',

    initialState,

    reducers: {

        closeSecondSettingModal(state) {
            state.updateSettingsStatusMessage = '';
            state.updatingSettings = false;
            state.secondSettingsModalVisible = false;
        },

        /**
         * The users delete-account attempt failed due to wrong password
         */
        setDeleteAccountError(state, action) {
            state.deleteAccountError = action.payload;
        },

        /**
         * Sets current device modal
         */
        setModel (state, action) {
            state.model = action.payload;
        },

        /**
         * Initialize the settings value for edit / update
         *
         * when user selects a field to edit current value of that field is set in settingsEditProp
         * to be used as initial value in textfield in edit modal
         */
        settingsInit (state, action) {
            state.settingsEditProp = action.payload;
        },

        /**
         * Change name / username / email component is inside a modal
         */
        toggleSettingsModal (state, action) {
            state.settingsModalVisible = !state.settingsModalVisible;
            state.settingsEdit = !state.settingsEdit;
            state.dataToEdit = action.payload;
        },

        /**
         * Toggle ActivityIndicator when changing Switch value
         */
        toggleSettingsWait(state) {
            state.wait = !state.wait;
            state.settingsModalVisible = !state.settingsModalVisible;
        },

        /**
         * User wants to change text in SettingsComponent
         */
        updateSettingsProp (state, action) {
            state.settingsEditProp = action.payload;
        }
    },

    extraReducers: (builder) => {

        builder

            // Delete Account
            .addCase(deleteAccount.pending, (state, action) => {
                // loading => true
            })
            .addCase(deleteAccount.fulfilled, (state, action) => {
                // return true and logout
            })
            .addCase(deleteAccount.rejected, (state, action) => {
                state.deleteAccountError = action.payload;
            })

            // Save Settings
            .addCase(saveSettings.pending, (state) => {
                state.secondSettingsModalVisible = true;
                state.updatingSettings = true;
            })
            .addCase(saveSettings.fulfilled, (state, action) => {
                state.updateSettingsStatusMessage = action.payload.message;
            })
            .addCase(saveSettings.rejected, (state, action) => {
                state.updateSettingsStatusMessage = action.payload;
            })

            // Save Social Accounts
            .addCase(saveSocialAccounts.pending, (state) => {
                state.secondSettingsModalVisible = true;
                state.updatingSettings = true;
            })
            .addCase(saveSocialAccounts.fulfilled, (state, action) => {
                state.updateSettingsStatusMessage = action.payload;
            })
            .addCase(saveSocialAccounts.rejected, (state, action) => {
                state.updateSettingsStatusMessage = action.payload;
            })

            .addCase(toggleSettingsSwitch.pending, (state, action) => {
                state.wait = true;
            })
            .addCase(toggleSettingsSwitch.fulfilled, (state, action) => {
                state.wait = false;
            })
            .addCase(toggleSettingsSwitch.rejected, (state, action) => {
                state.wait = false;
            })
            .addCase(logout, () => initialState);

    }
});

export const {
    closeSecondSettingModal,
    setDeleteAccountError,
    setModel,
    settingsInit,
    toggleSettingsModal,
    toggleSettingsWait,
    updateSettingsProp
} = settingsSlice.actions;

export default settingsSlice.reducer;
