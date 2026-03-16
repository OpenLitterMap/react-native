import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {getTagsFromBackend} from '../utils/getTagsFromBackend';
import {classifyError} from '../utils/classifyError';
import {logout} from './auth_reducer';

const initialState = {
    // Server-side untagged photo count (null = not fetched yet)
    untaggedCount: null,
    // Preview of next untagged photo (for HomeScreen badge tile)
    untaggedPreview: null,
    // Photo loaded for editing from My Uploads or untagged queue
    editingPhoto: null
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
    async (_, {getState, dispatch, rejectWithValue}) => {
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

            dispatch(loadPhotoForEditing({photo}));
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
    reducers: {
        /**
         * Load an existing API photo for tag editing.
         * Converts API new_tags format to local tags format.
         * payload = { photo } where photo is the API photo object
         */
        loadPhotoForEditing(state, action) {
            const photo = action.payload.photo;

            const {tags, imageCustomTags} = getTagsFromBackend(photo.new_tags);

            state.editingPhoto = {
                id: photo.id,
                photoId: photo.id,
                date: photo.datetime ?? null,
                lat: photo.lat ?? null,
                lon: photo.lon ?? null,
                filename: photo.filename,
                uri: null,
                type: 'web',
                platform: photo.platform ?? 'web',

                tags,
                customTags: imageCustomTags,
                picked_up: !!photo.picked_up,

                selected: false,
                uploaded: true,
                editing: true
            };
        },

        clearEditingPhoto(state) {
            state.editingPhoto = null;
        }
    },

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

export const {loadPhotoForEditing, clearEditingPhoto} = serverPhotosSlice.actions;

export default serverPhotosSlice.reducer;
