import React from 'react';
import {
    CLOSE_SECOND_SETTING_MODAL,
    SETTINGS_INIT,
    SET_MODEL,
    SETTINGS_UPDATE_STATUS_MESSAGE,
    START_UPDATING_SETTINGS,
    TOGGLE_SETTINGS_MODAL,
    TOGGLE_SETTINGS_WAIT,
    UPDATE_SETTINGS_PROP,
    UPDATE_USER_OBJECT,
    URL_DEV,
    URL_PRODUCTION,
    URL
} from './types';
import AsyncStorage from '@react-native-community/async-storage';
import axios from 'axios';

export const closeSecondSettingModal = () => {
    return {
        type: CLOSE_SECOND_SETTING_MODAL
    };
};

/**
 * Initialize settings edit value to update
 *
 * when user selects a field to edit current value of that field is set in settingsEditProp
 * to be used as initial value in textfield in edit modal
 */
export const initalizeSettingsValue = prop => {
    return {
        type: SETTINGS_INIT,
        payload: prop
    };
};

/**
 * fn to set device modal
 */
export const setModel = model => {
    return {
        type: SET_MODEL,
        payload: model
    };
};

/**
 * Update a specific setting (Name, Username or Email)
 */
export const saveSettings = (data, value, token) => {
    return async dispatch => {
        dispatch({
            type: START_UPDATING_SETTINGS
        });

        // This needs to be refactored. We should use the same keys everywhere.
        let key = '';
        switch (data.key) {
            case 'name':
                key = 'Name';
                break;
            case 'username':
                key = 'Username';
                break;
            case 'email':
                key = 'Email';
                break;
            case 'picked_up':
                key = 'picked_up';
                break;
            case 'global_flag':
                key = 'global_flag';
                break;

            case 'tag_my_uploaded_images':
                key = 'tag_my_uploaded_images';
                break;
        }

        await axios(URL + '/api/settings/update/', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'content-type': 'application/json'
            },
            data: {
                key,
                value
            }
        })
            .then(async response => {
                console.log('saveSettings', response.data);

                if (response.data.success) {
                    // Get user and parse json to Object
                    let user = await AsyncStorage.getItem('user');
                    user = JSON.parse(user);

                    // update user object
                    user[data.key] = value;
                    // save updated user data
                    AsyncStorage.setItem('user', JSON.stringify(user));

                    dispatch({
                        type: UPDATE_USER_OBJECT,
                        payload: user
                    });
                    // then show success message

                    dispatch({
                        type: SETTINGS_UPDATE_STATUS_MESSAGE,
                        payload: 'SUCCESS'
                    });

                    // close modals - done from settings update success

                    if (key === 'tag_my_uploaded_images') {
                        if (!value) {
                            dispatch({
                                type: 'CLEAR_UPLOADED_WEB_IMAGES'
                            });
                        }
                    }
                } else {
                    console.log(
                        'ERROR updating settings. Todo - inform the user'
                    );

                    // show error message
                    dispatch({
                        type: SETTINGS_UPDATE_STATUS_MESSAGE,
                        payload: 'ERROR'
                    });
                }
            })
            .catch(error => {
                console.log('saveSettings', error);
                // show error message
                dispatch({
                    type: SETTINGS_UPDATE_STATUS_MESSAGE,
                    payload: 'ERROR'
                });
            });
    };
};

export const saveSocialAccounts = (data, value, token) => {
    let response = {};
    return async dispatch => {
        dispatch({
            type: START_UPDATING_SETTINGS
        });
        console.log({ data, value });
        try {
            response = await axios(URL + '/api/settings', {
                method: 'PATCH',
                headers: {
                    Authorization: 'Bearer ' + token,
                    'content-type': 'application/json'
                },
                data: {
                    ...value
                }
            });
        } catch (error) {
            console.log('saveSettings', error);
            // show error message
            dispatch({
                type: SETTINGS_UPDATE_STATUS_MESSAGE,
                payload: 'ERROR'
            });
        }

        console.log('saveSettings', response.data);

        if (response?.data?.message === 'success') {
            // Get user and parse json to Object
            let user = await AsyncStorage.getItem('user');
            user = JSON.parse(user);

            // update user object
            user.settings = value;
            // save updated user data
            AsyncStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: UPDATE_USER_OBJECT,
                payload: user
            });
            // then show success message

            dispatch({
                type: SETTINGS_UPDATE_STATUS_MESSAGE,
                payload: 'SUCCESS'
            });

            // close modals - done from settings update success
        } else {
            console.log('ERROR updating settings. Todo - inform the user');

            // show error message
            dispatch({
                type: SETTINGS_UPDATE_STATUS_MESSAGE,
                payload: 'ERROR'
            });
        }
    };
};
/**
 * Toggle the modal and turn one of these options for updating
 */
export const toggleSettingsModal = (id, title, key) => {
    return {
        type: TOGGLE_SETTINGS_MODAL,
        payload: { id, title, key }
    };
};

/**
 * The user wants to change one of these settings (<Switch />)
 *
 * Privacy settings
 */
export const toggleSettingsSwitch = (id, token) => {
    let endUrl = '';

    if (id === 4) endUrl = 'maps/name';
    if (id === 5) endUrl = 'maps/username';
    if (id === 6) endUrl = 'leaderboard/name';
    if (id === 7) endUrl = 'leaderboard/username';
    if (id === 8) endUrl = 'createdby/name';
    if (id === 9) endUrl = 'createdby/username';
    if (id === 10) endUrl = 'toggle-previous-tags';

    return async dispatch => {
        dispatch({
            type: TOGGLE_SETTINGS_WAIT
        });

        await axios(URL + '/api/settings/privacy/' + endUrl, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'content-type': 'application/json'
            }
        })
            .then(async response => {
                console.log('Response: toggleSettingsSwitch', response.data);

                if (response.status === 200) {
                    const key = Object.keys(response.data)[0];
                    let value = Object.values(response.data)[0];

                    //  INFO: show_name and show_username have boolean values
                    //  rest have 0 & 1

                    if (key !== 'show_name' && key !== 'show_username') {
                        value = value === false ? 0 : 1;
                    }

                    let user = await AsyncStorage.getItem('user');

                    // transform user json string into an object
                    user = JSON.parse(user);

                    user[key] = value;

                    AsyncStorage.setItem('user', JSON.stringify(user));

                    dispatch({
                        type: UPDATE_USER_OBJECT,
                        payload: user
                    });

                    dispatch({
                        type: TOGGLE_SETTINGS_WAIT
                    });
                }
            })
            .catch(error => {
                console.log('Error: toggleSettingsSwitch', error);
            });
    };
};

/**
 * User wants to change text of name, email or username
 */
export const updateSettingsProp = (value, key) => {
    return {
        type: UPDATE_SETTINGS_PROP,
        payload: key === 'social' ? value : value.text
    };
};
