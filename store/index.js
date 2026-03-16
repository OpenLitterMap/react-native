import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootReducer } from '../reducers';

/**
 * Transform for the images reducer: only persist imagesArray.
 * Upload counters, phase tracking, and error state start fresh on relaunch.
 */
const imagesTransform = createTransform(
    // On PERSIST: save only imagesArray
    (inboundState) => ({
        imagesArray: inboundState.imagesArray
    }),
    // On REHYDRATE: merge imagesArray into default state, strip server images
    (outboundState) => ({
        imagesArray: (outboundState?.imagesArray || []).filter(
            img => !img.editing && !(img.uploaded && !img.uri)
        ),
        swiperIndex: 0,
        totalToUpload: 0,
        uploaded: 0,
        uploadFailed: 0,
        tagged: 0,
        taggedFailed: 0,
        uploadPhase: 'idle',
        currentUploadIndex: 0,
        uploadAbortReason: null,
        failedCounts: {
            alreadyUploaded: 0,
            invalidCoordinates: 0,
            timeout: 0,
            network: 0,
            server: 0,
            unknown: 0
        },
        customTagError: null
    }),
    { whitelist: ['images'] }
);

// Configuration for Redux Persist
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'images'],
    transforms: [imagesTransform]
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
