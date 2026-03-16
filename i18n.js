import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {en} from './assets/langs/en';
import {ar} from './assets/langs/ar';
import {de} from './assets/langs/de';
import {es} from './assets/langs/es';
import {fr} from './assets/langs/fr';
import {ie} from './assets/langs/ie';
import {nl} from './assets/langs/nl';
import {pt} from './assets/langs/pt';

const LANGUAGE_KEY = 'user_language';

const resources = {
    en: {translation: en},
    ar: {translation: ar},
    de: {translation: de},
    es: {translation: es},
    fr: {translation: fr},
    ie: {translation: ie},
    nl: {translation: nl},
    pt: {translation: pt}
};

// Custom language detector that persists to AsyncStorage
const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
            callback(saved || 'en');
        } catch {
            callback('en');
        }
    },
    init: () => {},
    cacheUserLanguage: async (lng) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lng);
        } catch {}
    }
};

i18n.use(languageDetector).use(initReactI18next).init({
    compatibilityJSON: 'v3',

    resources,

    fallbackLng: 'en',

    interpolation: {
        escapeValue: false
    },

    react: {
        useSuspense: false
    }
});

export default i18n;
