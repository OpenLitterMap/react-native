import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {classifyError} from '../utils/classifyError';
import {logout} from './auth_reducer';
import {loadPhotoForEditing} from './photos_reducer';

const initialState = {
    // Server-side untagged photo count (null = not fetched yet)
    untaggedCount: null,
    // Preview of next untagged photo (for HomeScreen badge tile)
    untaggedPreview: null
};

/**
 * Fetch untagged count + one preview photo for the HomeScreen badge.
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
                    params: {tagged: false, per_page: 1}
                })
            ]);

            // Stats is required; preview is best-effort
            if (statsResult.status === 'rejected') {
                return rejectWithValue(
                    statsResult.reason?.response?.data?.message || 'Network Error'
                );
            }

            return {
                count: statsResult.value.data?.leftToTag ?? 0,
                preview: previewResult.status === 'fulfilled'
                    ? previewResult.value.data?.photos?.[0] ?? null
                    : null
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
                state.untaggedPreview = action.payload.preview;
            })
            .addCase(editTagsOnPhoto.fulfilled, (state, action) => {
                // Decrement untagged count (optimistic — photo was just tagged)
                if (state.untaggedCount > 0) {
                    state.untaggedCount--;
                }
            })
            .addCase(logout, () => initialState);
    }
});

export default serverPhotosSlice.reducer;
