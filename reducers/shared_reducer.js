import axios from 'axios';
import { URL } from '../actions/types';
import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
    appVersion: null,
    isUploading: false,
    showModal: false,
    showThankYouMessages: false,
};

/**
 * API calls
 *
 * - createAppVersion
 */

export const checkAppVersion = createAsyncThunk(
    'app/checkAppVersion',
    async (_, { rejectWithValue }) => {
        try
        {
            const response = await axios({
                url: URL + '/api/mobile-app-version',
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            return response.data;
        }
        catch (error)
        {
            return rejectWithValue(error.response?.data?.message || 'Failed to check app version');
        }
    }
);

const sharedSlice = createSlice({

    name: 'shared',

    initialState,

    reducers: {

        /**
         * During upload, the user pressed cancel.
         */
        cancelUpload (state) {
            state.isUploading = false;
            state.showModal = false;
        },

        /**
         * After uploading,
         * Thank you messages are shown,
         * Now we hide the modal and messages.
         */
        closeThankYouMessages(state) {
            state.showModal = false;
            state.showThankYouMessages = false;
        },

        resetThankYouMessages (state) {
            state.showThankYouMessages = false;
        },

        /**
         * Show Thank You + upload messages after uploading
         */
        showThankYouMessagesAfterUpload (state) {
            state.isUploading = false;
            state.showThankYouMessages = true;
        },

        /**
         * We have begun uploading
         *
         * 1. Show the modal
         * 2. Show the Uploading component
         */
        startUploading (state) {
            state.showModal = true;
            state.isUploading = true;
        },
    },

    extraReducers: (builder) => {

        builder

            .addCase(checkAppVersion.fulfilled, (state, action) => {
                state.appVersion = action.payload;
            });
    }
});

export const {
    cancelUpload,
    closeThankYouMessages,
    resetThankYouMessages,
    showThankYouMessagesAfterUpload,
    startUploading,
} = sharedSlice.actions;

export default sharedSlice.reducer;
