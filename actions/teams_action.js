import {
    CHANGE_ACTIVE_TEAM,
    CLEAR_TEAMS_FORM,
    JOIN_TEAM_SUCCESS,
    TEAMS_FORM_ERROR,
    TEAMS_FORM_SUCCESS,
    TEAM_TYPES,
    TEAMS_REQUEST_ERROR,
    TOP_TEAMS_REQUEST_SUCCESS,
    URL,
    USER_TEAMS_REQUEST_SUCCESS,
    SET_SELECTED_TEAM
} from './types';
import axios from 'axios';

export const clearTeamsFormError = () => {
    return {
        type: CLEAR_TEAMS_FORM
    };
};

export const createTeam = (name, identifier, token) => {
    console.log(name, identifier);
    return async dispatch => {
        // clearing form error before submitting again
        dispatch({
            type: CLEAR_TEAMS_FORM
        });
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/create',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                },
                data: {
                    name,
                    identifier,
                    team_type: 1
                }
            });
        } catch (error) {
            if (error.response) {
                let payload = 'Something went wrong, please try again';
                if (error.response?.status === 422) {
                    const errorData = error.response?.data?.errors;

                    payload = errorData?.name || errorData?.identifier;
                }

                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: payload
                });
            } else {
                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }

        if (response.data) {
            if (!response.data.success) {
                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: 'Max teams reached'
                });
            } else {
                console.log(response.data);

                dispatch({
                    type: TEAMS_FORM_SUCCESS,
                    payload: { team: response.data?.team, type: 'CREATE' }
                });
            }
        }
    };
};

export const getTopTeams = token => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/leaderboard',
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
                    type: TEAMS_REQUEST_ERROR,
                    payload: 'Something went wrong, please try again'
                });
            } else {
                dispatch({
                    type: TEAMS_REQUEST_ERROR,
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
                    type: TEAMS_REQUEST_ERROR,
                    payload: 'Something went wrong, please try again'
                });
            } else {
                dispatch({
                    type: TEAMS_REQUEST_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }

        if (response.data && response.data.success) {
            dispatch({
                type: USER_TEAMS_REQUEST_SUCCESS,
                payload: response.data.teams
            });
        }
    };
};

export const joinTeam = (token, identifier) => {
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
            if (error.response) {
                let payload = 'Something went wrong, please try again';
                if (error.response?.status === 422) {
                    const errorData = error.response?.data?.errors;
                    payload = errorData?.identifier;
                }

                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: payload
                });
            } else {
                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }
        if (response.data) {
            if (!response.data.success) {
                dispatch({
                    type: TEAMS_FORM_ERROR,
                    payload: 'Already a member'
                });
            } else {
                console.log(response.data);
                dispatch({
                    type: CHANGE_ACTIVE_TEAM,
                    payload: response.data?.activeTeam?.id
                });
                dispatch({
                    type: TEAMS_FORM_SUCCESS,
                    payload: { team: response.data?.team, type: 'JOIN' }
                });
            }
        }
    };
};

export const setSelectedTeam = teamData => {
    return {
        type: SET_SELECTED_TEAM,
        payload: teamData
    };
};
