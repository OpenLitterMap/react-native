import {createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {classifyError} from '../utils/classifyError';
import isServerPhotoId from '../utils/isServerPhotoId';
import {logout} from './auth_reducer';

const initialState = {
    // Upload progress counters
    totalToUpload: 0,
    uploaded: 0,
    uploadFailed: 0,
    tagged: 0,
    taggedFailed: 0,

    // Upload phase tracking
    uploadPhase: 'idle', // 'idle' | 'uploading' | 'tagging'
    currentUploadIndex: 0,
    uploadAbortReason: null, // null | 'token-expired' | 'cancelled'

    failedCounts: {
        alreadyUploaded: 0,
        invalidCoordinates: 0,
        timeout: 0,
        network: 0,
        server: 0,
        unknown: 0
    },

    // Modal state (moved from shared_reducer)
    showUploadModal: false,
    showThankYouMessages: false
};

/**
 * Upload a photo binary to the server.
 * Returns serverPhotoId on success for subsequent tag posting.
 */
export const uploadImage = createAsyncThunk(
    'uploadFlow/uploadImage',
    async (
        {
            imageData,
            photoId,
            imageUri,
            enableAdminTagging,
            photoHasTags,
            signal
        },
        {getState, rejectWithValue}
    ) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/v3/upload', {
                token,
                data: imageData,
                headers: {'Content-Type': 'multipart/form-data'},
                signal
            });

            if (!response.data?.success) {
                return rejectWithValue({
                    errorType: 'unknown',
                    userMessage: 'Upload failed with no success flag'
                });
            }

            return {
                photoId,
                imageUri,
                serverPhotoId: response.data.photo_id,
                // Idempotent-upload fields (see readme/upload-spec.md). Absent on
                // pre-idempotent backends → default false. Plumbed now; the tag
                // write that consumes them lands once spec Q1 is answered.
                alreadyUploaded: response.data.already_uploaded ?? false,
                tagged: response.data.tagged ?? false,
                enableAdminTagging,
                photoHasTags
            };
        } catch (error) {
            return rejectWithValue(classifyError(error, 'image_upload'));
        }
    }
);

/**
 * Write tags to a photo using the v3 API.
 *
 * Uses PUT (replace), not POST (append): POST /tags appends rows and double-counts
 * XP for ordinary users on a repeated call, so a lost-response retry would inflate
 * the photo. PUT deletes-then-readds and converges, making the upload loop's
 * re-runs idempotent. Safe on a brand-new photo too (replaces an empty tag set).
 * See readme/upload-spec.md.
 */
export const addTagsToPhoto = createAsyncThunk(
    'uploadFlow/addTagsToPhoto',
    async ({photoId, tags, signal}, {getState, rejectWithValue}) => {
        // Only a real server photo id can be tagged. A local id (camera-roll
        // counter or "onboarding_..." string) would 422 server-side and retry
        // forever. Fail locally without hitting the network or Sentry.
        if (!isServerPhotoId(photoId)) {
            return rejectWithValue({
                errorType: 'invalid-photo-id',
                userMessage: 'This photo is not ready to be tagged yet.'
            });
        }

        try {
            const token = getState().auth.token;
            await api.put('/api/v3/tags', {
                token,
                data: {
                    photo_id: photoId,
                    tags
                },
                signal
            });

            return {photoId};
        } catch (error) {
            return rejectWithValue({
                ...classifyError(error, 'put_tags_v3'),
                status: error?.response?.status ?? null
            });
        }
    }
);

const uploadFlowSlice = createSlice({
    name: 'uploadFlow',
    initialState,
    reducers: {
        resetUploadState(state) {
            state.totalToUpload = 0;
            state.uploaded = 0;
            state.uploadFailed = 0;
            state.tagged = 0;
            state.taggedFailed = 0;
            state.uploadPhase = 'idle';
            state.currentUploadIndex = 0;
            state.uploadAbortReason = null;
            state.failedCounts = {
                alreadyUploaded: 0,
                invalidCoordinates: 0,
                timeout: 0,
                network: 0,
                server: 0,
                unknown: 0
            };
        },

        setUploadPhase(state, action) {
            state.uploadPhase = action.payload;
        },

        setCurrentUploadIndex(state, action) {
            state.currentUploadIndex = action.payload;
        },

        setTotalToUpload(state, action) {
            state.totalToUpload = action.payload;
        },

        setUploadAbortReason(state, action) {
            state.uploadAbortReason = action.payload;
        },

        // Modal actions (moved from shared_reducer)
        cancelUpload(state) {
            state.showUploadModal = false;
        },

        closeThankYouMessages(state) {
            state.showUploadModal = false;
            state.showThankYouMessages = false;
        },

        resetThankYouMessages(state) {
            state.showThankYouMessages = false;
        },

        showThankYouMessagesAfterUpload(state) {
            state.uploadPhase = 'idle';
            state.showThankYouMessages = true;
        },

        startUploading(state) {
            state.showUploadModal = true;
        }
    },

    extraReducers: builder => {
        builder
            .addCase(uploadImage.fulfilled, (state) => {
                state.uploaded++;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                const {errorType} = action.payload || {errorType: 'unknown'};

                // Don't count user cancellation as a failure
                if (errorType === 'cancelled') return;

                // "Already uploaded" = server has the photo, treat as success
                if (errorType === 'photo-already-uploaded') {
                    state.uploaded++;
                    state.failedCounts.alreadyUploaded++;
                    return;
                }

                state.uploadFailed += 1;

                switch (errorType) {
                case 'invalid-coordinates':
                    state.failedCounts.invalidCoordinates += 1;
                    break;
                case 'timeout':
                    state.failedCounts.timeout += 1;
                    break;
                case 'network':
                    state.failedCounts.network += 1;
                    break;
                case 'server':
                    state.failedCounts.server += 1;
                    break;
                default:
                    state.failedCounts.unknown += 1;
                }
            })

            .addCase(addTagsToPhoto.fulfilled, (state) => {
                state.tagged++;
            })
            .addCase(addTagsToPhoto.rejected, (state, action) => {
                const errorType = action.payload?.errorType || 'unknown';

                // Don't count user cancellation as a failure
                if (errorType === 'cancelled') return;

                state.taggedFailed++;

                switch (errorType) {
                case 'timeout':
                    state.failedCounts.timeout += 1;
                    break;
                case 'network':
                    state.failedCounts.network += 1;
                    break;
                case 'server':
                    state.failedCounts.server += 1;
                    break;
                default:
                    state.failedCounts.unknown += 1;
                }
            })

            .addCase(logout, () => initialState);
    }
});

export const {
    cancelUpload,
    closeThankYouMessages,
    resetThankYouMessages,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    showThankYouMessagesAfterUpload,
    startUploading
} = uploadFlowSlice.actions;

// Memoized selector — prevents HomeScreen re-renders when unrelated state changes
export const selectUploadFlow = createSelector(
    state => state.uploadFlow,
    uf => ({
        showUploadModal: uf.showUploadModal,
        showThankYouMessages: uf.showThankYouMessages,
        uploadPhase: uf.uploadPhase,
        currentUploadIndex: uf.currentUploadIndex,
        uploadAbortReason: uf.uploadAbortReason,
        totalToUpload: uf.totalToUpload,
        uploaded: uf.uploaded,
        uploadFailed: uf.uploadFailed,
        tagged: uf.tagged,
        taggedFailed: uf.taggedFailed,
        failedCounts: uf.failedCounts
    })
);

export default uploadFlowSlice.reducer;
