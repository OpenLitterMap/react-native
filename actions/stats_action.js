import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR, URL } from './types';
import axios from 'axios';

export const getStats = token => {
    return dispatch => {
        return axios({
            // url: URL + '/api/global/stats-data',
            url: 'https://openlittermap.com/api/global/stats-data',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
                Accept: 'application/json'
            }
        })
            .then(response => {
                if (response.data) {
                    dispatch({
                        type: STATS_REQUEST_SUCCESS,
                        payload: response.data
                    });
                }
            })
            .catch(error => {
                // TODO: handle error --
                console.log(error);
            });
    };
};
