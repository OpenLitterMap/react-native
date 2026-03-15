import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    countries: [],
    countriesStatus: 'idle',
    error: null,
    children: [],
    childrenStatus: 'idle',
    locationStack: []
};

export const fetchCountries = createAsyncThunk(
    'locations/fetchCountries',
    async (_, {rejectWithValue}) => {
        try {
            const response = await api.get('/api/locations/country');
            return response.data?.locations || response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Network error, please try again'
            );
        }
    }
);

export const fetchLocationChildren = createAsyncThunk(
    'locations/fetchLocationChildren',
    async ({type, id, name}, {rejectWithValue}) => {
        try {
            const response = await api.get(`/api/locations/${type}/${id}`);
            return {
                locations: response.data?.locations || [],
                parent: {name, type, id}
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Network error, please try again'
            );
        }
    }
);

const locationsSlice = createSlice({
    name: 'locations',
    initialState,
    reducers: {
        goBackLocation(state) {
            state.locationStack.pop();
            // Restore the previous level's cached data, or clear if back to root
            const prev = state.locationStack[state.locationStack.length - 1];
            if (prev?.children) {
                state.children = prev.children;
                state.childrenStatus = 'succeeded';
            } else {
                state.children = [];
                state.childrenStatus = 'idle';
            }
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchCountries.pending, state => {
                state.countriesStatus = 'loading';
            })
            .addCase(fetchCountries.fulfilled, (state, action) => {
                state.countriesStatus = 'succeeded';
                state.countries = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchCountries.rejected, (state, action) => {
                state.countriesStatus = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchLocationChildren.pending, state => {
                state.childrenStatus = 'loading';
            })
            .addCase(fetchLocationChildren.fulfilled, (state, action) => {
                state.childrenStatus = 'succeeded';
                state.children = action.payload.locations;
                // Cache the current children in the stack entry so back navigation can restore them
                state.locationStack.push({
                    ...action.payload.parent,
                    children: action.payload.locations
                });
            })
            .addCase(fetchLocationChildren.rejected, state => {
                state.childrenStatus = 'failed';
            })
            .addCase(logout, () => initialState);
    }
});

export const {goBackLocation} = locationsSlice.actions;

export default locationsSlice.reducer;
