import axios from 'axios';

import {URL} from './types';

export const getLeaderboardData = leaderboardData => {
    return async dispatch => {
        let response;

        try {
            response = await axios({
                url: URL + '/global/leaderboard?timeFilter=' + leaderboardData,
                method: 'GET',
                headers: {
                    Accept: 'Content-Type application/json'
                }
            });
        } catch (error) {
            console.log('getLeaderboardData', error);
        }

        if (response && response.data.success) {
            dispatch({
                type: 'UPDATE_LEADERBOARDS',
                payload: response.data
            });
        }
    };
};
