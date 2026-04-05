import {createAsyncThunk, createSelector, createSlice} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    totalTags: 0,
    totalImages: 0,
    totalUsers: 0,
    newUsersToday: 0,
    newUsersLast7Days: 0,
    newUsersLast30Days: 0,
    newTagsToday: 0,
    newTagsLast7Days: 0,
    newTagsLast30Days: 0,
    newPhotosToday: 0,
    newPhotosLast7Days: 0,
    newPhotosLast30Days: 0
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
                state.fetchStatus = 'loading';
                state.error = null;
            })
            .addCase(getStats.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.totalTags = action.payload?.total_tags || 0;
                state.totalImages = action.payload?.total_images || 0;
                state.totalUsers = action.payload?.total_users || 0;
                state.newUsersToday = action.payload?.new_users_last_24_hours || 0;
                state.newUsersLast7Days =
                    action.payload?.new_users_last_7_days || 0;
                state.newUsersLast30Days =
                    action.payload?.new_users_last_30_days || 0;
                state.newTagsToday = action.payload?.new_tags_last_24_hours || 0;
                state.newTagsLast7Days =
                    action.payload?.new_tags_last_7_days || 0;
                state.newTagsLast30Days =
                    action.payload?.new_tags_last_30_days || 0;
                state.newPhotosToday = action.payload?.new_photos_last_24_hours || 0;
                state.newPhotosLast7Days =
                    action.payload?.new_photos_last_7_days || 0;
                state.newPhotosLast30Days =
                    action.payload?.new_photos_last_30_days || 0;
                state.error = null;
            })
            .addCase(getStats.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.payload;
            })
            .addCase(logout, () => initialState);
    }
});

// Memoized selector — prevents re-renders when unrelated state changes
export const selectStats = createSelector(
    state => state.stats,
    stats => ({
        totalTags: stats.totalTags,
        totalImages: stats.totalImages,
        totalUsers: stats.totalUsers,
        newUsersToday: stats.newUsersToday,
        newUsersLast7Days: stats.newUsersLast7Days,
        newUsersLast30Days: stats.newUsersLast30Days,
        newTagsToday: stats.newTagsToday,
        newTagsLast7Days: stats.newTagsLast7Days,
        newTagsLast30Days: stats.newTagsLast30Days,
        newPhotosToday: stats.newPhotosToday,
        newPhotosLast7Days: stats.newPhotosLast7Days,
        newPhotosLast30Days: stats.newPhotosLast30Days
    })
);

export default statsSlice.reducer;
