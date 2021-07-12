import React from 'react';
import {
    CLOSE_ALL_SETTINGS_MODALS,
    CLOSE_SECOND_SETTING_MODAL,
    SAVE_SETTING,
    SETTINGS_INIT,
    SET_MODEL,
    SETTINGS_UPDATE_SUCCESS,
    START_UPDATING_SETTINGS,
    TOGGLE_SETTINGS_MODAL,
    TOGGLE_SECOND_SETINGS_MODAL,
    TOGGLE_SETTINGS_SWITCH,
    TOGGLE_SETTINGS_WAIT,
    UPDATE_SETTINGS_PROP,
    UPDATE_USER_OBJECT,
    URL_DEV,
    URL_PRODUCTION,
    URL
} from './types';
import AsyncStorage from '@react-native-community/async-storage';
import axios from 'axios';

/**
 * Close All Settings' Modals
 */
export const closeAllSettingModals = () => {
    return {
        type: CLOSE_ALL_SETTINGS_MODALS
    };
};

export const closeSecondSettingModal = () => {
    return {
        type: CLOSE_SECOND_SETTING_MODAL
    };
};

/**
 * Initialize settings edit value to update
 */
export const initalizeSettingsValue = prop => {
    return {
        type: SETTINGS_INIT,
        payload: prop
    };
};

/**
 * Set Model
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
        // turn on loading symbol for second inner modal
        // type: TOGGLE_SECOND_SETINGS_MODAL
        dispatch({
            type: START_UPDATING_SETTINGS
        });

        let dataToSend = {};
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
        }
        dataToSend[key] = value;
        await axios(URL + `/api/settings/update/${key}`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token,
                'content-type': 'application/json'
            },
            data: dataToSend
        })
            .then(async response => {
                console.log('saveSettings', response.data.success);

                console.log(response.data);
                if (response.data) {
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
                    // console.log("Show success message - another modal???");
                    dispatch({
                        type: SETTINGS_UPDATE_SUCCESS
                    });

                    // close modals - done from settings update success
                } else {
                    console.log(
                        'ERROR updating settings. Todo - inform the user'
                    );

                    // Todo - Change this to a failure message
                    dispatch({
                        type: SETTINGS_UPDATE_SUCCESS
                    });
                }
            })
            .catch(error => {
                console.log('saveSettings', error);
            });
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
                    const value = Object.values(response.data)[0];

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
export const updateSettingsProp = value => {
    return {
        type: UPDATE_SETTINGS_PROP,
        payload: value.text
    };
};
