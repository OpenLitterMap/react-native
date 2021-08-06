import { STATS_REQUEST_SUCCESS, STATS_REQUEST_ERROR } from '../actions/types';

const INITIAL_STATE = {
    globalLeaders: [],
    totalLitter: 0,
    totalPhotos: 0,
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
            const globalLeaders = JSON.parse(action.payload?.globalLeaders);
            const totalLitter = action.payload?.total_litter;
            const totalPhotos = action.payload?.total_photos;
            const totalLittercoin = parseInt(action.payload?.littercoin);
            const litterTarget = {
                previousTarget: action.payload.previousXp,
                nextTarget: action.payload.nextXp
            };
            return {
                ...state,
                globalLeaders,
                totalLitter,
                totalPhotos,
                totalLittercoin,
                litterTarget
            };

        default:
            return state;
    }
}
