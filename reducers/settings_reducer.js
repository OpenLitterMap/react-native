import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {updateUserObject, logout} from './auth_reducer';

const initialState = {
    deviceModel: '',
    editModalVisible: false,
    saveResultModalVisible: false,
    editValue: '',
    editField: null,
    savingToggle: false,
    deleteAccountError: '',
    saveResultMessage: '',
    isSaving: false
};

/** Privacy toggle endpoint mapping — IDs match SettingsScreen section data */
const PRIVACY_ENDPOINTS = {
    4: 'maps/name',
    5: 'maps/username',
    6: 'leaderboard/name',
    7: 'leaderboard/username',
    8: 'createdby/name',
    9: 'createdby/username',
    10: 'toggle-previous-tags'
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
    async ({password}, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/settings/delete-account/', {
                token,
                data: {password}
            });

            if (!response.data.success) {
                const msg =
                    response.data.msg === 'password does not match'
                        ? 'Your password did not match'
                        : 'Failed to delete account';
                return rejectWithValue(msg);
            }

            await AsyncStorage.clear();
            dispatch(logout());
            return response.data;
        } catch (error) {
            if (__DEV__) {
                console.error('ERROR DELETE_ACCOUNT', error);
            }
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete account'
            );
        }
    }
);

export const saveSettings = createAsyncThunk(
    'settings/save',
    async ({dataKey, dataValue}, {getState, rejectWithValue, dispatch}) => {
        // Backend ALLOWED_SETTINGS keys are all lowercase.
        // enable_admin_tagging is NOT in the backend whitelist — omit it.
        const key = dataKey;

        try {
            const token = getState().auth.token;
            const response = await api.post('/api/settings/update/', {
                token,
                data: {key, value: dataValue}
            });

            if (response.data?.success) {
                const user = {...getState().auth.user, [dataKey]: dataValue};
                await AsyncStorage.setItem('user', JSON.stringify(user));
                dispatch(updateUserObject(user));

                return {
                    key: dataKey,
                    value: dataValue,
                    message: 'SUCCESS'
                };
            } else {
                return rejectWithValue('Failed to update settings');
            }
        } catch (error) {
            if (__DEV__) {
                console.error('saveSettings', error);
            }
            return rejectWithValue('ERROR');
        }
    }
);

export const saveSocialAccounts = createAsyncThunk(
    'settings/saveSocialAccounts',
    async ({values}, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.patch('/api/settings', {
                token,
                data: {...values}
            });

            if (response?.data?.message === 'success') {
                const user = {...getState().auth.user, settings: values};
                await AsyncStorage.setItem('user', JSON.stringify(user));
                dispatch(updateUserObject(user));

                return 'SUCCESS';
            } else {
                return rejectWithValue('ERROR');
            }
        } catch (error) {
            return rejectWithValue('ERROR');
        }
    }
);

export const toggleSettingsSwitch = createAsyncThunk(
    'settings/toggleSwitch',
    async ({id}, {getState, rejectWithValue, dispatch}) => {
        const endUrl = PRIVACY_ENDPOINTS[id] || '';

        try {
            const token = getState().auth.token;
            const response = await api.post(`/api/settings/privacy/${endUrl}`, {
                token
            });

            if (response.status === 200) {
                const key = Object.keys(response.data)[0];
                let value = Object.values(response.data)[0];

                // Convert boolean values to 0 or 1 for certain keys
                if (key !== 'show_name' && key !== 'show_username') {
                    value = value === false ? 0 : 1;
                }

                const user = {...getState().auth.user, [key]: value};
                await AsyncStorage.setItem('user', JSON.stringify(user));
                dispatch(updateUserObject(user));

                return response.data;
            } else {
                return rejectWithValue('Failed to update settings');
            }
        } catch (error) {
            return rejectWithValue('Failed to toggle setting');
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',

    initialState,

    reducers: {
        closeSaveResultModal(state) {
            state.saveResultMessage = '';
            state.isSaving = false;
            state.saveResultModalVisible = false;
        },

        setDeleteAccountError(state, action) {
            state.deleteAccountError = action.payload;
        },

        setDeviceModel(state, action) {
            state.deviceModel = action.payload;
        },

        setEditValue(state, action) {
            state.editValue = action.payload;
        },

        toggleEditModal(state, action) {
            state.editModalVisible = !state.editModalVisible;
            state.editField = action.payload;
        }
    },

    extraReducers: builder => {
        builder

            // Delete Account
            .addCase(deleteAccount.pending, (state) => {
                state.deleteAccountError = '';
                state.isSaving = true;
            })
            .addCase(deleteAccount.fulfilled, (state) => {
                state.isSaving = false;
            })
            .addCase(deleteAccount.rejected, (state, action) => {
                state.isSaving = false;
                state.deleteAccountError = action.payload;
            })

            // Save Settings
            .addCase(saveSettings.pending, state => {
                state.saveResultModalVisible = true;
                state.isSaving = true;
            })
            .addCase(saveSettings.fulfilled, (state, action) => {
                state.saveResultMessage = action.payload.message;
            })
            .addCase(saveSettings.rejected, (state, action) => {
                state.saveResultMessage = action.payload;
            })

            // Save Social Accounts
            .addCase(saveSocialAccounts.pending, state => {
                state.saveResultModalVisible = true;
                state.isSaving = true;
            })
            .addCase(saveSocialAccounts.fulfilled, (state, action) => {
                state.saveResultMessage = action.payload;
            })
            .addCase(saveSocialAccounts.rejected, (state, action) => {
                state.saveResultMessage = action.payload;
            })

            .addCase(toggleSettingsSwitch.pending, (state) => {
                state.savingToggle = true;
            })
            .addCase(toggleSettingsSwitch.fulfilled, (state) => {
                state.savingToggle = false;
            })
            .addCase(toggleSettingsSwitch.rejected, (state) => {
                state.savingToggle = false;
            })
            .addCase(logout, () => initialState);
    }
});

export const {
    closeSaveResultModal,
    setDeleteAccountError,
    setDeviceModel,
    setEditValue,
    toggleEditModal
} = settingsSlice.actions;

export default settingsSlice.reducer;
