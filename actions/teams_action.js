import {
    JOIN_TEAM_SUCCESS,
    TOP_TEAMS_REQUEST_SUCCESS,
    TOP_TEAMS_REQUEST_ERROR,
    URL,
    USER_TEAMS_REQUEST_ERROR,
    USER_TEAMS_REQUEST_SUCCESS
} from './types';
import axios from 'axios';

export const getTopTeams = () => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/leaderboard',
                // url: 'https://openlittermap.com/api/teams/leaderboard',
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });
        } catch (error) {
            console.log(error);
            if (error.response) {
                dispatch({
                    type: TOP_TEAMS_REQUEST_ERROR,
                    payload: 'Something went wrong, please try again'
                });
            } else {
                dispatch({
                    type: TOP_TEAMS_REQUEST_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }

        if (response.data) {
            // const topFiveTeams =
            //     response.data.length >= 5 && response.data.slice(0, 5);
            dispatch({
                type: TOP_TEAMS_REQUEST_SUCCESS,
                payload: response.data
            });
        }
    };
};

export const getUserTeams = token => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/list',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                }
            });
        } catch (error) {
            console.log(error);
            if (error.response) {
                dispatch({
                    type: USER_TEAMS_REQUEST_ERROR,
                    payload: 'Something went wrong, please try again'
                });
            } else {
                dispatch({
                    type: USER_TEAMS_REQUEST_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }

        if (response.data) {
            dispatch({
                type: USER_TEAMS_REQUEST_SUCCESS,
                payload: response.data
            });
        }
    };
};

export const joinTeam = (token, identifier) => {
    console.log({ token, identifier });
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/join',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                },
                data: {
                    identifier
                }
            });
        } catch (error) {
            console.log(error);
            // if (error.response) {
            //     dispatch({
            //         type: USER_TEAMS_REQUEST_ERROR,
            //         payload: 'Something went wrong, please try again'
            //     });
            // } else {
            //     dispatch({
            //         type: USER_TEAMS_REQUEST_ERROR,
            //         payload: 'Network Error, please try again'
            //     });
            // }
            return;
        }

        if (response.data) {
            console.log(response.data);
            dispatch({
                type: JOIN_TEAM_SUCCESS,
                payload: response.data
            });
        }
    };
};
