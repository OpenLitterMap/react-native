import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const initialState = {
    uploads: { data: [] },
    userLocations: null, // Cached hierarchical location tree
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
};

export const fetchUploads = createAsyncThunk(
    'uploads/fetchUploads',
    async ({
       page = 1,
       filters = {},
       append = false
    }, { getState, rejectWithValue }
    ) => {
        try {
            const params = { page };

            if (filters.filterTag) params.tag = filters.filterTag;
            if (filters.filterCustomTag) {
                params.custom_tag = filters.filterCustomTag;
            }
            if (filters.filterDateFrom) {
                params.date_from =
                    filters.filterDateFrom instanceof Date
                        ? filters.filterDateFrom
                              .toISOString()
                              .split('T')[0]
                        : filters.filterDateFrom;
            }
            if (filters.filterDateTo) {
                params.date_to =
                    filters.filterDateTo instanceof Date
                        ? filters.filterDateTo
                              .toISOString()
                              .split('T')[0]
                        : filters.filterDateTo;
            }
            if (filters.filterCountry) {
                params.country = filters.filterCountry;
            }
            if (filters.filterState) params.state = filters.filterState;
            if (filters.filterCity) params.city = filters.filterCity;
            if (
                filters.filterVerified !== '' &&
                filters.filterVerified !== undefined
            ) {
                params.verified = filters.filterVerified;
            }
            if (
                filters.filterPickedUp !== '' &&
                filters.filterPickedUp !== undefined
            ) {
                params.picked_up =
                    filters.filterPickedUp === '1' ? 'true' : 'false';
            }

            const token = getState().auth.token;
            const response = await api.get('/api/v3/user/photos', {
                token,
                params
            });

            const photos = response.data.photos || [];
            const pagination = response.data.pagination || {};

            const data = {
                data: photos,
                total: pagination.total || 0,
                per_page: pagination.per_page || 8,
                current_page: pagination.current_page || 1,
                last_page: pagination.last_page || 1,
                next_page_url: (pagination.current_page || 1) < (pagination.last_page || 1)
                    ? 'has-next'
                    : null
            };

            return { data, append };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load uploads');
        }
    }
);

export const fetchUserLocations = createAsyncThunk(
    'uploads/fetchUserLocations',
    async (_, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get(
                '/api/v3/user/photos/locations',
                {token}
            );

            return response.data.locations || [];
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Failed to load locations'
            );
        }
    }
);

export const deleteUploadPhoto = createAsyncThunk(
    'uploads/deleteUploadPhoto',
    async ({ photoId }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            await api.post('/api/profile/photos/delete', {
                token,
                data: {photoid: photoId}
            });

            return photoId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete photo'
            );
        }
    }
);

const uploadsSlice = createSlice({

    name: 'uploads',

    initialState,

    reducers: {
        clearUploads: (state) => {
            state.uploads = { data: [] };
        }
    },

    extraReducers: (builder) => {

        builder

            .addCase(fetchUploads.pending, (state) => {
                state.fetchStatus = 'loading';
                state.error = null;
            })
            .addCase(fetchUploads.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                state.error = null;

                if (action.payload.append) {
                    const existingIds = new Set(state.uploads.data.map(item => item.id));
                    const newData = action.payload.data.data.filter(item => !existingIds.has(item.id));

                    state.uploads = {
                        ...action.payload.data,
                        data: [...state.uploads.data, ...newData]
                    };
                } else {
                    state.uploads = action.payload.data;
                }
            })
            .addCase(fetchUploads.rejected, (state, action) => {
                state.fetchStatus = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchUserLocations.fulfilled, (state, action) => {
                state.userLocations = action.payload;
            })
            .addCase(fetchUserLocations.rejected, (state) => {
                // Mark as empty array (not null) so we don't retry infinitely
                state.userLocations = [];
            })
            .addCase(deleteUploadPhoto.fulfilled, (state, action) => {
                const photoId = action.payload;
                if (state.uploads?.data) {
                    state.uploads.data = state.uploads.data.filter(
                        p => p.id !== photoId
                    );
                    if (state.uploads.total > 0) {
                        state.uploads.total -= 1;
                    }
                }
            })
            .addCase(deleteUploadPhoto.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(logout, () => initialState);
    }
});

export const { clearUploads } = uploadsSlice.actions;
export default uploadsSlice.reducer;
