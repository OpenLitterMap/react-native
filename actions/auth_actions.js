import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import {
    URL,
    CLIENT_SECRET,
    CLIENT_ID,
    CHANGE_LANG,
    SUBMIT_START,
    SERVER_STATUS,
    ACCOUNT_CREATED,
    LOGIN_OR_SIGNUP_RESET,
    EMAIL_INCORRECT,
    EMAIL_VALID,
    PASSWORD_INCORRECT,
    PASSWORD_VALID,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    USER_FOUND,
    USERNAME_CHANGED,
    TOGGLE_USERNAME_MODAL,
    STORE_CURRENT_APP_VERSION,
    ON_SEEN_FEATURE_TOUR
} from './types';
import axios from 'axios';

export const changeLang = lang => {
    return {
        type: CHANGE_LANG,
        payload: lang
    };
}

/**
 * Check if the token is valid
 *
 * It will return "valid" if the user is logged in
 *
 * Or  "Unauthenticated." if they are logged out / not valid
 *
 *
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiOTEwOTkyMDM3ZTY1OTg4MTYxNDI1NWVmMzg1OTgxZTgxNWNhMzE5NWVhYzQ0ZGJmNDMwMmMzZDc4NTdmYmMyYWQ0MzY4YjBlOWQ4OWRmNjQiLCJpYXQiOjE2MjQ0ODQ0NjgsIm5iZiI6MTYyNDQ4NDQ2OCwiZXhwIjoxNjU2MDIwNDY3LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.R-eu6xMNvTwEo7tPTb1v1DdWgS_9iNbRIKq0mZdoVnTGFWGXwyDf3_LkpUdeQJ3vAZXpqNCMRVVD_hprQ0chPX8dLFpjTTsPh2-NQzejOwsZmaB8uARExC49UtRgMKFXpQvGUd8shC6p5BxmfMXh89N2pCxoMXSmJrUlRz0XgNX1ZmeXNbFDFDV3Jlyc11rlQEuzeURYL9XWbg-KXSL5YFplskNZizA9iT3_uGVZoLDPC3Jnc1jW7V02C8tXJzxQM2TjqE2AWoCdcyJUEFUkFCwRIA05r42DLkSQskGUgOpDZK5Mi-SDRpAXN3p28z3mfKD3M5-ZZy2-Kb7AfCB8gpTqeQE4QSOGEk-FWgUU2BVJlnIrGtkO8uuiRuYTPOVeUtoDSunVmHJfgvw0hakn770DJe-7o-z_jz-XlnBHzvGPMYha4oVrqpJ7Dq9O0XISmavYuUaY2igLJWS-gP_FVOJv0H9TwQRoS1zFunEO3e97s-ntlKvY6BG9-wJRJAQTZT6qPymJyxLfo0-wlQVXnbR9hklmlvegvXaY0-87kXZBq2qPrlMc-1VOyumJIdTtHvn5B57HLIskSierze1Sk8g3S5MLMkROV5rbTxjoxgDvUAc7PmyOLsDnC6krTb9pC_1xbLnPF5gnlW9XInhvuQl9ezoRNmC8JeZa1HdA5BI
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiOTEwOTkyMDM3ZTY1OTg4MTYxNDI1NWVmMzg1OTgxZTgxNWNhMzE5NWVhYzQ0ZGJmNDMwMmMzZDc4NTdmYmMyYWQ0MzY4YjBlOWQ4OWRmNjQiLCJpYXQiOjE2MjQ0ODQ0NjgsIm5iZiI6MTYyNDQ4NDQ2OCwiZXhwIjoxNjU2MDIwNDY3LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.R-eu6xMNvTwEo7tPTb1v1DdWgS_9iNbRIKq0mZdoVnTGFWGXwyDf3_LkpUdeQJ3vAZXpqNCMRVVD_hprQ0chPX8dLFpjTTsPh2-NQzejOwsZmaB8uARExC49UtRgMKFXpQvGUd8shC6p5BxmfMXh89N2pCxoMXSmJrUlRz0XgNX1ZmeXNbFDFDV3Jlyc11rlQEuzeURYL9XWbg-KXSL5YFplskNZizA9iT3_uGVZoLDPC3Jnc1jW7V02C8tXJzxQM2TjqE2AWoCdcyJUEFUkFCwRIA05r42DLkSQskGUgOpDZK5Mi-SDRpAXN3p28z3mfKD3M5-ZZy2-Kb7AfCB8gpTqeQE4QSOGEk-FWgUU2BVJlnIrGtkO8uuiRuYTPOVeUtoDSunVmHJfgvw0hakn770DJe-7o-z_jz-XlnBHzvGPMYha4oVrqpJ7Dq9O0XISmavYuUaY2igLJWS-gP_FVOJv0H9TwQRoS1zFunEO3e97s-ntlKvY6BG9-wJRJAQTZT6qPymJyxLfo0-wlQVXnbR9hklmlvegvXaY0-87kXZBq2qPrlMc-1VOyumJIdTtHvn5B57HLIskSierze1Sk8g3S5MLMkROV5rbTxjoxgDvUAc7PmyOLsDnC6krTb9pC_1xbLnPF5gnlW9XInhvuQl9ezoRNmC8JeZa1HdA5BI
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiOTEwOTkyMDM3ZTY1OTg4MTYxNDI1NWVmMzg1OTgxZTgxNWNhMzE5NWVhYzQ0ZGJmNDMwMmMzZDc4NTdmYmMyYWQ0MzY4YjBlOWQ4OWRmNjQiLCJpYXQiOjE2MjQ0ODQ0NjgsIm5iZiI6MTYyNDQ4NDQ2OCwiZXhwIjoxNjU2MDIwNDY3LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.R-eu6xMNvTwEo7tPTb1v1DdWgS_9iNbRIKq0mZdoVnTGFWGXwyDf3_LkpUdeQJ3vAZXpqNCMRVVD_hprQ0chPX8dLFpjTTsPh2-NQzejOwsZmaB8uARExC49UtRgMKFXpQvGUd8shC6p5BxmfMXh89N2pCxoMXSmJrUlRz0XgNX1ZmeXNbFDFDV3Jlyc11rlQEuzeURYL9XWbg-KXSL5YFplskNZizA9iT3_uGVZoLDPC3Jnc1jW7V02C8tXJzxQM2TjqE2AWoCdcyJUEFUkFCwRIA05r42DLkSQskGUgOpDZK5Mi-SDRpAXN3p28z3mfKD3M5-ZZy2-Kb7AfCB8gpTqeQE4QSOGEk-FWgUU2BVJlnIrGtkO8uuiRuYTPOVeUtoDSunVmHJfgvw0hakn770DJe-7o-z_jz-XlnBHzvGPMYha4oVrqpJ7Dq9O0XISmavYuUaY2igLJWS-gP_FVOJv0H9TwQRoS1zFunEO3e97s-ntlKvY6BG9-wJRJAQTZT6qPymJyxLfo0-wlQVXnbR9hklmlvegvXaY0-87kXZBq2qPrlMc-1VOyumJIdTtHvn5B57HLIskSierze1Sk8g3S5MLMkROV5rbTxjoxgDvUAc7PmyOLsDnC6krTb9pC_1xbLnPF5gnlW9XInhvuQl9ezoRNmC8JeZa1HdA5BI", "
 * expires_in": 31535999,
 * "refresh_token": "def5020054dce8fded5ecd96d616d0c3d5a23ac7a9e786e997dad6895d025271e9c58df33895622f6218c839fdb0373d9c9d6f364a5861e6bceb312e231ad52c380e3827bdcd7ffc5cce277d81e757660f38b47ffa19adc6333ac8bfc034542cc133c7fac7518063f6c66f40f3a7c08b2e3b0d53b1f4701f5ac2a3895f0c213f099e055bd8250e3d7b98fc92f98802a923fa32b67f7e38c93e3fe35e4ddf41e4c77ca9585acd8f4d42d2c9c2bc5af41bce79354cd4f24ff5caa7e5054a398f4604d3c7f53f615bda1c517d29ec66afa8a4e292991c6453de2b6ff9e9a39078b876ff90c21aec7f26bca089ebb817446ac260568c6956aac235ad602f5821e95d8940bdbe152edbcd1dd413de02fc7ad38d210a2c0bf705d177743c3ab608788ea430e1f4729b96831dbebde20f1dae9c0cd053c4ca13d158de1512e6ec7300e6274c7c9bdc2b3d24a1cace6c3979d62f39cac4a87b7be1582bc151005a7697bec3
 *
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjdiNmVmOGI5ZjQxNWRhZDIzZmNhZWYzODRkYmUwNzI3MGE2NWUxOWIwYzE5MDgwYzUyNzU0MmVhYjQyNjBlY2RjZWY2NWY5Yzg4YjU1MzUiLCJpYXQiOjE2MjQ0MDc4NjMsIm5iZiI6MTYyNDQwNzg2MywiZXhwIjoxNjU1OTQzODYzLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.jebw7GotSkm92JfP5hA_WhBLAHYS8p5Uwe5T_Kr2uU5-OpMGhRqG32p4VmgoWix8KGdBJu5Hi6o6PrPCcDhXoKyotszALgU1G8PLL0ByYNwz2iFbbYq2u5mtv3G8m3lal4fC4-IJyLLl-0KXW5PFQQTFi7mp0KbvoNF8hZZ00zgw4n3wY_VtmBlgdEh-Ew0TFmF4NhsUd3A0TVFK4DwrQdmvTq2sUgM8an2WulH5S-QIoZzTmlXw-UAPbhZ6tXYWwVVbHMo2fb3gZHKMdXlJOT5IowDesp9TEeTeSgKv9mywx9tRWP2rsXdXj6prEoco5xBHj3Hl5KFvQCHzSHT76ujUtGeSYpP3IphYi1S6r0B1Ts93JCbKe6OJCMWjZgclsAno1z-21HC-n1J9vDIEozXDRgfDkxF1ciPHJfVJbHyRnJr8tyQgr-TJQ2Q9-lQBZluy6CYLtH-QeZaqmX_lo76RomxYvzJFFzyNmJFfSnMawTz7BBUef6_FYKVu7mDvmXiVbb7pJ2pkEE7AfvKMyXeLy4LJvA7FdZ-3jB8TH4lzVRpe4MB9s7WN4xWGpsw5_v2MRBxnEnYLuSOYIOpl-lBpDINXpkbFBdA3ZnXHMJ0uUG49x4xuKWwA71PqphAqQ0IuZoU1NLpWKjJWeNXTNkN_h3hTGH7EfjZSN87nMcQ
 * eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjdiNmVmOGI5ZjQxNWRhZDIzZmNhZWYzODRkYmUwNzI3MGE2NWUxOWIwYzE5MDgwYzUyNzU0MmVhYjQyNjBlY2RjZWY2NWY5Yzg4YjU1MzUiLCJpYXQiOjE2MjQ0MDc4NjMsIm5iZiI6MTYyNDQwNzg2MywiZXhwIjoxNjU1OTQzODYzLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.jebw7GotSkm92JfP5hA_WhBLAHYS8p5Uwe5T_Kr2uU5-OpMGhRqG32p4VmgoWix8KGdBJu5Hi6o6PrPCcDhXoKyotszALgU1G8PLL0ByYNwz2iFbbYq2u5mtv3G8m3lal4fC4-IJyLLl-0KXW5PFQQTFi7mp0KbvoNF8hZZ00zgw4n3wY_VtmBlgdEh-Ew0TFmF4NhsUd3A0TVFK4DwrQdmvTq2sUgM8an2WulH5S-QIoZzTmlXw-UAPbhZ6tXYWwVVbHMo2fb3gZHKMdXlJOT5IowDesp9TEeTeSgKv9mywx9tRWP2rsXdXj6prEoco5xBHj3Hl5KFvQCHzSHT76ujUtGeSYpP3IphYi1S6r0B1Ts93JCbKe6OJCMWjZgclsAno1z-21HC-n1J9vDIEozXDRgfDkxF1ciPHJfVJbHyRnJr8tyQgr-TJQ2Q9-lQBZluy6CYLtH-QeZaqmX_lo76RomxYvzJFFzyNmJFfSnMawTz7BBUef6_FYKVu7mDvmXiVbb7pJ2pkEE7AfvKMyXeLy4LJvA7FdZ-3jB8TH4lzVRpe4MB9s7WN4xWGpsw5_v2MRBxnEnYLuSOYIOpl-lBpDINXpkbFBdA3ZnXHMJ0uUG49x4xuKWwA71PqphAqQ0IuZoU1NLpWKjJWeNXTNkN_h3hTGH7EfjZSN87nMcQ
 *
 *
 */
export const checkValidToken = token => {
    console.log({ token });
    return async dispatch => {
        await axios({
            url: URL + '/api/validate-token',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('checkValidToken.response', response.data);

            if (response.data.hasOwnProperty('message') && response.data.message === 'valid')
            {
                dispatch({
                    type: 'TOKEN_IS_VALID',
                    payload: true
                });
            }
        })
        .catch(error => {
            console.log('auth_actions.checkValidToken', error.response.data);

            if (error.response.data.message === "Unauthenticated.")
            {
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
 *
 */
export const serverLogin = data => {

    return (dispatch) => {
        dispatch({ type: SUBMIT_START });

        return axios(URL + '/oauth/token', {
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

            if (response.status === 200)
            {
                // get 1st element when using api/oauth/token
                const token = response.data.access_token;

                console.log("SAVE NEW TOKEN", token);

                try
                {
                    AsyncStorage.setItem('jwt', token);
                }
                catch (err)
                {
                    console.log('serverLogin.saveJWT', err);
                }

                dispatch({ type: LOGIN_SUCCESS, payload: token });
                dispatch(fetchUser(token));
            }
            else
            {
                dispatch({ type: LOGIN_FAIL });
            }
        })
        .catch(error => {
            console.log('serverLogin.error', error);
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
