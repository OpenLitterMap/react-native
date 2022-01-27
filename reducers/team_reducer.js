import produce from 'immer';
import {
    CLEAR_TEAMS_FORM,
    JOIN_TEAM_SUCCESS,
    TEAMS_FORM_ERROR,
    TEAMS_FORM_SUCCESS,
    TEAMS_REQUEST_ERROR,
    TOP_TEAMS_REQUEST_SUCCESS,
    USER_TEAMS_REQUEST_SUCCESS,
    SET_SELECTED_TEAM
} from '../actions/types';

const INITIAL_STATE = {
    topTeams: [],
    userTeams: [],
    teamsRequestStatus: '',
    selectedTeam: {},
    teamsFormError: '',
    teamFormStatus: null // SUCCESS || ERROR
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            case CLEAR_TEAMS_FORM:
                draft.teamsFormError = '';
                draft.teamFormStatus = null;
                break;

            case TEAMS_FORM_ERROR:
                draft.teamsFormError = action.payload;

                break;
            case TEAMS_REQUEST_ERROR:
                draft.teamsRequestStatus = action.payload;
                draft.teamFormStatus = 'ERROR';

                break;

            case TEAMS_FORM_SUCCESS:
                draft.userTeams.push(action.payload);
                draft.teamFormStatus = 'SUCCESS';

                break;
            case TOP_TEAMS_REQUEST_SUCCESS:
                draft.topTeams = action.payload;

                break;

            case USER_TEAMS_REQUEST_SUCCESS:
                draft.userTeams = action.payload;

                break;

            case JOIN_TEAM_SUCCESS:
                draft.userTeams.push(action.payload.team);

                break;

            case SET_SELECTED_TEAM:
                draft.selectedTeam = action.payload;

                break;

            default:
                return draft;
        }
    });
}
