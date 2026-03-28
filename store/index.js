import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootReducer } from '../reducers';

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
    }
};

// Configuration for Redux Persist
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['auth', 'photos'],
    transforms: [imagesTransform],
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
