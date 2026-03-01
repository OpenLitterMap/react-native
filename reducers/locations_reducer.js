import axios from 'axios';
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {URL} from '../actions/types';
import {logout} from './auth_reducer';

const initialState = {
    countries: [],
    countriesStatus: 'idle',
    countriesError: null,
    children: [],
    childrenStatus: 'idle',
    // Stack of {name, type, id} for breadcrumb navigation
    locationStack: []
};

export const fetchCountries = createAsyncThunk(
    'locations/fetchCountries',
    async (_, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${URL}/api/locations/country`, {
                headers: {Accept: 'application/json'}
            });
            return response.data?.locations || response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network error, please try again'
            );
        }
    }
);

export const fetchLocationChildren = createAsyncThunk(
    'locations/fetchLocationChildren',
    async ({type, id, name}, {rejectWithValue}) => {
        try {
            const response = await axios.get(
                `${URL}/api/locations/${type}/${id}`,
                {headers: {Accept: 'application/json'}}
            );
            return {
                locations: response.data?.locations || [],
                parent: {name, type, id}
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network error, please try again'
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
            state.children = [];
            state.childrenStatus = 'idle';
        },
        resetLocationNav(state) {
            state.locationStack = [];
            state.children = [];
            state.childrenStatus = 'idle';
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchCountries.pending, state => {
                state.countriesStatus = 'loading';
            })
            .addCase(fetchCountries.fulfilled, (state, action) => {
                state.countriesStatus = 'succeeded';
                state.countries = action.payload;
            })
            .addCase(fetchCountries.rejected, (state, action) => {
                state.countriesStatus = 'failed';
                state.countriesError = action.payload;
            })
            .addCase(fetchLocationChildren.pending, state => {
                state.childrenStatus = 'loading';
            })
            .addCase(fetchLocationChildren.fulfilled, (state, action) => {
                state.childrenStatus = 'succeeded';
                state.children = action.payload.locations;
                state.locationStack.push(action.payload.parent);
            })
            .addCase(fetchLocationChildren.rejected, (state, action) => {
                state.childrenStatus = 'failed';
            })
            .addCase(logout, () => initialState);
    }
});

export const {goBackLocation, resetLocationNav} = locationsSlice.actions;

export default locationsSlice.reducer;
