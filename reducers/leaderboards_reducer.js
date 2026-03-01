import axios from 'axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { URL } from '../actions/types';
import { logout } from './auth_reducer';

const initialState = {
    paginated: {
        users: [],
        hasNextPage: false,
        total: 0
    },
    currentPage: 1,
    timeFilter: 'today',
    loading: false,
    loadingMore: false
};

export const getLeaderboardData = createAsyncThunk(
    'leaderboard/fetchLeaderboardData',
    async ({ timeFilter, page = 1 }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${URL}/api/leaderboard`, {
                params: { timeFilter, page },
                headers: {
                    Accept: 'application/json'
                }
            });

            if (response.data.success) {
                return { ...response.data, page };
            } else {
                return rejectWithValue("Error");
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Network error, please try again');
        }
    }
);

const leaderboardsSlice = createSlice({

    name: 'leaderboards',

    initialState,

    extraReducers: (builder) => {

        builder

            .addCase(getLeaderboardData.pending, (state, action) => {
                const page = action.meta.arg.page || 1;
                if (page === 1) {
                    state.loading = true;
                } else {
                    state.loadingMore = true;
                }
            })
            .addCase(getLeaderboardData.fulfilled, (state, action) => {
                const page = action.payload.page;
                const users = action.payload.users || [];

                if (page === 1) {
                    state.paginated.users = users;
                } else {
                    state.paginated.users.push(...users);
                }

                state.paginated.hasNextPage = action.payload.hasNextPage || false;
                state.paginated.total = action.payload.total || 0;
                state.currentPage = page;
                state.timeFilter = action.meta.arg.timeFilter;
                state.loading = false;
                state.loadingMore = false;
            })
            .addCase(getLeaderboardData.rejected, (state, action) => {
                state.loading = false;
                state.loadingMore = false;
            })
            .addCase(logout, () => initialState);
    }
});

export const { } = leaderboardsSlice.actions;

export default leaderboardsSlice.reducer;
