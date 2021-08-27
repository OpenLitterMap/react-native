import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR, URL } from './types';
import axios from 'axios';

export const getStats = () => {
    return dispatch => {
        return axios({
            url: URL + '/api/v2/global/stats-data',
            method: 'GET'
        })
            .then(response => {
                console.log(
                    'get_countries',
                    JSON.stringify(response.data, null, '\t')
                );
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
