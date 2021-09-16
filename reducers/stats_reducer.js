import AsyncStorage from '@react-native-community/async-storage';
import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR } from '../actions/types';

const INITIAL_STATE = {
    statsErrorMessage: null,
    totalLitter: 0,
    totalPhotos: 0,
    totalUsers: 0,
    totalLittercoin: 0,
    litterTarget: {
        previousTarget: 0,
        nextTarget: 0
    }
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case STATS_REQUEST_SUCCESS:
            // console.log(JSON.stringify(action.payload, null, '\t'));
            const totalLitter = action.payload?.total_litter;
            const totalPhotos = action.payload?.total_photos;
            const totalUsers = action.payload?.total_users;
            const totalLittercoin = parseInt(action.payload?.littercoin);
            const litterTarget = {
                previousTarget: action.payload.previousXp,
                nextTarget: action.payload.nextXp
            };
            const targetPercentage =
                ((totalLitter - litterTarget.previousTarget) /
                    (litterTarget.nextTarget - litterTarget.previousTarget)) *
                100;

            AsyncStorage.setItem(
                'globalStats',
                JSON.stringify({
                    totalLitter,
                    totalPhotos,
                    totalUsers,
                    totalLittercoin,
                    litterTarget,
                    targetPercentage
                })
            );
            return {
                ...state,
                totalLitter,
                totalPhotos,
                totalUsers,
                totalLittercoin,
                litterTarget,
                targetPercentage,
                statsErrorMessage: null
            };
        case STATS_REQUEST_ERROR:
            return {
                ...state,
                statsErrorMessage: action.payload
            };
        default:
            return state;
    }
}
