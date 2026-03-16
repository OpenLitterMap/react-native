import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    appVersion: null
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
    extraReducers: builder => {
        builder
            .addCase(checkAppVersion.fulfilled, (state, action) => {
                state.appVersion = action.payload;
            })
            .addCase(checkAppVersion.rejected, (state) => {
                if (state.appVersion === null) {
                    state.appVersion = {};
                }
            })
            .addCase(logout, () => initialState);
    }
});

export default sharedSlice.reducer;
