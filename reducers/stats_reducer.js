import axios from "axios";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { URL } from '../actions/types';

const initialState = {
    statsErrorMessage: null,
    totalTags: 0,
    totalImages: 0,
    totalUsers: 0,
    newUsersToday: 0,
    newUsersLast7Days: 0,
    newUsersLast30Days: 0
};

export const getStats = createAsyncThunk(
    'stats/getStats',
    async (_, { rejectWithValue }) => {
        try
        {
            const response = await axios({
                url: `${URL}/api/global/stats-data`,
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            return response.data;
        }
        catch (error)
        {
            return (error.response)
                ? rejectWithValue('Something went wrong, please try again')
                : rejectWithValue('Network Error, please try again');
        }
    }
);


const statsSlice = createSlice({

    name: 'stats',

    initialState,

    reducers: {},

    extraReducers: (builder) => {

        builder

            .addCase(getStats.pending, (state) => {
                state.statsErrorMessage = null;
            })
            .addCase(getStats.fulfilled, (state, action) => {
                const totalTags = action.payload?.total_tags || 0;
                const totalImages = action.payload?.total_images || 0;
                const totalUsers = action.payload?.total_users || 0;

                state.totalTags = totalTags;
                state.totalImages = totalImages;
                state.totalUsers = totalUsers;
                state.newUsersToday = action.payload?.new_users_today || 0;
                state.newUsersLast7Days = action.payload?.new_users_last_7_days || 0;
                state.newUsersLast30Days = action.payload?.new_users_last_30_days || 0;
                state.statsErrorMessage = null;
            })
            .addCase(getStats.rejected, (state, action) => {
                state.statsErrorMessage = action.payload;
            })
;
    }
});

export const {  } = statsSlice.actions;
export default statsSlice.reducer;
