import axios from "axios";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { URL } from  '../actions/types';

const initialState = {
    uploads: [],
    loading: false,
    error: null
};

export const fetchUploads = createAsyncThunk(
    'myUploads/fetchUploads',
    async ({
       token,
       page = 1,
       paginationAmount,
       filterCountry,
       filterDateFrom,
       filterDateTo,
       filterTag,
       filterCustomTag,
       append = false
    }, { rejectWithValue }
    ) => {
        try {
            const response = await axios({
                method: 'GET',
                url: `${URL}/history/paginated`,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    loadPage: page,
                    paginationAmount,
                    filterCountry,
                    filterTag,
                    filterCustomTag,
                    filterDateFrom,
                    filterDateTo
                }
            });

            // if (response.data.photos.data?.length > 5) {
            //     console.log('response', response.data.photos.data[0]);
            // }

            return { data: response.data.photos, append };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load uploads');
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
                        data: [...state.uploads.data, ...newData],
                        total: action.payload.data.total,
                        per_page: action.payload.data.per_page,
                        current_page: action.payload.data.current_page,
                        last_page: action.payload.data.last_page,
                        next_page_url: action.payload.data.next_page_url,
                        prev_page_url: action.payload.data.prev_page_url,
                        from: action.payload.data.from,
                        to: action.payload.data.to
                    };
                } else {
                    state.uploads = action.payload.data;
                }
            })
            .addCase(fetchUploads.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearUploads } = myUploadsSlice.actions;
export default myUploadsSlice.reducer;
