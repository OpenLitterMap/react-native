import produce from 'immer';
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
    SUBMIT_END,
    SUBMIT_START
} from '../actions/types';
import { XPLEVEL } from '../screens/pages/data/xpLevel';

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
    return produce(state, draft => {
        switch (action.type) {
            /**
             * Status 400 : The user entered the wrong password
             */
            // TODO: User LOGIN_FAIL reducer and remove this
            case BAD_PASSWORD:
                draft.password = '';
                draft.serverStatusText =
                    'Your password is incorrect. Please try again or reset it.';
                draft.isSubmitting = false;

                break;

            /**
             * Change app language
             * Language changeable from WelcomeScreen -- LanguageFlags.js
             */

            case CHANGE_LANG:
                draft.lang = action.payload;

                break;

            /**
             * Change auth form messages/errors
             */

            case CHANGE_SERVER_STATUS_TEXT:
                draft.serverStatusText = action.payload;
                draft.isSubmitting = false;

                break;

            // FIXME: unused reducer/action

            case STORE_CURRENT_APP_VERSION:
                return {
                    ...state,
                    appVersion: action.payload
                };

            // FIXME: unused reducer/action

            case ON_SEEN_FEATURE_TOUR:
                return {
                    ...state,
                    appVersion: action.payload,
                    hasSeenFeatureTour: true
                };

            /**
             * Auth API request /  form submit end
             * makes submit button active again
             */

            case SUBMIT_END:
                draft.isSubmitting = false;

                break;

            /**
             * Auth API request /  form submit start
             * makes submit button inactive
             */

            case SUBMIT_START:
                draft.isSubmitting = true;

                break;

            case ACCOUNT_CREATED:
                draft.success = action.payload;
                draft.buttonDisabled = false;
                draft.isLoggingIn = true;
                draft.isSubmitting = false;
                draft.modalUsernameVisible = false;

                break;

            /**
             * Logout user
             * Reset app language to en
             * reset state to initial
             * remove jwt token
             */
            // TODO: Test This
            case LOGOUT:
                return INITIAL_STATE;
            // we need to init lang again
            // if (!lang) lang = 'en';

            // return {
            //     state: INITIAL_STATE,
            //     lang: lang,
            //     token: null
            // };

            /**
             * There was a problem during login
             */

            case LOGIN_FAIL:
                draft.password = '';
                draft.serverStatusText = action.payload;
                draft.isSubmitting = false;

                break;

            /**
             * Resets the auth form and display messages
             */
            case LOGIN_OR_SIGNUP_RESET:
                draft.email = '';
                draft.password = '';
                draft.emailError = '';
                draft.passwordError = '';
                draft.buttonPressed = false;
                draft.buttonDisabled = false;
                draft.success = '';
                draft.isSubmitting = false;
                draft.modalUsernameVisible = false;
                draft.username = '';
                draft.usernameError = '';

                break;

            /**
             * After a successful login
             */
            case LOGIN_SUCCESS:
                draft.token = action.payload;
                draft.appLoading = !draft.appLoading;
                draft.isSubmitting = false;

                break;

            // FIXME: Remove Unused reducer
            case PASSWORD_ERROR:
                return {
                    ...state,
                    passwordError: action.payload,
                    modalUsernameVisible: false,
                    isSubmitting: false
                };

            // FIXME: unused reducer/action
            case TOGGLE_USERNAME_MODAL:
                return {
                    ...state,
                    modalUsernameVisible: !state.modalUsernameVisible
                };

            /**
             * When the app loads, we check if the JWT is valid
             */
            case TOKEN_IS_VALID:
                draft.tokenIsValid = action.payload;

                break;

            /**
             * If user logged in
             * process user data and calculate
             * user level -- based on user xp breakdown from ../screens/pages/data/xpLevel
             * targetPercentage -- percentage completed to reach next level from prev level xp
             * totalTags added by user
             * totalLittercoin of user -- littercoin_allowance + littercoin_owed
             */

            case USER_FOUND:
                let user = action.payload.userObj;

                const level = XPLEVEL.findIndex(xp => xp > user.xp);
                const xpRequired = XPLEVEL[level] - user.xp;
                const previousTarget = level > 0 ? XPLEVEL[level - 1] : 0;
                const targetPercentage =
                    ((user.xp - previousTarget) /
                        (XPLEVEL[level] - previousTarget)) *
                    100;

                user = {
                    ...user,
                    level: level,
                    xpRequired: xpRequired,
                    targetPercentage: targetPercentage,
                    totalTags: user.total_tags,
                    totalLittercoin:
                        (user.littercoin_allowance || 0) +
                        (user.littercoin_owed || 0)
                };

                AsyncStorage.setItem('user', JSON.stringify(user));

                draft.user = user;

                break;

            /**
             * Update user object after userdata changed from settings
             */
            case UPDATE_USER_OBJECT:
                draft.user = action.payload;

                return;

            // FIXME: unused reducer/action

            case USERNAME_CHANGED:
                const username = action.payload;

                return {
                    ...state,
                    username: username,
                    usernameError: ''
                };

            // FIXME: unused reducer
            case USERNAME_ERROR:
                return {
                    ...state,
                    usernameError: action.payload
                };

            default:
                return draft;
        }
    });
}
