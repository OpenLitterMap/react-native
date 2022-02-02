import {
    CHANGE_ACTIVE_TEAM,
    CLEAR_TEAMS_FORM,
    LEAVE_TEAM,
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

export const changeActiveTeam = (token, teamId) => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/active',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                },
                data: {
                    team_id: teamId
                }
            });
        } catch (error) {
            console.log(error);
            // if (error.response) {
            //     let payload = 'Something went wrong, please try again';
            //     if (error.response?.status === 422) {
            //         const errorData = error.response?.data?.errors;

            //         payload = errorData?.name || errorData?.identifier;
            //     }

            //     dispatch({
            //         type: TEAMS_FORM_ERROR,
            //         payload: payload
            //     });
            // } else {
            //     dispatch({
            //         type: TEAMS_FORM_ERROR,
            //         payload: 'Network Error, please try again'
            //     });
            // }
            return;
        }

        if (response.data) {
            if (!response.data.success) {
                // dispatch({
                //     type: TEAMS_FORM_ERROR,
                //     payload: 'Max teams reached'
                // });
            } else {
                // change active team in user object
                dispatch({
                    type: CHANGE_ACTIVE_TEAM,
                    payload: response.data?.team?.id
                });
                // dispatch({
                //     type: TEAMS_FORM_SUCCESS,
                //     payload: { team: response.data?.team, type: 'CREATE' }
                // });
                return;
            }
        }
    };
};
/**
 * clears JOIN and CREATE team form errors
 * and resets status
 */
export const clearTeamsFormError = () => {
    return {
        type: CLEAR_TEAMS_FORM
    };
};

/**
 * fn to create team
 * 422 error if identifier already taken
 *
 * if success change active team in user state
 * add new team object to userTeams
 *
 * @param {string} name - name of the team
 * @param {string} identifier - unique identifier for creating team
 * @param {*} token
 * @returns
 */
export const createTeam = (name, identifier, token) => {
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
                // change active team in user object
                dispatch({
                    type: CHANGE_ACTIVE_TEAM,
                    payload: response.data?.team?.id
                });
                dispatch({
                    type: TEAMS_FORM_SUCCESS,
                    payload: { team: response.data?.team, type: 'CREATE' }
                });
            }
        }
    };
};

export const inactivateTeam = token => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/inactivate',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                }
            });
        } catch (error) {
            console.log(error);

            return;
        }

        if (response.data) {
            console.log(response.data);
            if (!response.data.success) {
                // dispatch({
                //     type: TEAMS_FORM_ERROR,
                //     payload: 'Max teams reached'
                // });
            } else {
                // change active team in user object
                dispatch({
                    type: CHANGE_ACTIVE_TEAM,
                    payload: null
                });
                // dispatch({
                //     type: TEAMS_FORM_SUCCESS,
                //     payload: { team: response.data?.team, type: 'CREATE' }
                // });
                return;
            }
        }
    };
};
/**
 * leave team
 *
 * if success change active team in user state
 * remove team object from userTeams
 *
 * @param {*} token
 * @param {string} teamId - identifier of a team
 * @returns
 */
export const leaveTeam = (token, teamId) => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/teams/leave',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                },
                data: {
                    team_id: teamId
                }
            });
        } catch (error) {
            console.log(error.response);
            return;
        }

        if (response.data) {
            if (response.data?.activeTeam) {
                dispatch({
                    type: CHANGE_ACTIVE_TEAM,
                    payload: response.data?.activeTeam?.id
                });
            }

            dispatch({
                type: LEAVE_TEAM,
                payload: response.data.team
            });
        }
    };
};

/**
 * fn to get top teams
 *
 * @param {*} token
 */
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
            dispatch({
                type: TOP_TEAMS_REQUEST_SUCCESS,
                payload: response.data
            });
        }
    };
};

/**
 * fn to get users teams
 * @param {*} token
 */
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

/**
 * fn to join new team
 * @param {*} token
 * @param {string} identifier - unique identifier for joining team
 */

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
                    payload: 'You have already joined this team.'
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

/**
 * fn to set selected team for showing in team details screen
 *
 * @param {object} teamData - the team object
 */
export const setSelectedTeam = teamData => {
    return {
        type: SET_SELECTED_TEAM,
        payload: teamData
    };
};
