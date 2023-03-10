import AsyncStorage from '@react-native-community/async-storage';
import {
    ACCOUNT_CREATED,
    CHANGE_SERVER_STATUS_TEXT,
    CLIENT_SECRET,
    CLIENT_ID,
    CHANGE_LANG,
    SUBMIT_START,
    LOGIN_OR_SIGNUP_RESET,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    USER_FOUND,
    SUBMIT_END,
    URL
} from './types';
import axios from 'axios';
import * as Sentry from '@sentry/react-native';

export const changeLang = lang => {
    return {
        type: CHANGE_LANG,
        payload: lang
    };
};

/**
 * Check if the token is valid
 *
 * It will return "valid" if the user is logged in
 *
 * Or  "Unauthenticated." if they are logged out / not valid
 */
export const checkValidToken = token => {
    return async dispatch => {
        await axios({
            url: URL + '/api/validate-token',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                Accept: 'application/json'
            }
        })
            .then(response => {
                console.log('checkValidToken.response', response.data);

                if (
                    response.data.hasOwnProperty('message') &&
                    response.data.message === 'valid'
                ) {
                    dispatch({
                        type: 'TOKEN_IS_VALID',
                        payload: true
                    });
                }
            })
            .catch(error => {
                console.log(error);
                //  token is critical data
                // for any type of error that occurs during validating token
                // we should mark token as invalid
                dispatch({
                    type: 'TOKEN_IS_VALID',
                    payload: false
                });
            });
    };
};

/****
 *** CHECK IF TOKEN EXISTS - log in
 **  - fired on AuthScreen componentDidMount
 */

export const checkForToken = () => async dispatch => {
    console.log('auth_actions - checkForToken');
    let jwt;

    try {
        jwt = await AsyncStorage.getItem('jwt');
    } catch (e) {
        console.log('Error getting token - check for token');
    }

    if (jwt) {
        console.log('auth_actions - token exists');
        // Dispatch an action, login success
        await dispatch({ type: LOGIN_SUCCESS, payload: jwt });
    } else {
        console.log('auth_actions - token not found');
        return null;
    }
};

/**
 * Create an Account
 */
export const createAccount = data => {
    return async dispatch => {
        // setting isSubmitting to true
        // shows loader on button
        dispatch({ type: SUBMIT_START });
        let response;

        try {
            response = await axios(URL + '/api/register', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: 'password',
                    username: data.username,
                    email: data.email,
                    password: data.password
                }
            });
        } catch (error) {
            let payload;
            // handling error from backend
            if (error?.response) {
                const errorData = error?.response?.data.errors;
                if (errorData?.email) {
                    payload = errorData?.email;
                } else if (errorData?.username) {
                    payload = errorData?.username;
                } else if (errorData?.password) {
                    payload = errorData?.password;
                } else {
                    payload = 'Something went wrong, please try again';
                }

                dispatch({
                    type: CHANGE_SERVER_STATUS_TEXT,
                    payload: payload
                });
                return;
            } else {
                // handling Network Error
                dispatch({
                    type: CHANGE_SERVER_STATUS_TEXT,
                    payload:
                        'Network error, please check internet connection and try again'
                });
                return;
            }
        }

        if (response?.data?.success) {
            dispatch({
                type: ACCOUNT_CREATED,
                payload: response?.data?.success
            });
            // Login user if account creation successful
            const login = {
                email: data.email,
                password: data.password
            };

            // Log the user in
            dispatch(userLogin(login));
        }
    };
};

/**
 * Reset serverStatusText on form toggle
 */
export const loginOrSignupReset = () => {
    // console.log('action - login or signup reset');
    return {
        type: LOGIN_OR_SIGNUP_RESET
    };
};

/**
 * The user wants to log out.
 *
 * First, delete the auth token
 *
 * This action will call many reducers
 */
export const logout = () => {
    AsyncStorage.clear();

    // delete user from AsyncStorage?
    // state is reset on Logout => user: null
    return {
        type: LOGOUT
    };
};

/**
 * Change the text of serverStatusText
 *
 * @param text: string
 */
export const changeServerStatusText = text => {
    return {
        type: CHANGE_SERVER_STATUS_TEXT,
        payload: text
    };
};

/**
 * The user forgot their password and is submitting their email address to request a link
 */
export const sendResetPasswordRequest = email => {
    return async dispatch => {
        // setting isSubmitting to true
        // shows loader on button
        dispatch({ type: SUBMIT_START });
        let response;
        try {
            response = await axios(URL + '/api/password/email', {
                method: 'POST',
                data: {
                    email: email
                },
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            if (error?.response) {
                console.log('sendResetPasswordRequest', error.response?.data);
                // setting isSubmitting to false
                dispatch({
                    type: CHANGE_SERVER_STATUS_TEXT,
                    payload:
                        error.response?.data?.errors?.email ||
                        'Error, please try again'
                });
            } else {
                // Handling mainly network error
                console.log('sendResetPasswordRequest', error);
                dispatch({
                    type: CHANGE_SERVER_STATUS_TEXT,
                    payload: 'Network error, please try again'
                });
            }
        }
        console.log('sendResetPasswordRequest', response?.data);

        if (response?.data) {
            // setting isSubmitting to false
            dispatch({
                type: CHANGE_SERVER_STATUS_TEXT,
                payload: 'We have emailed your password reset link!'
            });
        }
    };
};

/**
 * A user is trying to login with email and password
 */
export const userLogin = data => {
    return async dispatch => {
        // initial dispatch to show form isSubmitting state
        dispatch({ type: SUBMIT_START });
        // axios response
        let response;
        // jwt
        let token;
        try {
            response = await axios(URL + '/oauth/token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: 'password',
                    username: data.email,
                    password: data.password
                }
            });
            if (response?.status === 200) {
                token = response?.data?.access_token;

                // save jwt to AsyncStore if status is 200
                try {
                    await AsyncStorage.setItem('jwt', token);
                } catch (error) {
                    console.log('userLogin.saveJWT', error);
                    throw 'Unable to save token to asyncstore';
                }
            } else {
                throw 'Something went wront';
            }
        } catch (error) {
            if (error?.response) {
                if (error?.response?.status === 400) {
                    // handling wrong password response from backend
                    dispatch({
                        type: LOGIN_FAIL,
                        payload:
                            'Your password is incorrect. Please try again or reset it.'
                    });
                    return;
                } else {
                    // handling other errors from backend and thrown from try block
                    dispatch({
                        type: LOGIN_FAIL,
                        payload: 'Login Unsuccessful. Please try again.'
                    });
                    return;
                }
            } else {
                // Handling network error
                dispatch({
                    type: LOGIN_FAIL,
                    payload: 'Network error, please try again'
                });
                return;
            }
        }

        // Dispatch success if no errors
        // fetch user object before navigating
        dispatch(fetchUser(token));
    };
};

/**
 * Make an API request to fetch the current user with an access token
 */
export const fetchUser = token => {
    return async dispatch => {
        let response;

        try {
            response = await axios(URL + '/api/user', {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            });
        } catch (error) {
            if (error?.response) {
                dispatch({
                    type: LOGIN_FAIL,
                    payload: 'Login Unsuccessful. Please try again.'
                });
            } else {
                // Handling network error
                dispatch({
                    type: LOGIN_FAIL,
                    payload: 'Network error, please try again'
                });
            }
        }
        if (response && response.status === 200 && response.data) {
            const userObj = response.data;
            // Adding context -- user to Sentry
            // will be able to identify the user who faced the errors.
            Sentry.setUser({ email: userObj?.email, id: userObj?.id });

            dispatch({
                type: USER_FOUND,
                payload: { userObj, token }
            });
        }
    };
};

/**
 * User found in AsyncStorage - update state props
 */
export const userFound = data => {
    // console.log("action - user found");
    return {
        type: USER_FOUND,
        payload: data
    };
};

/**
 * TO DO - FACEBOOK LOGIN
 */

// AsyncStorage.setItem('fbtoken', token);
// AsyncStorage.getItem('fbtoken');
// export const facebookLogin = () => async dispatch => {
//   try {
//     let token = await AsyncStorage.getItem("token");
//   } catch (e) {
//     console.log("error getting token, facebookLogin");
//   }
//   if (token) {
//     // Dispatch an action, login success
//     dispatch({ type: FACEBOOK_LOGIN_SUCCESS, payload: token });
//   } else {
//     // Start up Login process - helper
//     doFacebookLogin(dispatch);
//     // login(dispatch);
//   }
// }

// helper function
// async action
// 1. open login screen
// 2. wait for login success
// doFacebookLogin = async dispatch => {
//   let { type, token } = await Facebook.logInWithReadPermissionsAsync('2064390957175459', {
//     permissions: ['public_profile']
//   });
//
//   console.log(" === facebook login type ===");
//   console.log(type);
//
//   if (type === 'cancel') {
//     return dispatch({ type: FACEBOOK_LOGIN_FAIL });
//   }
//
//   await AsyncStorage.setItem("token", token);
//   dispatch({ type: FACEBOOK_LOGIN_SUCCESS, payload: token });
// }
