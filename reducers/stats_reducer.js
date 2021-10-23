import produce from 'immer';
import AsyncStorage from '@react-native-community/async-storage';
import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR } from '../actions/types';

const INITIAL_STATE = {
    statsErrorMessage: null,
    totalLitter: 0,
    totalPhotos: 0,
    totalUsers: 0,
    totalLittercoin: 0,
    targetPercentage: 0,
    litterTarget: {
        previousTarget: 0,
        nextTarget: 0
    }
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             *
             */
            case STATS_REQUEST_SUCCESS:
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
                        (litterTarget.nextTarget -
                            litterTarget.previousTarget)) *
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

                draft.totalLitter = totalLitter;
                draft.totalPhotos = totalPhotos;
                draft.totalUsers = totalUsers;
                draft.totalLittercoin = totalLittercoin;
                draft.litterTarget = litterTarget;
                draft.targetPercentage = targetPercentage;
                draft.statsErrorMessage = null;

                break;

            case STATS_REQUEST_ERROR:
                draft.statsErrorMessage = action.payload;

                break;

            default:
                return draft;
        }
    });
}
