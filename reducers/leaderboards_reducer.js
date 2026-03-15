import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    paginated: {
        users: [],
        hasNextPage: false,
        total: 0
    },
    currentPage: 1,
    timeFilter: 'today',
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    loadMoreStatus: 'idle' // 'idle' | 'loading' | 'succeeded' | 'failed'
};

export const getLeaderboardData = createAsyncThunk(
    'leaderboard/fetchLeaderboardData',
    async ({timeFilter, page = 1}, {rejectWithValue}) => {
        try {
            const response = await api.get('/api/leaderboard', {
                params: {timeFilter, page}
            });

            if (response.data.success) {
                return {...response.data, page};
            } else {
                return rejectWithValue('Error');
            }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Network error, please try again'
            );
        }
    }
);

const leaderboardsSlice = createSlice({
    name: 'leaderboards',
    initialState,
    extraReducers: builder => {
        builder
            .addCase(getLeaderboardData.pending, (state, action) => {
                const page = action.meta.arg.page || 1;
                if (page === 1) {
                    state.fetchStatus = 'loading';
                } else {
                    state.loadMoreStatus = 'loading';
                }
            })
            .addCase(getLeaderboardData.fulfilled, (state, action) => {
                const page = action.payload.page;
                const users = action.payload.users || [];

                if (page === 1) {
                    state.paginated.users = users;
                } else {
                    const existingIds = new Set(
                        state.paginated.users.map(u => u.id)
                    );
                    const newUsers = users.filter(
                        u => !existingIds.has(u.id)
                    );
                    state.paginated.users.push(...newUsers);
                }

                state.paginated.hasNextPage =
                    action.payload.hasNextPage || false;
                state.paginated.total = action.payload.total || 0;
                state.currentPage = page;
                state.timeFilter = action.meta.arg.timeFilter;
                state.fetchStatus = 'succeeded';
                state.loadMoreStatus = 'idle';
            })
            .addCase(getLeaderboardData.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.loadMoreStatus = 'idle';
            })
            .addCase(logout, () => initialState);
    }
});

export default leaderboardsSlice.reducer;
