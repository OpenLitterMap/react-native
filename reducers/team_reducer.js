import produce from 'immer';
import {
    TOP_TEAMS_REQUEST_SUCCESS,
    TOP_TEAMS_REQUEST_ERROR,
    USER_TEAMS_REQUEST_SUCCESS,
    USER_TEAMS_REQUEST_ERROR
} from '../actions/types';

const INITIAL_STATE = {
    topTeams: [],
    userTeams: []
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            case TOP_TEAMS_REQUEST_SUCCESS:
                draft.topTeams = action.payload;

                break;

            case USER_TEAMS_REQUEST_SUCCESS:
                draft.userTeams = action.payload;

                break;

            default:
                return draft;
        }
    });
}
