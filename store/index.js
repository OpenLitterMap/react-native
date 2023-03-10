import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist';
import AsyncStorage from '@react-native-community/async-storage';
import reducers from '../reducers';

const config = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'images']
};

const middleware = __DEV__
    ? [require('redux-immutable-state-invariant').default(), thunk]
    : [thunk];

const reducer = persistCombineReducers(config, reducers);

export default function configurationStore(initialState = {}) {
    const store = createStore(
        reducer,
        initialState,
        applyMiddleware(...middleware)
    );

    const persistor = persistStore(store);

    return { persistor, store };
}
