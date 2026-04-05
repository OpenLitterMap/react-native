import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../utils/apiClient';
import {logout} from './auth_reducer';

const MAX_PRESETS = 30;

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Map a backend tag object to the local preset shape.
 * Backend uses snake_case clo_id/type_id; local uses camelCase cloId/typeId.
 */
function backendToLocal(tag) {
    return {
        id: String(tag.id),
        cloId: tag.clo_id,
        typeId: tag.type_id ?? null,
        name: tag.name ?? null,
        customName: tag.custom_name ?? null,
        quantity: tag.quantity ?? 1,
        picked_up: tag.picked_up ?? null,
        materials: tag.materials ?? [],
        brands: tag.brands ?? []
    };
}

/**
 * Map a local preset to the backend payload shape.
 */
function localToBackend(preset) {
    return {
        clo_id: preset.cloId,
        type_id: preset.typeId ?? null,
        name: preset.name ?? null,
        custom_name: preset.customName ?? null,
        quantity: preset.quantity ?? 1,
        picked_up: preset.picked_up ?? null,
        materials: preset.materials ?? [],
        brands: preset.brands ?? []
    };
}

// --- Async thunks ---

/**
 * Fetch quick tags from backend. Called after login/token validation.
 * If backend has tags, they replace local state (backend is source of truth).
 */
export const fetchQuickTags = createAsyncThunk(
    'quickTags/fetch',
    async (tokenOverride, {getState, rejectWithValue}) => {
        const token = tokenOverride ?? getState().auth.token;
        if (!token) return rejectWithValue('No token');
        try {
            const response = await api.get('/api/v3/user/quick-tags', {token});
            return response.data.tags.map(backendToLocal);
        } catch (error) {
            if (__DEV__) console.log('[QuickTags] fetch failed:', error.message);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * Push local presets to backend. Called on local changes (debounced).
 * Backend bulk-replaces all rows in a transaction.
 */
export const syncQuickTags = createAsyncThunk(
    'quickTags/sync',
    async (_, {getState, rejectWithValue}) => {
        const token = getState().auth.token;
        if (!token) return rejectWithValue('No token');
        const presets = getState().quickTags.presets;
        const payload = presets.map(localToBackend);
        try {
            const response = await api.put('/api/v3/user/quick-tags', {
                token,
                data: {tags: payload}
            });
            return response.data.tags.map(backendToLocal);
        } catch (error) {
            if (__DEV__) console.log('[QuickTags] sync failed:', error.message);
            return rejectWithValue(error.message);
        }
    }
);

// --- Slice ---

const initialState = {
    presets: [],
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    syncStatus: 'idle',  // 'idle' | 'syncing' | 'succeeded' | 'failed'
    locallyEdited: false, // true if user made edits since last fetch started
    schemaVersion: 1
};

const quickTagsSlice = createSlice({
    name: 'quickTags',
    initialState,
    reducers: {
        addQuickTag(state, action) {
            const {cloId, typeId = null, name = null, quantity = 1, picked_up = null, materials = [], brands = []} = action.payload;
            if (state.presets.length >= MAX_PRESETS) return;

            // Check for duplicate cloId+typeId — update metadata if exists
            const existing = state.presets.find(
                p => p.cloId === cloId && (p.typeId ?? null) === (typeId ?? null)
            );
            if (existing) {
                existing.quantity = quantity;
                existing.picked_up = picked_up;
                existing.materials = [...materials];
                existing.brands = brands.map(b => ({...b}));
                return;
            }

            state.presets.unshift({
                id: generateId(),
                cloId,
                typeId,
                name,
                customName: null,
                quantity,
                picked_up,
                materials: [...materials],
                brands: brands.map(b => ({...b}))
            });
            state.locallyEdited = true;
        },
        removeQuickTag(state, action) {
            const {id} = action.payload;
            state.presets = state.presets.filter(p => p.id !== id);
            state.locallyEdited = true;
        },
        removeQuickTagByCloId(state, action) {
            const {cloId, typeId = null} = action.payload;
            state.presets = state.presets.filter(
                p => !(p.cloId === cloId && (p.typeId ?? null) === (typeId ?? null))
            );
            state.locallyEdited = true;
        },
        updateQuickTag(state, action) {
            const {id, changes} = action.payload;
            const preset = state.presets.find(p => p.id === id);
            if (!preset) return;
            if (changes.customName !== undefined) preset.customName = changes.customName;
            if (changes.quantity != null) preset.quantity = changes.quantity;
            if (changes.picked_up !== undefined) preset.picked_up = changes.picked_up;
            if (changes.materials != null) preset.materials = [...changes.materials];
            if (changes.brands != null) preset.brands = changes.brands.map(b => ({...b}));
            state.locallyEdited = true;
        },
        reorderQuickTags(state, action) {
            const {orderedIds} = action.payload;
            const byId = {};
            for (const preset of state.presets) {
                byId[preset.id] = preset;
            }
            const reordered = [];
            for (const id of orderedIds) {
                if (byId[id]) reordered.push(byId[id]);
            }
            // Append any presets not in orderedIds (safety)
            for (const preset of state.presets) {
                if (!orderedIds.includes(preset.id)) reordered.push(preset);
            }
            state.presets = reordered;
            state.locallyEdited = true;
        },
        setPresets(state, action) {
            state.presets = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuickTags.pending, (state) => {
                state.fetchStatus = 'loading';
                state.locallyEdited = false;
            })
            .addCase(fetchQuickTags.fulfilled, (state, action) => {
                state.fetchStatus = 'succeeded';
                // Backend is source of truth — replace unless user made local edits
                // while the fetch was in flight. In that case, keep local edits and
                // let the debounced sync push them to the server.
                if (!state.locallyEdited) {
                    state.presets = action.payload;
                }
            })
            .addCase(fetchQuickTags.rejected, (state) => {
                state.fetchStatus = 'failed';
            })
            .addCase(syncQuickTags.pending, (state) => {
                state.syncStatus = 'syncing';
            })
            .addCase(syncQuickTags.fulfilled, (state) => {
                state.syncStatus = 'succeeded';
                // Local state is already correct — the PUT succeeded with our data.
                // Don't replace presets with the server response to avoid triggering
                // the sync watcher again (new reference → useEffect → another sync).
                // Server IDs are only authoritative on fetchQuickTags (login).
            })
            .addCase(syncQuickTags.rejected, (state) => {
                state.syncStatus = 'failed';
            })
            .addCase(logout, () => initialState);
    }
});

export const {
    addQuickTag,
    removeQuickTag,
    removeQuickTagByCloId,
    updateQuickTag,
    reorderQuickTags,
    setPresets
} = quickTagsSlice.actions;

export default quickTagsSlice.reducer;
