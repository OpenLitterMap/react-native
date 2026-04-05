import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootReducer } from '../reducers';
import { initialState as galleryInitialState } from '../reducers/gallery_reducer';

/**
 * Transform for the photos reducer: only persist imagesArray.
 * Upload counters, phase tracking, and error state start fresh on relaunch.
 */
const imagesTransform = createTransform(
    // On PERSIST: save only imagesArray
    (inboundState) => ({
        imagesArray: inboundState.imagesArray
    }),
    // On REHYDRATE: merge imagesArray into default state, filter out server images
    (outboundState) => ({
        imagesArray: (outboundState?.imagesArray || []).filter(
            img => !img.editing && !(img.uploaded && !img.uri)
        ),
        editingPhotos: [],
        swiperIndex: 0,
        customTagError: null
    }),
    { whitelist: ['photos'] }
);

const migrations = {
    // v0: Migrate persisted state from old 'images' key to 'photos'
    0: (state) => {
        if (state?.images) {
            return {
                ...state,
                photos: state.images,
                images: undefined
            };
        }
        return state;
    },
    // v1: Strip retired galleryAcknowledged from photos state
    1: (state) => {
        if (state?.photos?.galleryAcknowledged !== undefined) {
            const { galleryAcknowledged, ...rest } = state.photos;
            return { ...state, photos: rest };
        }
        return state;
    },
    // v2: Add quickTags slice (auto-initializes, no-op migration)
    2: (state) => state
};

// Configuration for Redux Persist
/**
 * Transform for the gallery reducer: only persist dismissedUris.
 * Camera roll photos and pagination state reload fresh on each launch.
 */
const galleryTransform = createTransform(
    // On PERSIST: save only dismissedUris
    (inboundState) => ({
        dismissedUris: inboundState.dismissedUris
    }),
    // On REHYDRATE: merge dismissedUris into fresh default state
    (outboundState) => ({
        ...galleryInitialState,
        dismissedUris: outboundState?.dismissedUris || []
    }),
    {whitelist: ['gallery']}
);

/**
 * Transform for the stats reducer: persist only numeric stat values.
 * fetchStatus and error reset fresh on each launch so getStats() always runs clean.
 */
const statsTransform = createTransform(
    // On PERSIST: save only the stat numbers
    (inboundState) => ({
        totalTags: inboundState.totalTags,
        totalImages: inboundState.totalImages,
        totalUsers: inboundState.totalUsers,
        newUsersToday: inboundState.newUsersToday,
        newUsersLast7Days: inboundState.newUsersLast7Days,
        newUsersLast30Days: inboundState.newUsersLast30Days,
        newTagsToday: inboundState.newTagsToday,
        newTagsLast7Days: inboundState.newTagsLast7Days,
        newTagsLast30Days: inboundState.newTagsLast30Days,
        newPhotosToday: inboundState.newPhotosToday,
        newPhotosLast7Days: inboundState.newPhotosLast7Days,
        newPhotosLast30Days: inboundState.newPhotosLast30Days
    }),
    // On REHYDRATE: merge stats into fresh default state
    (outboundState) => ({
        fetchStatus: 'idle',
        error: null,
        totalTags: outboundState?.totalTags ?? 0,
        totalImages: outboundState?.totalImages ?? 0,
        totalUsers: outboundState?.totalUsers ?? 0,
        newUsersToday: outboundState?.newUsersToday ?? 0,
        newUsersLast7Days: outboundState?.newUsersLast7Days ?? 0,
        newUsersLast30Days: outboundState?.newUsersLast30Days ?? 0,
        newTagsToday: outboundState?.newTagsToday ?? 0,
        newTagsLast7Days: outboundState?.newTagsLast7Days ?? 0,
        newTagsLast30Days: outboundState?.newTagsLast30Days ?? 0,
        newPhotosToday: outboundState?.newPhotosToday ?? 0,
        newPhotosLast7Days: outboundState?.newPhotosLast7Days ?? 0,
        newPhotosLast30Days: outboundState?.newPhotosLast30Days ?? 0
    }),
    {whitelist: ['stats']}
);

const persistConfig = {
    key: 'root',
    version: 2,
    storage: AsyncStorage,
    whitelist: ['auth', 'photos', 'quickTags', 'gallery', 'stats'],
    transforms: [imagesTransform, galleryTransform, statsTransform],
    migrate: (state, currentVersion) => {
        if (!state) return Promise.resolve(state);
        let migrated = state;
        for (let v = (state._persist?.version ?? -1) + 1; v <= currentVersion; v++) {
            if (migrations[v]) {
                migrated = migrations[v](migrated);
            }
        }
        return Promise.resolve(migrated);
    }
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default function configureAppStore(initialState = {}) {
    const store = configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
                }
            }).concat(__DEV__ ? [require('redux-immutable-state-invariant').default()] : []),
        preloadedState: initialState,
        devTools: __DEV__
    });

    const persistor = persistStore(store);

    return { store, persistor };
}
