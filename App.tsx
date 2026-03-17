import 'react-native-gesture-handler';
import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {MainRoutes} from './routes';
import ErrorBoundary from './screens/components/ErrorBoundary';
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import configureAppStore from './store';
import {IS_PRODUCTION} from './actions/types';
import setupAxiosInterceptors from './utils/setupAxiosInterceptors';
import './i18n';

const SENTRY_DSN = Config.SENTRY_DSN;
const {store, persistor} = configureAppStore();

setupAxiosInterceptors(store);

if (IS_PRODUCTION && SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        tracePropagationTargets: []
    });
}

const App = () => {
    return (
        // eslint-disable-next-line react-native/no-inline-styles
        <GestureHandlerRootView style={{flex: 1}}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <SafeAreaProvider>
                        <ErrorBoundary>
                            <NavigationContainer>
                                <MainRoutes />
                            </NavigationContainer>
                        </ErrorBoundary>
                    </SafeAreaProvider>
                </PersistGate>
            </Provider>
        </GestureHandlerRootView>
    );
};

export default IS_PRODUCTION ? Sentry.wrap(App) : App;
