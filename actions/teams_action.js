import {
    JOIN_TEAM_SUCCESS,
    TEAM_TYPES,
    TEAMS_REQUEST_ERROR,
    TOP_TEAMS_REQUEST_SUCCESS,
    URL,
    USER_TEAMS_REQUEST_ERROR,
    USER_TEAMS_REQUEST_SUCCESS,
    SET_SELECTED_TEAM
} from './types';
import axios from 'axios';

export const clearTeamStatus = () => {
    return {
        type: TEAMS_REQUEST_ERROR
    };
};

export const getTeamTypes = token => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/types',
                // url: 'https://openlittermap.com/api/teams/leaderboard',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                }
            });
        } catch (error) {
            console.log(error);
            // if (error.response) {
            //     dispatch({
            //         type: TOP_TEAMS_REQUEST_ERROR,
            //         payload: 'Something went wrong, please try again'
            //     });
            // } else {
            //     dispatch({
            //         type: TOP_TEAMS_REQUEST_ERROR,
            //         payload: 'Network Error, please try again'
            //     });
            // }
            return;
        }

        if (response.data) {
            console.log(response.data);
            dispatch({
                type: TEAM_TYPES,
                payload: response.data
            });
        }
    };
};

export const getTopTeams = token => {
    console.log(token);
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/leaderboard',
                // url: 'https://openlittermap.com/api/teams/leaderboard',
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
                // dispatch({
                //     type: TOP_TEAMS_REQUEST_ERROR,
                //     payload: 'Something went wrong, please try again'
                // });
            } else {
                // dispatch({
                //     type: TOP_TEAMS_REQUEST_ERROR,
                //     payload: 'Network Error, please try again'
                // });
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
            console.log(JSON.stringify(response.data, null, 2));
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

export const setSelectedTeam = teamData => {
    return {
        type: SET_SELECTED_TEAM,
        payload: teamData
    };
};
