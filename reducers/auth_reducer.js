import produce from 'immer';
import AsyncStorage from '@react-native-community/async-storage';
import {
    ACCOUNT_CREATED,
    CHANGE_LANG,
    CHANGE_SERVER_STATUS_TEXT,
    LOGIN_OR_SIGNUP_RESET,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    TOKEN_IS_VALID,
    UPDATE_USER_OBJECT,
    USER_FOUND,
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

                break;

            /**
             * Logout user
             * reset state to initial
             
             */

            case LOGOUT:
                return INITIAL_STATE;

            /**
             * There was a problem during login
             * Wrong password
             * Network/Server error
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
                draft.buttonPressed = false;
                draft.buttonDisabled = false;
                draft.success = '';
                draft.isSubmitting = false;
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

                break;

            default:
                return draft;
        }
    });
}
