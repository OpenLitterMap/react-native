import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
// import SplashScreen from 'react-native-splash-screen'
import { PersistGate } from 'redux-persist/es/integration/react';
import configureStore from './store';

// navigation container
import { NavigationContainer } from '@react-navigation/native';
import { MainRoutes } from './routes';

import { LanguageProvider } from 'react-native-translation';
import { langs } from './assets/langs';

import * as RNLocalize from 'react-native-localize';
let lang = RNLocalize.getLocales()['languageCode'];
if (!langs[lang]) lang = 'en';

import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';
import { IS_PRODUCTION } from './actions/types';

const App = () => {
    if (IS_PRODUCTION) {
        Sentry.init({
            dsn: SENTRY_DSN
        });
    }

    const { persistor, store } = configureStore();

    store.dispatch({ type: 'CHANGE_LANG', payload: lang });

    return (
        <NavigationContainer>
            <Provider store={store}>
                <PersistGate persistor={persistor}>
                    <LanguageProvider
                        language={lang}
                        defaultLanguage={'en'}
                        translations={langs}>
                        <MainRoutes />
                    </LanguageProvider>
                </PersistGate>
            </Provider>
        </NavigationContainer>
    );
};

export default App;
