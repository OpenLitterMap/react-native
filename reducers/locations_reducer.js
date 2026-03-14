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
                state.error = action.payload;
            })
            .addCase(fetchLocationChildren.pending, state => {
                state.childrenStatus = 'loading';
            })
            .addCase(fetchLocationChildren.fulfilled, (state, action) => {
                state.childrenStatus = 'succeeded';
                state.children = action.payload.locations;
                state.locationStack.push(action.payload.parent);
            })
            .addCase(fetchLocationChildren.rejected, state => {
                state.childrenStatus = 'failed';
            })
            .addCase(logout, () => initialState);
    }
});

export const {goBackLocation} = locationsSlice.actions;

export default locationsSlice.reducer;
