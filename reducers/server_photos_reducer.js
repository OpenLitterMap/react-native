import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {classifyError} from '../utils/classifyError';
import {logout} from './auth_reducer';

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
            const [statsRes, previewRes] = await Promise.all([
                api.get('/api/v3/user/photos/stats', {token}),
                api.get('/api/v3/user/photos', {
                    token,
                    params: {tagged: false, per_page: 1}
                })
            ]);
            return {
                count: statsRes.data?.leftToTag ?? 0,
                preview: previewRes.data?.photos?.[0] ?? null
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Network Error'
            );
        }
    }
);

/**
 * Fetch one untagged photo and load it into editingPhoto for tagging.
 */
export const fetchNextUntaggedPhoto = createAsyncThunk(
    'serverPhotos/fetchNextUntaggedPhoto',
    async (_, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get('/api/v3/user/photos', {
                token,
                params: {tagged: false, per_page: 1}
            });

            const photo = response.data?.photos?.[0];
            if (!photo) {
                return rejectWithValue('No untagged photos found');
            }

            return photo;
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
