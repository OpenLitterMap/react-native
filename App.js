import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
// import SplashScreen from 'react-native-splash-screen'
import { PersistGate } from 'redux-persist/es/integration/react'
import configureStore from './store'

// import Icon from 'react-native-vector-icons/MaterialIcons';
// Icon.loadFont();
import RootContainer from './screens/RootContainer'

import { LanguageProvider } from 'react-native-translation'
import { langs } from './assets/langs';

import * as RNLocalize from "react-native-localize";
let lang = RNLocalize.getLocales()['languageCode'];
if (lang !== 'de' && lang !== 'en' && lang !== 'nl' && lang !== 'es') lang = 'en'

// was App: () => React$Node => { ... }
const App = () => {

    // Splash screen
    // useEffect(() => {
    //   SplashScreen.hide();
    // }, []);

    const { persistor, store } = configureStore();

    store.dispatch({ type: 'CHANGE_LANG', payload: lang });

    return (
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                <LanguageProvider language={lang} defaultLanguage={"en"} translations={langs} >
                    <RootContainer  />
                </LanguageProvider>
            </PersistGate>
        </Provider>
    );
};


export default App;
