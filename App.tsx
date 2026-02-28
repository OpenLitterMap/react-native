import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainRoutes } from './routes';
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import configureAppStore from './store';
import { IS_PRODUCTION } from './actions/types';
import setupAxiosInterceptors from './utils/setupAxiosInterceptors';
import './i18n';

const SENTRY_DSN = Config.SENTRY_DSN;
const { store, persistor } = configureAppStore();

setupAxiosInterceptors(store);

const App = () => {
    if (IS_PRODUCTION) {
        Sentry.init({
            dsn: SENTRY_DSN
        });
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <MainRoutes />
                    </PersistGate>
                </Provider>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};

export default App;
