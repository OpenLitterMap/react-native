import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    appVersion: null,
    showUploadModal: false,
    showThankYouMessages: false
};

export const checkAppVersion = createAsyncThunk(
    'app/checkAppVersion',
    async (_, {rejectWithValue}) => {
        try {
            const response = await api.get('/api/mobile-app-version');
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Failed to check app version'
            );
        }
    }
);

const sharedSlice = createSlice({
    name: 'shared',
    initialState,
    reducers: {
        cancelUpload(state) {
            state.showUploadModal = false;
        },

        closeThankYouMessages(state) {
            state.showUploadModal = false;
            state.showThankYouMessages = false;
        },

        resetThankYouMessages(state) {
            state.showThankYouMessages = false;
        },

        showThankYouMessagesAfterUpload(state) {
            state.showThankYouMessages = true;
        },

        startUploading(state) {
            state.showUploadModal = true;
        }
    },

    extraReducers: builder => {
        builder
            .addCase(checkAppVersion.fulfilled, (state, action) => {
                state.appVersion = action.payload;
            })
            .addCase(logout, () => initialState);
    }
});

export const {
    cancelUpload,
    closeThankYouMessages,
    resetThankYouMessages,
    showThankYouMessagesAfterUpload,
    startUploading
} = sharedSlice.actions;

export default sharedSlice.reducer;
