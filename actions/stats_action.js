import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR } from './types';
import axios from 'axios';

export const getStats = () => {
    return dispatch => {
        return axios({
            url: 'https://openlittermap.com/countries',
            method: 'GET'
        }).then(response => {
            // console.log(JSON.stringify(resp.data, null, '\t'));
            if (response.data) {
                dispatch({
                    type: STATS_REQUEST_SUCCESS,
                    payload: response.data
                });
            }
        });
    };
};
