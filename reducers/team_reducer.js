import { produce } from 'immer';
import {
    CLEAR_TEAMS_FORM,
    LEAVE_TEAM,
    LOAD_TEAM_MEMBERS_SUCCESS,
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
    teamMembers: [],
    teamsRequestStatus: '',
    selectedTeam: {},
    teamsFormError: '',
    teamFormStatus: null, // SUCCESS || ERROR
    successMessage: '',
    memberNextPage: 1
};

export default function(state = INITIAL_STATE, action) {
    return produce(state, draft => {
        switch (action.type) {
            /**
             * clears all team form status and messages
             */
            case CLEAR_TEAMS_FORM:
                draft.teamsFormError = '';
                draft.successMessage = '';
                draft.teamFormStatus = null;
                break;

            /**
             * find team by index and remove from userTeams array
             */
            case LEAVE_TEAM:
                const index = draft.userTeams.findIndex(
                    team => team.id === action.payload?.id
                );
                if (index !== -1) {
                    draft.userTeams.splice(index, 1);
                }

                break;

            case LOAD_TEAM_MEMBERS_SUCCESS:
                draft.teamMembers.push(...action.payload.data);
                const nextPage = action.payload.next_page_url;

                draft.memberNextPage =
                    nextPage !== null ? nextPage.split('=')[1] : null;

                break;

            /**
             * add error messages of team forms --> JOIN/CREATE
             */
            case TEAMS_FORM_ERROR:
                draft.teamsFormError = action.payload;
                break;

            /**
             * error message for user & top team request
             */
            case TEAMS_REQUEST_ERROR:
                draft.teamsRequestStatus = action.payload;
                draft.teamFormStatus = 'ERROR';
                break;

            /**
             * push new team to userTeams array
             * and add success message
             */
            case TEAMS_FORM_SUCCESS:
                draft.userTeams.push(action.payload.team);
                draft.teamFormStatus = 'SUCCESS';
                action.payload.type === 'JOIN'
                    ? (draft.successMessage =
                          'Congrats! you have joined a new team')
                    : (draft.successMessage =
                          'Congrats! you created a new team');
                break;

            /**
             * add top teams to topTeams array
             */
            case TOP_TEAMS_REQUEST_SUCCESS:
                draft.topTeams = action.payload;
                break;

            /**
             * add users teams to userTeams array
             */
            case USER_TEAMS_REQUEST_SUCCESS:
                draft.userTeams = action.payload;
                break;

            /**
             * set selected team for showing in team details screen
             */
            case SET_SELECTED_TEAM:
                draft.teamMembers = [];
                draft.selectedTeam = action.payload;
                draft.memberNextPage = 1;
                draft.teamMembers = [];
                break;

            default:
                return draft;
        }
    });
}
