import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {classifyError} from '../utils/classifyError';
import {logout} from './auth_reducer';
import {loadPhotoForEditing} from './photos_reducer';

const initialState = {
    // Server-side untagged photo count (null = not fetched yet)
    untaggedCount: null,
    // Preview photos for the untagged section (up to 10)
    untaggedPreviews: []
};

/**
 * Fetch untagged count + preview photos for the HomeScreen dashboard.
 * Two lightweight calls instead of downloading all untagged photos.
 */
export const fetchUntaggedCount = createAsyncThunk(
    'serverPhotos/fetchUntaggedCount',
    async (_, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const [statsResult, previewResult] = await Promise.allSettled([
                api.get('/api/v3/user/photos/stats', {token}),
                api.get('/api/v3/user/photos', {
                    token,
                    params: {tagged: false, per_page: 10}
                })
            ]);

            // Stats is required; previews are best-effort
            if (statsResult.status === 'rejected') {
                return rejectWithValue(
                    statsResult.reason?.response?.data?.message || 'Network Error'
                );
            }

            return {
                count: statsResult.value.data?.leftToTag ?? 0,
                previews: previewResult.status === 'fulfilled'
                    ? previewResult.value.data?.photos ?? []
                    : []
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network Error'
            );
        }
    }
);

/**
 * Fetch untagged photos for the editing queue.
 * Returns array of photo objects.
 */
export const fetchNextUntaggedPhoto = createAsyncThunk(
    'serverPhotos/fetchNextUntaggedPhoto',
    async ({perPage = 2} = {}, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get('/api/v3/user/photos', {
                token,
                params: {tagged: false, per_page: perPage}
            });

            const photos = response.data?.photos;
            if (!photos || photos.length === 0) {
                return rejectWithValue('No untagged photos found');
            }

            return photos;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network Error'
            );
        }
    }
);

/**
 * Fetch untagged photos and load them into the editing queue.
 * Composes fetchNextUntaggedPhoto + loadPhotoForEditing to avoid
 * repeating this pattern in every UI component.
 */
export const fetchAndLoadUntagged = createAsyncThunk(
    'serverPhotos/fetchAndLoadUntagged',
    async ({perPage = 5} = {}, {dispatch}) => {
        const result = await dispatch(fetchNextUntaggedPhoto({perPage}));
        if (result.meta?.requestStatus === 'fulfilled') {
            dispatch(loadPhotoForEditing({photos: result.payload}));
        }
        return result;
    }
);

/**
 * Fetch ALL untagged photo metadata across all pages.
 * Photo metadata is lightweight (~300 bytes each) so loading everything
 * upfront enables smooth swiping through the full queue.
 * Uses per_page=50 and paginates through all pages via Promise.all.
 */
export const fetchAllUntaggedPhotos = createAsyncThunk(
    'serverPhotos/fetchAllUntaggedPhotos',
    async (_, {getState, dispatch, rejectWithValue}) => {
        try {
            const token = getState().auth.token;

            // Fetch first page to get pagination info
            const firstPage = await api.get('/api/v3/user/photos', {
                token,
                params: {tagged: false, per_page: 50, page: 1}
            });

            const firstPhotos = firstPage.data?.photos ?? [];
            const pagination = firstPage.data?.pagination;

            if (firstPhotos.length === 0) {
                return rejectWithValue('No untagged photos found');
            }

            let allPhotos = [...firstPhotos];

            // Fetch remaining pages in parallel
            if (pagination?.last_page > 1) {
                const pagePromises = [];
                for (let page = 2; page <= pagination.last_page; page++) {
                    pagePromises.push(
                        api.get('/api/v3/user/photos', {
                            token,
                            params: {tagged: false, per_page: 50, page}
                        }).then(res => res.data?.photos ?? [])
                            .catch(() => [])
                    );
                }
                const pageResults = await Promise.all(pagePromises);
                for (const photos of pageResults) {
                    allPhotos = allPhotos.concat(photos);
                }
            }

            // Load all into the editing queue
            dispatch(loadPhotoForEditing({photos: allPhotos}));
            return {total: allPhotos.length};
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network Error'
            );
        }
    }
);

/**
 * Replace ALL tags on a photo using PUT /api/v3/tags (full replace, not merge).
 * The backend deletes existing tags, resets XP, then adds the new set atomically.
 * Send the COMPLETE set of tags — not just changes.
 */
export const editTagsOnPhoto = createAsyncThunk(
    'serverPhotos/editTagsOnPhoto',
    async ({photoId, tags}, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.put('/api/v3/tags', {
                token,
                data: {
                    photo_id: photoId,
                    tags
                }
            });

            return {photoId, photoTags: response.data.photoTags};
        } catch (error) {
            return rejectWithValue(classifyError(error, 'edit_tags_v3'));
        }
    }
);

const serverPhotosSlice = createSlice({
    name: 'serverPhotos',
    initialState,
    extraReducers: builder => {
        builder
            .addCase(fetchUntaggedCount.fulfilled, (state, action) => {
                state.untaggedCount = action.payload.count;
                state.untaggedPreviews = action.payload.previews;
            })
            .addCase(editTagsOnPhoto.fulfilled, (state, action) => {
                // Decrement untagged count and remove from previews (optimistic)
                if (state.untaggedCount > 0) {
                    state.untaggedCount--;
                }
                const taggedId = action.payload.photoId;
                state.untaggedPreviews = state.untaggedPreviews.filter(
                    p => p.id !== taggedId
                );
            })
            .addCase(logout, () => initialState)
            // addMatcher must come after all addCase calls (RTK requirement)
            .addMatcher(
                action => action.type === 'uploads/deleteUploadPhoto/fulfilled',
                (state, action) => {
                    const deletedId = action.payload;
                    if (state.untaggedCount > 0) {
                        state.untaggedCount--;
                    }
                    state.untaggedPreviews = state.untaggedPreviews.filter(
                        p => p.id !== deletedId
                    );
                }
            );
    }
});

export default serverPhotosSlice.reducer;
