import produce from 'immer';
import {
    JOIN_TEAM_SUCCESS,
    TEAMS_REQUEST_ERROR,
    TOP_TEAMS_REQUEST_SUCCESS,
    USER_TEAMS_REQUEST_SUCCESS
} from '../actions/types';

const INITIAL_STATE = {
    topTeams: [],
    userTeams: [],
    teamsRequestStatus: ''
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            case TEAMS_REQUEST_ERROR:
                draft.teamsRequestStatus = action.payload;

                break;
            case TOP_TEAMS_REQUEST_SUCCESS:
                draft.topTeams = action.payload;

                break;

            case USER_TEAMS_REQUEST_SUCCESS:
                draft.userTeams = action.payload;
                draft.teamsRequestStatus = 'SUCCESS';

                break;

            case JOIN_TEAM_SUCCESS:
                draft.userTeams.push(action.payload.team);
                draft.teamsRequestStatus = 'SUCCESS';

                break;

            default:
                return draft;
        }
    });
}
