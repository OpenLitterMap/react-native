import axios from "axios";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { URL } from  '../actions/types';
import { logout } from './auth_reducer';

const initialState = {
    uploads: { data: [] },
    uploadStats: null,
    loading: false,
    error: null
};

export const fetchUploads = createAsyncThunk(
    'myUploads/fetchUploads',
    async ({
       token,
       page = 1,
       filterDateFrom,
       filterDateTo,
       filterTag,
       filterCustomTag,
       append = false
    }, { rejectWithValue }
    ) => {
        try {
            const params = { page };

            if (filterTag) params.tag = filterTag;
            if (filterCustomTag) params.custom_tag = filterCustomTag;
            if (filterDateFrom) {
                params.date_from = filterDateFrom instanceof Date
                    ? filterDateFrom.toISOString().split('T')[0]
                    : filterDateFrom;
            }
            if (filterDateTo) {
                params.date_to = filterDateTo instanceof Date
                    ? filterDateTo.toISOString().split('T')[0]
                    : filterDateTo;
            }

            const response = await axios({
                method: 'GET',
                url: `${URL}/api/v3/user/photos`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                },
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

export const fetchUploadStats = createAsyncThunk(
    'myUploads/fetchUploadStats',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await axios({
                method: 'GET',
                url: `${URL}/api/v3/user/photos/stats`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load upload stats');
        }
    }
);

export const deleteUploadPhoto = createAsyncThunk(
    'myUploads/deleteUploadPhoto',
    async ({ token, photoId }, { rejectWithValue }) => {
        try {
            await axios({
                method: 'POST',
                url: `${URL}/api/profile/photos/delete`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: { photoId }
            });

            return photoId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete photo'
            );
        }
    }
);

const myUploadsSlice = createSlice({

    name: 'myUploads',

    initialState,

    reducers: {
        clearUploads: (state) => {
            state.uploads = { data: [] };
        }
    },

    extraReducers: (builder) => {

        builder

            .addCase(fetchUploads.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUploads.fulfilled, (state, action) => {
                state.loading = false;
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
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUploadStats.fulfilled, (state, action) => {
                state.uploadStats = action.payload;
            })
            .addCase(fetchUploadStats.rejected, (state, action) => {
                state.error = action.payload;
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

export const { clearUploads } = myUploadsSlice.actions;
export default myUploadsSlice.reducer;
