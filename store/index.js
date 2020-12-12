import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistCombineReducers } from 'redux-persist';
import AsyncStorage from '@react-native-community/async-storage';
import reducers from '../reducers';

const config = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth']
};

const reducer = persistCombineReducers(config, reducers);

export default function configurationStore(initialState = {}) {
  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(thunk)
  );
  const persistor = persistStore(store);
  return { persistor, store };
}

// applyMiddleware is redux thunk
// compose - store enhancer

// const store = createStore(
//   reducers,
//   {},
//   compose(
//     applyMiddleware(thunk),
//     autoRehydrate()
//   )
// );
//
// // store enhancer, pulls data, sends to reducers
//
// // When state changes, puts data into AsyncStorage, whitelist keys
// persistStore(store, { storage: AsyncStorage, whitelist: ['likedJobs'] });
//
// export default store;
