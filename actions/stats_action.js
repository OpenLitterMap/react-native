import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR, URL } from './types';
import axios from 'axios';

export const getStats = () => {
    return async dispatch => {
        let response;
        try {
            response = await axios({
                url: URL + '/api/global/stats-data',
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });
        } catch (error) {
            console.log(error);
            if (error.response) {
                dispatch({
                    type: STATS_REQUEST_ERROR,
                    payload: 'Something went wrong, please try again'
                });
            } else {
                dispatch({
                    type: STATS_REQUEST_ERROR,
                    payload: 'Network Error, please try again'
                });
            }
            return;
        }

        if (response.data) {
            dispatch({
                type: STATS_REQUEST_SUCCESS,
                payload: response.data
            });
        }
    };
};
