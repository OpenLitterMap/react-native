import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import SplashScreen from 'react-native-splash-screen'
import { PersistGate } from 'redux-persist/es/integration/react'
import configureStore from './store'

// import Icon from 'react-native-vector-icons/MaterialIcons';
// Icon.loadFont();

import { LanguageProvider } from 'react-native-translation'

// todo - load the language we need
import { en } from './assets/langs/en';

import RootContainer from './screens/RootContainer'

const App: () => React$Node = () => {

    // Splash screen
    // useEffect(() => {
    //   SplashScreen.hide();
    // }, []);

    const { persistor, store } = configureStore();

    return (
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                <LanguageProvider language={"en"} defaultLanguage={"en"} translations={en}>
                    <RootContainer />
                </LanguageProvider>
            </PersistGate>
        </Provider>
    );
};


export default App;
