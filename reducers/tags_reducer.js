import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/apiClient';
import {formatKey} from '../utils/formatKey';
import {logout} from './auth_reducer';
import i18n from '../i18n';

const CACHE_KEY = 'tags_cache_v5';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const initialState = {
    objectEntries: [], // One entry per (object, category) pair + type entries
    categoriesById: {}, // { id: { id, key, displayName } }
    entriesByCloId: {}, // { cloId: entry } for fast lookup (base entries only)
    typeEntriesByKey: {}, // { 'cloId-typeId': entry } for fast type entry lookup
    typesById: {}, // { id: { id, key, name } }
    materialsById: {}, // { id: { id, key, name } }
    brandsById: {}, // { id: { id, key, name } }
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    lastFetchedAt: null
};

/**
 * Load tags from cache or fetch from API.
 *
 * forceRefresh: true bypasses the cache TTL check.
 */
export const fetchAllTags = createAsyncThunk(
    'tags/fetchAll',
    async ({forceRefresh = false} = {}, {getState, rejectWithValue}) => {
        try {
            // Check cache first
            if (!forceRefresh) {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        const age = Date.now() - parsed.lastFetchedAt;
                        if (age < CACHE_TTL_MS) {
                            return parsed;
                        }
                    } catch {
                        await AsyncStorage.removeItem(CACHE_KEY);
                    }
                }
            }

            // Fetch from API (token optional for this endpoint)
            const token = getState().auth.token;
            const response = await api.get('/api/tags/all', {
                token: token || undefined
            });
            const data = response.data;

            // Build lookup maps
            const objectsById = {};
            for (const obj of data.objects) {
                objectsById[obj.id] = obj;
            }

            const categoriesLookup = {};
            for (const cat of data.categories) {
                categoriesLookup[cat.id] = cat;
            }

            // Count how many categories each object appears in
            const objectCategoryCount = {};
            for (const co of data.category_objects) {
                objectCategoryCount[co.litter_object_id] =
                    (objectCategoryCount[co.litter_object_id] || 0) + 1;
            }

            // Build search index from category_objects pivot table
            const objectEntries = [];
            for (const co of data.category_objects) {
                const obj = objectsById[co.litter_object_id];
                const cat = categoriesLookup[co.category_id];
                if (!obj || !cat) {
                    continue;
                }

                const litterKey = `litter.${cat.key}.${obj.key}`;
                const objectName = i18n.exists(litterKey)
                    ? i18n.t(litterKey)
                    : formatKey(obj.key);
                const catLitterKey = `litter.categories.${cat.key}`;
                const categoryName = i18n.exists(catLitterKey)
                    ? i18n.t(catLitterKey)
                    : formatKey(cat.key);
                const isMultiCategory = objectCategoryCount[obj.id] > 1;
                const objectText = obj.key.replace(/_/g, ' ').toLowerCase();
                const categoryText = cat.key.replace(/_/g, ' ').toLowerCase();

                objectEntries.push({
                    cloId: co.id,
                    objectId: obj.id,
                    objectKey: obj.key,
                    categoryId: cat.id,
                    categoryKey: cat.key,
                    displayName: objectName,
                    categoryDisplayName: categoryName,
                    isMultiCategory,
                    searchText: `${objectText} ${categoryText}`
                });
            }

            // Build entriesByCloId for fast lookup (base entries only)
            const entriesByCloId = {};
            for (const entry of objectEntries) {
                entriesByCloId[entry.cloId] = entry;
            }

            // Build type entries from category_object_types pivot table
            const typesById = {};
            if (data.types) {
                for (const t of data.types) {
                    typesById[t.id] = t;
                }
            }

            const typeEntriesByKey = {};

            if (data.category_object_types) {
                for (const cot of data.category_object_types) {
                    const parentEntry =
                        entriesByCloId[cot.category_litter_object_id];
                    const type = typesById[cot.litter_object_type_id];
                    if (!parentEntry || !type) {
                        continue;
                    }

                    const typeKey = `litter.types.${type.key}`;
                    const typeName = i18n.exists(typeKey)
                        ? i18n.t(typeKey)
                        : (type.name || formatKey(type.key));
                    const typeText = (type.name || type.key)
                        .replace(/_/g, ' ')
                        .toLowerCase();
                    const objectText = parentEntry.objectKey
                        .replace(/_/g, ' ')
                        .toLowerCase();
                    const categoryText = parentEntry.categoryKey
                        .replace(/_/g, ' ')
                        .toLowerCase();

                    const typeEntry = {
                        cloId: parentEntry.cloId,
                        objectId: parentEntry.objectId,
                        objectKey: parentEntry.objectKey,
                        categoryId: parentEntry.categoryId,
                        categoryKey: parentEntry.categoryKey,
                        displayName: `${typeName} ${parentEntry.displayName}`,
                        categoryDisplayName: parentEntry.categoryDisplayName,
                        isMultiCategory: parentEntry.isMultiCategory,
                        isType: true,
                        typeId: type.id,
                        typeName,
                        parentDisplayName: parentEntry.displayName,
                        searchText: `${typeText} ${objectText} ${categoryText}`
                    };

                    objectEntries.push(typeEntry);
                    typeEntriesByKey[`${parentEntry.cloId}-${type.id}`] =
                        typeEntry;
                }
            }

            // Build categoriesById for display
            const categoriesById = {};
            for (const cat of data.categories) {
                const catKey = `litter.categories.${cat.key}`;
                categoriesById[cat.id] = {
                    id: cat.id,
                    key: cat.key,
                    displayName: i18n.exists(catKey)
                        ? i18n.t(catKey)
                        : formatKey(cat.key)
                };
            }

            // Build materialsById from data.materials
            const materialsById = {};
            if (data.materials) {
                for (const m of data.materials) {
                    const mKey = `litter.materials.${m.key}`;
                    materialsById[m.id] = {
                        id: m.id,
                        key: m.key,
                        name: i18n.exists(mKey)
                            ? i18n.t(mKey)
                            : formatKey(m.key)
                    };
                }
            }

            // Build brandsById from data.brands
            const brandsById = {};
            if (data.brands) {
                for (const b of data.brands) {
                    brandsById[b.id] = {
                        id: b.id,
                        key: b.key,
                        name: formatKey(b.key)
                    };
                }
            }

            if (__DEV__) {
                const bottleMatches = objectEntries.filter(e =>
                    e.searchText.includes('bottle')
                );
                const typeCount = objectEntries.filter(e => e.isType).length;
                console.log(
                    `[Tags] Loaded ${
                        objectEntries.length
                    } entries (${typeCount} types), ${
                        Object.keys(categoriesById).length
                    } categories. "bottle" matches: ${bottleMatches.length}`
                );
                bottleMatches.forEach(e =>
                    console.log(
                        `  → ${e.displayName} (${
                            e.categoryDisplayName
                        }) [cloId=${e.cloId}]${e.isType ? ' [type]' : ''}`
                    )
                );
            }

            const result = {
                objectEntries,
                categoriesById,
                entriesByCloId,
                typeEntriesByKey,
                typesById,
                materialsById,
                brandsById,
                lastFetchedAt: Date.now()
            };

            // Persist to cache
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));

            return result;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch tags'
            );
        }
    },
    {
        condition: ({forceRefresh = false} = {}, {getState}) => {
            if (forceRefresh) return true;
            const {objectEntries, lastFetchedAt} = getState().tags;
            if (objectEntries.length > 0 && lastFetchedAt) {
                return Date.now() - lastFetchedAt >= CACHE_TTL_MS;
            }
            return true;
        }
    }
);

const tagsSlice = createSlice({
    name: 'tags',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAllTags.pending, state => {
                state.fetchStatus = 'loading';
            })
            .addCase(fetchAllTags.fulfilled, (state, action) => {
                state.objectEntries = action.payload.objectEntries;
                state.categoriesById = action.payload.categoriesById;
                state.entriesByCloId = action.payload.entriesByCloId;
                state.typeEntriesByKey = action.payload.typeEntriesByKey || {};
                state.typesById = action.payload.typesById || {};
                state.materialsById = action.payload.materialsById || {};
                state.brandsById = action.payload.brandsById || {};
                state.lastFetchedAt = action.payload.lastFetchedAt;
                state.fetchStatus = 'succeeded';
            })
            .addCase(fetchAllTags.rejected, state => {
                state.fetchStatus = 'failed';
            })
            .addCase(logout, () => initialState);
    }
});

export default tagsSlice.reducer;
