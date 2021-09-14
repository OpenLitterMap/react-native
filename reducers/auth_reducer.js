import AsyncStorage from '@react-native-community/async-storage';
import {
    ACCOUNT_CREATED,
    BAD_PASSWORD,
    CHANGE_LANG,
    CHANGE_SERVER_STATUS_TEXT,
    PASSWORD_ERROR,
    LOGIN_OR_SIGNUP_RESET,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    TOGGLE_USERNAME_MODAL,
    TOKEN_IS_VALID,
    STORE_CURRENT_APP_VERSION,
    UPDATE_USER_OBJECT,
    USERNAME_CHANGED,
    USER_FOUND,
    USERNAME_ERROR,
    ON_SEEN_FEATURE_TOUR,
    SERVER_STATUS,
    SUBMIT_END,
    SUBMIT_START
} from '../actions/types';
import { XPLEVEL } from '../screens/pages/data/xpLevel';
// import AsyncStorage from '@react-native-community/async-storage';
// import { Map, List } from 'immutable';

import * as RNLocalize from 'react-native-localize';
let lang = RNLocalize.getLocales()['languageCode'];

const INITIAL_STATE = {
    lang: 'en',
    appLoading: true,
    appVersion: '',
    buttonPressed: false,
    buttonDisabled: false,
    email: '',
    isLoggingIn: false,
    isSubmitting: false,
    loading: false,
    modalUsernameVisible: false,
    password: '',
    success: '',
    token: null,
    tokenIsValid: false,
    user: null,
    username: '',
    usernameError: '',
    serverStatusText: ''
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        /**
         * Status 400 : The user entered the wrong password
         */
        case BAD_PASSWORD:
            return {
                ...state,
                password: '',
                token: null,
                serverStatusText:
                    'Your password is incorrect. Please try again or reset it.',
                isSubmitting: false
            };

        case CHANGE_LANG:
            return {
                ...state,
                lang: action.payload
            };

        case CHANGE_SERVER_STATUS_TEXT:
            return {
                ...state,
                serverStatusText: action.payload
            };

        case STORE_CURRENT_APP_VERSION:
            return {
                ...state,
                appVersion: action.payload
            };

        case ON_SEEN_FEATURE_TOUR:
            return {
                ...state,
                appVersion: action.payload,
                hasSeenFeatureTour: true
            };
        case SUBMIT_END:
            return {
                ...state,
                isSubmitting: false
            };

        case SUBMIT_START:
            return {
                ...state,
                isSubmitting: true
            };

        case ACCOUNT_CREATED:
            // todo - log the user in
            // redirect them to main screen
            return {
                ...state,
                success: action.payload,
                //isLoggingIn: !state.isLoggingIn,
                buttonDisabled: false,
                isLoggingIn: true,
                isSubmitting: false,
                modalUsernameVisible: false
            };

        case SERVER_STATUS:
            return {
                ...state,
                serverStatusText: action.payload,
                isSubmitting: false
            };

        /**
         * The user wants to log out. JWT has been deleted.
         */
        case LOGOUT:
            // we need to init lang again
            if (!lang) lang = 'en';

            return {
                state: INITIAL_STATE,
                lang: lang,
                token: null
            };

        /**
         * There was a problem during login
         */
        case LOGIN_FAIL:
            return {
                ...state,
                password: '',
                token: null,
                serverStatusText: action.payload,
                isSubmitting: false
            };

        case LOGIN_OR_SIGNUP_RESET:
            // console.log('Reducer - login or signup reset.');
            return {
                ...state,
                email: '',
                password: '',
                emailError: '',
                passwordError: '',
                buttonPressed: false,
                buttonDisabled: false,
                success: '',
                isSubmitting: false,
                modalUsernameVisible: false,
                username: '',
                usernameError: ''
            };

        /**
         * After a successful login
         */
        case LOGIN_SUCCESS:
            return {
                ...state,
                token: action.payload,
                appLoading: !state.appLoading,
                isSubmitting: false
            };

        case PASSWORD_ERROR:
            return {
                ...state,
                passwordError: action.payload,
                modalUsernameVisible: false,
                isSubmitting: false
            };

        case TOGGLE_USERNAME_MODAL:
            return {
                ...state,
                modalUsernameVisible: !state.modalUsernameVisible
            };

        /**
         * When the app loads, we check if the JWT is valid
         */
        case TOKEN_IS_VALID:
            return {
                ...state,
                tokenIsValid: action.payload
            };

        case USER_FOUND:
            let user;
            if (action.payload === 'string') {
                user = JSON.parse(action.payload);
            } else {
                user = action.payload.userObj;
            }
            const level = XPLEVEL.findIndex(xp => xp > user.xp);
            const xpRequired = XPLEVEL[level] - user.xp;
            const previousTarget = level > 0 ? XPLEVEL[level - 1] : 0;
            const targetPercentage =
                ((user.xp - previousTarget) /
                    (XPLEVEL[level] - previousTarget)) *
                100;
            user.level = level;
            user.xpRequired = xpRequired;
            user.targetPercentage = targetPercentage;
            user.totalTags = user.total_brands + user.total_tags;
            user.totalLittercoin =
                (user.littercoin_allowance || 0) + (user.littercoin_owed || 0);

            AsyncStorage.setItem('user', JSON.stringify(user));
            return {
                ...state,
                user
                // buttonDisabled: true
            };

        case UPDATE_USER_OBJECT:
            const newUser = Object.assign({}, action.payload);

            return {
                ...state,
                user: newUser
            };

        /**
         * Todo - check, is this immutable?
         */
        case USERNAME_CHANGED:
            const username = action.payload;

            return {
                ...state,
                username: username,
                usernameError: ''
            };

        case USERNAME_ERROR:
            return {
                ...state,
                usernameError: action.payload
            };

        default:
            return state;
    }
}
