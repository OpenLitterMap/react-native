import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {
    URL,
    CLIENT_SECRET,
    CLIENT_ID,
    SUBMIT_START,
    SERVER_STATUS,
    EMAIL_ERROR,
    PASSWORD_ERROR,
    ACCOUNT_CREATED,
    FACEBOOK_LOGIN_SUCCESS,
    FACEBOOK_LOGIN_FAIL,
    LOGIN_OR_SIGNUP_RESET,
    EMAIL_INCORRECT,
    EMAIL_VALID,
    PASSWORD_INCORRECT,
    PASSWORD_VALID,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    SIGNUP_SUCCESS,
    SIGNUP_FAIL,
    LOGOUT,
    USER_FOUND,
    USERNAME_CHANGED,
    USERNAME_ERROR,
    TOGGLE_USERNAME_MODAL,
    STORE_CURRENT_APP_VERSION,
    ON_SEEN_FEATURE_TOUR
} from './types';
import axios from 'axios';

export const checkValidToken = token => {
    // console.log('CHECK_VALID_TOKEN', token);
    return dispatch => {
        return axios({
            url: URL + '/api/validate-token',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
            .then(response => {
                // console.log('checkValidToken.response', response);
                if (response.data.message == 'valid') {
                    return { valid: true };
                } else {
                    return { valid: false };
                }
            })
            .catch(error => {
                // console.log('axios token error', error);
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
    // console.log('auth_action - does token exist ?');
    let jwt;
    try {
        jwt = await AsyncStorage.getItem('jwt');
    } catch (e) {
        // console.log('Error getting token - check for token');
    }
    if (jwt) {
        // console.log('auth_action - token exists');
        // Dispatch an action, login success
        await dispatch({ type: LOGIN_SUCCESS, payload: jwt });
    } else {
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
                            dispatch({ type: ACCOUNT_CREATED, payload: jsonObj.success });

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

export const emailFail = text => {
    return {
        type: EMAIL_INCORRECT,
        payload: text
    };
};

export const emailValid = () => {
    // console.log('action - email is valid');
    return {
        type: EMAIL_VALID,
        payload: ''
    };
};

export const passwordFail = text => {
    return {
        type: PASSWORD_INCORRECT,
        payload: text
    };
};

export const passwordValid = () => {
    // console.log('action - password is valid');
    return {
        type: PASSWORD_VALID,
        payload: ''
    };
};

/**
 * LOG OUT
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
 * Forgot Password
 */
// export const checkForToken = () => async dispatch => {
export const sendResetPasswordRequest = email => {
    return dispatch => {
        return axios
            .post(URL + '/password/email', {
                email: email,
                api: true // we need this to override the response
            })
            .then(response => {
                // console.log('resp', response);
                // console.log('resp', response.data);
                // Success
                if (response.data == 'passwords.sent') {
                    return true;
                } else if (response.data == 'passwords.user') {
                    return 'user'; // user does not exist
                } else {
                    return false; // other problem
                }
            })
            .catch(error => {
                // console.log('axios token error', error);
                return false;
            });
    };
};

/**
 * LOG IN
 */
export const serverLogin = data => {

    return dispatch => {
        dispatch({ type: SUBMIT_START });

        fetch(URL + '/oauth/token', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'password',
                username: data.email,
                password: data.password
            })
        })
        .then(response => {
            console.log(response);
            if (response.status === 200)
            {
                console.log('=== login success 200 ===');
                const responseJson = response
                    .json() // returns a promise
                    .then(async responseJson => {
                        console.log('responseJson', responseJson);
                        let token = responseJson.access_token;
                        try {
                            console.log('Trying to save token');
                            await AsyncStorage.setItem('jwt', token);
                        } catch (err) {
                            console.log('--- error saving JWT ---');
                            // console.log(err);
                        }
                        console.log("dispatch login success");
                        dispatch({ type: LOGIN_SUCCESS, payload: token });
                        console.log('dispatch fetch user', token);
                        dispatch(fetchUser(token));
                    });
            } else {
                console.log('=== response.status fail ===');
                console.log(response);
                console.log(response.status);
                const errorJson = response.text().then(async errorJson => {
                    const errorObj = JSON.parse(errorJson);
                    console.log('-= login fail =-');
                    console.log(errorObj);
                });
                dispatch({ type: LOGIN_FAIL });
            }
        })
        .catch(error => {
            console.log('error.login', error);
            dispatch({ type: LOGIN_FAIL });
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
 */
export const fetchUser = token => {
    // console.log('fetch user.');
    return dispatch => {
        fetch(URL + '/api/user', {
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

                            await AsyncStorage.setItem('user', JSON.stringify(userObj));

                            dispatch({ type: USER_FOUND, payload: { userObj, token } });

                            this.props.navigation.navigate(userToken ? 'App' : 'Auth');
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
