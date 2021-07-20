import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {
    ACCOUNT_CREATED,
    BAD_PASSWORD,
    CHANGE_SERVER_STATUS_TEXT,
    CLIENT_SECRET,
    CLIENT_ID,
    CHANGE_LANG,
    SUBMIT_START,
    SERVER_STATUS,
    LOGIN_OR_SIGNUP_RESET,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    USER_FOUND,
    USERNAME_CHANGED,
    TOGGLE_USERNAME_MODAL,
    STORE_CURRENT_APP_VERSION,
    ON_SEEN_FEATURE_TOUR,
    URL
} from './types';
import axios from 'axios';

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
                console.log(
                    'auth_actions.checkValidToken',
                    error.response.data
                );

                if (error.response.data.message === 'Unauthenticated.') {
                    dispatch({
                        type: 'TOKEN_IS_VALID',
                        payload: false
                    });
                }
            });
    };
};

export const storeCurrentAppVersion = text => {
    return {
        type: STORE_CURRENT_APP_VERSION,
        payload: text
    };
};

export const onSeenFeatureTour = text => {
    return {
        type: ON_SEEN_FEATURE_TOUR,
        payload: text
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
    // console.log('action - attempting to create an account');
    return dispatch => {
        fetch(URL + '/api/register', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'password',
                email: data.email,
                password: data.password,
                username: data.username
            })
        })
            .then(response => {
                // console.log('Response!');
                const responseJson = response
                    .text() // returns a promise
                    .then(async responseJson => {
                        // console.log('=== create account - responseJson ===');

                        const jsonObj = JSON.parse(responseJson);
                        // console.log('-- parsed response --');
                        // console.log(jsonObj);

                        // TODO refactor returned errors to be simple text messages with status codes
                        if (jsonObj.errors) {
                            let payload;
                            if (jsonObj.errors.email) {
                                payload = jsonObj.errors.email;
                            }
                            if (jsonObj.errors.password) {
                                payload = jsonObj.errors.password;
                            }
                            if (jsonObj.errors.username) {
                                payload = jsonObj.errors.username;
                            }

                            dispatch({
                                type: SERVER_STATUS,
                                payload: payload
                            });
                        }

                        if (jsonObj.success) {
                            dispatch({
                                type: ACCOUNT_CREATED,
                                payload: jsonObj.success
                            });

                            var login = {
                                email: data.email,
                                password: data.password
                            };

                            // Log the user in
                            dispatch(serverLogin(login));
                        }
                    })
                    .catch(err => {
                        // console.log('Error 2');
                        // console.log(err);
                    });
                // } // response status 200
            })
            .catch(error => {
                // console.log('Error!');
                // console.log(error);
            });
    };
};

/**
 * Reset the property for isButtonPressed
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
    AsyncStorage.removeItem('jwt');
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
    return dispatch => {
        return axios(URL + '/api/password/email', {
            method: 'POST',
            data: {
                email: email,
                api: true // we need this to override the response
            },
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('sendResetPasswordRequest', response.data);

                if (
                    response.data.message ===
                    'We have emailed your password reset link!'
                ) {
                    return {
                        success: true
                    };
                }
            })
            .catch(error => {
                console.log('sendResetPasswordRequest', error.response.data);

                if (
                    error.response.data.message ===
                    'The given data was invalid.'
                ) {
                    return {
                        success: false,
                        msg: error.response.data.errors.email // We can't find a user with that email address
                    };
                }

                return {
                    success: false,
                    msg: 'error'
                };
            });
    };
};

/**
 * A user is trying to login with email and password
 */
export const serverLogin = data => {
    return async dispatch => {
        dispatch({ type: SUBMIT_START });

        return await axios(URL + '/oauth/token', {
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
        })
            .then(response => {
                console.log('serverLogin', response);

                if (response.status === 200) {
                    const token = response.data.access_token;

                    try {
                        AsyncStorage.setItem('jwt', token);
                    } catch (err) {
                        console.log('serverLogin.saveJWT', err);
                    }

                    dispatch({ type: LOGIN_SUCCESS, payload: token });
                    dispatch(fetchUser(token));
                } else {
                    dispatch({ type: LOGIN_FAIL });
                }
            })
            .catch(error => {
                console.log('serverLogin.error', error);

                switch (error.response.status) {
                    case 400:
                        dispatch({ type: BAD_PASSWORD });
                        break;

                    default:
                        dispatch({ type: LOGIN_FAIL });
                        break;
                }
            });
    };
};

export const toggleUsernameModal = () => {
    return {
        type: TOGGLE_USERNAME_MODAL
    };
};

/**
 * Make an API request to fetch the current user with an access token
 *
 * Todo - move this to axios, and use await
 */
export const fetchUser = token => {
    return async dispatch => {
        await fetch(URL + '/api/user', {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
            .then(response => {
                // console.log(response);
                // console.log(response.data);
                if (response.status === 200) {
                    // console.log("=== fetchUser - 200 ===");
                    const responseJson = response
                        .text() // returns a promise
                        .then(async responseJson => {
                            // console.log('=== fetchUser - responseJson1 ===');
                            // console.log(typeof(responseJson));
                            // console.log(responseJson);
                            const userObj = JSON.parse(responseJson);
                            // console.log("User object ...", userObj);

                            await AsyncStorage.setItem(
                                'user',
                                JSON.stringify(userObj)
                            );

                            dispatch({
                                type: USER_FOUND,
                                payload: { userObj, token }
                            });

                            this.props.navigation.navigate(
                                userToken ? 'App' : 'Auth'
                            );
                        })
                        .catch(error => {
                            // console.log('fetch user - error 2');
                            // console.log(error);
                        });
                } else {
                    // response.status not 200
                    const errorJson = response.text().then(async errorJson => {
                        const errorObj = JSON.parse(errorJson);
                        // console.log('Error object');
                        // console.log(errorObj);
                    });
                }
            })
            .catch(err => {
                // console.log('error 1');
                // console.log(err);
            });
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
 * Update the username
 */
export const usernameChanged = text => {
    return {
        type: USERNAME_CHANGED,
        payload: text
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
