import {
    SUBMIT_START,
    ACCOUNT_CREATED,
    EMAIL_CHANGED,
    EMAIL_ERROR,
    PASSWORD_ERROR,
    LOGIN_OR_SIGNUP_RESET,
    EMAIL_INCORRECT,
    EMAIL_VALID,
    PASSWORD_INCORRECT,
    PASSWORD_VALID,
    FACEBOOK_LOGIN_SUCCESS,
    FACEBOOK_LOGIN_FAIL,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    SIGNUP_SUCCESS,
    SIGNUP_FAIL,
    LOGOUT,
    TOGGLE_USERNAME_MODAL,
    STORE_CURRENT_APP_VERSION,
    UPDATE_USER_OBJECT,
    USERNAME_CHANGED,
    USER_FOUND,
    USERNAME_ERROR,
    ON_SEEN_FEATURE_TOUR,
    SERVER_STATUS
} from '../actions/types';
import AsyncStorage from '@react-native-community/async-storage';
// import { Map, List } from 'immutable';

// state.auth.email
const INITIAL_STATE = {
    appLoading: true,
    appVersion: '',
    buttonPressed: false,
    buttonDisabled: false,
    email: '',
    emailError: ' ',
    isLoggingIn: false,
    isSubmitting: false,
    loading: false,
    modalUsernameVisible: false,
    password: '',
    passwordError: '',
    success: '',
    token: null,
    user: null,
    username: '',
    usernameError: '',
    serverStatus: ''
};

export default function(state = INITIAL_STATE, action) {
    // console.log(action.type);
    switch (action.type)
    {
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
                serverStatus: action.payload,
                isSubmitting: false
            };

        case EMAIL_ERROR:
            return {
                ...state,
                emailError: action.payload,
                modalUsernameVisible: false,
                isSubmitting: false
            };

        case EMAIL_INCORRECT:
            return {
                ...state,
                emailError: action.payload,
                buttonDisabled: true,
                success: ''
            };

        case EMAIL_VALID:
            // console.log('reducer - email is valid');
            return {
                ...state,
                emailError: action.payload,
                buttonDisabled: false
            };

        case LOGOUT:
            // console.log('-- logout, reducer --');
            return {
                state: INITIAL_STATE
            };

        case LOGIN_FAIL:
            // change error to action.payload.emailError, .passwordError
            return {
                ...state,
                password: '',
                token: null,
                emailError: 'Login Unsuccessful. Please try again.',
                passwordError: 'Login Unsuccessful. Please try again.',
                serverStatus: 'Login Unsuccessful. Please try again.',
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

        case LOGIN_SUCCESS:
            // console.log('=== LOGIN SUCCESS - REDUCER ==');
            // console.log(action.payload);
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

        case PASSWORD_INCORRECT:
            return {
                ...state,
                passwordError: action.payload,
                buttonDisabled: true
            };

        case PASSWORD_VALID:
            // console.log('reducer - password is valid');
            return {
                ...state,
                passwordError: action.payload,
                buttonDisabled: false
            };

        case TOGGLE_USERNAME_MODAL:
            return {
                ...state,
                modalUsernameVisible: !state.modalUsernameVisible
            };

        case USER_FOUND:
            // console.log('- user found, reducer -');
            // console.log(typeof(action.payload));
            // console.log(action.payload);
            let user;
            if (action.payload == 'string') {
                // console.log('Payload is string');
                // console.log(JSON.parse(action.payload));
                user = JSON.parse(action.payload);
            } else {
                // console.log('Payload is not string');
                // console.log(action.payload);
                user = action.payload.userObj;
                // console.log(user);
            }
            // console.log(action.payload.token);
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
