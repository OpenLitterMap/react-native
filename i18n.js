import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from './assets/langs/en'

// import Backend from 'i18next-xhr-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en
};

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        debug: true,
        resources,
        lng: "en",

        keySeparator: true, // we use keys in form messages.welcome

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;