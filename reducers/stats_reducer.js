import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    error: null,
    totalTags: 0,
    totalImages: 0,
    totalUsers: 0,
    newUsersToday: 0,
    newUsersLast7Days: 0,
    newUsersLast30Days: 0
};

export const getStats = createAsyncThunk(
    'stats/getStats',
    async (_, {rejectWithValue}) => {
        try {
            const response = await api.get('/api/global/stats-data');
            return response.data;
        } catch (error) {
            return error.response
                ? rejectWithValue('Something went wrong, please try again')
                : rejectWithValue('Network error, please try again');
        }
    }
);

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getStats.pending, state => {
                state.error = null;
            })
            .addCase(getStats.fulfilled, (state, action) => {
                state.totalTags = action.payload?.total_tags || 0;
                state.totalImages = action.payload?.total_images || 0;
                state.totalUsers = action.payload?.total_users || 0;
                state.newUsersToday = action.payload?.new_users_today || 0;
                state.newUsersLast7Days =
                    action.payload?.new_users_last_7_days || 0;
                state.newUsersLast30Days =
                    action.payload?.new_users_last_30_days || 0;
                state.error = null;
            })
            .addCase(getStats.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(logout, () => initialState);
    }
});

export default statsSlice.reducer;
