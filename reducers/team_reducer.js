import axios from "axios";
import { URL } from "../actions/types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {changeUsersActiveTeam} from "./auth_reducer";

const initialState = {
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

/**
 * API Requests
 *
 * - changeActiveTeam
 * - createTeam
 * - inactivateTeam
 * - leaveTeam
 * - getTeamMembers
 * - getTopTeams
 * - getUserTeams
 * - joinTeam
 */

export const changeActiveTeam = createAsyncThunk(
    'teams/changeActiveTeam',
    async ({ token, teamId }, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios({
                url: `${URL}/api/teams/active`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                },
                data: {
                    team_id: teamId
                }
            });

            // check this
            if (!response.data?.success) {
                return rejectWithValue('Max teams reached');
            }

            if (response.data?.team?.id)
            {
                dispatch(changeUsersActiveTeam(response.data.team.id));

                // dispatch TeamsFormSuccess

                return response.data.team.id;
            }

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createTeam = createAsyncThunk(
    'teams/createTeam',
    async ({ name, identifier, token }, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: `${URL}/api/teams/create`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    name,
                    identifier,
                    team_type: 1
                }
            });

            if (!response.data.success) {
                return rejectWithValue('Max teams reached');
            }

            return {
                team: response.data.team,
                type: 'CREATE'
            };
        }
        catch (error)
        {
            if (error.response && error.response.status === 422) {
                const errorData = error.response.data.errors;

                const msg = errorData.name?.[0] || errorData.identifier?.[0] || 'Validation error';
                return rejectWithValue(msg);
            }

            return rejectWithValue('Network Error, please try again');
        }
    }
);

export const inactivateTeam = createAsyncThunk(
    'teams/inactivateTeam',
    async (token, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios({
                url: `${URL}/api/teams/inactivate`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data.success) {
                return rejectWithValue('Max teams reached');
            }

            dispatch(changeUsersActiveTeam(null));

            // dispatch TeamsFormSuccess

            return true;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.message);
        }
    }
);

export const leaveTeam = createAsyncThunk(
    'teams/leaveTeam',
    async ({ token, teamId }, { rejectWithValue, dispatch }) => {
        try
        {
            const response = await axios({
                url: `${URL}/api/teams/leave`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    team_id: teamId
                }
            });

            if (!response.data) {
                return rejectWithValue('Failed to leave the team');
            }

            if (response.data?.activeTeam) {
                dispatch(changeUsersActiveTeam(response.data.activeTeam.id));
            }

            // Returning the entire response data or just necessary parts for reducer logic
            return {
                activeTeamID: response.data.activeTeam ? response.data.activeTeam.id : null,
                team: response.data.team
            };
        }
        catch (error)
        {
            // console.error(error.response || error);
            return rejectWithValue('Error while trying to leave the team');
        }
    }
);

export const getTeamMembers = createAsyncThunk(
    'teams/getTeamMembers',
    async ({ token, teamId, page = 1 }, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: `${URL}/api/teams/members`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                params: {
                    team_id: teamId,
                    page
                }
            });

            if (!response.data) {
                return rejectWithValue('No data received');
            }

            return response.data.result;
        } catch (error) {
            // console.error(error);
            return rejectWithValue('Error fetching team members');
        }
    }
);

export const getTopTeams = createAsyncThunk(
    'teams/getTopTeams',
    async (token, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: `${URL}/api/teams/leaderboard`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data) {
                return rejectWithValue('No data received');
            }

            return response.data;
        } catch (error) {
            if (error.response) {
                return rejectWithValue('Something went wrong, please try again');
            } else {
                return rejectWithValue('Network Error, please try again');
            }
        }
    }
);

export const getUserTeams = createAsyncThunk(
    'teams/getUserTeams',
    async (token, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: URL + '/api/teams/list',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            if (response.data && response.data.success) {
                return response.data.teams;
            } else {
                return rejectWithValue('Something went wrong, please try again');
            }
        } catch (error) {
            if (error.response) {
                return rejectWithValue('Something went wrong, please try again');
            } else {
                return rejectWithValue('Network Error, please try again');
            }
        }
    }
);

export const joinTeam = createAsyncThunk(
    'teams/joinTeam',
    async ({ token, identifier }, { rejectWithValue }) => {
        try {
            const response = await axios({
                url: URL + '/api/teams/join',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    Accept: 'application/json',
                    'content-type': 'application/json'
                },
                data: {
                    identifier
                }
            });
            if (response.data) {
                if (!response.data.success) {
                    return rejectWithValue('You have already joined this team.');
                } else {
                    return {
                        activeTeamId: response.data?.activeTeam?.id,
                        team: response.data?.team,
                        type: 'JOIN'
                    };
                }
            }
        } catch (error) {
            if (error.response) {
                let payload = 'Something went wrong, please try again';
                if (error.response?.status === 422) {
                    const errorData = error.response?.data?.errors;
                    payload = errorData?.identifier?.[0] || 'Validation error';
                }
                return rejectWithValue(payload);
            } else {
                return rejectWithValue('Network Error, please try again');
            }
        }
    }
);

const teamSlice = createSlice({

    name: 'team',

    initialState,

    reducers: {

        clearTeamsForm (state) {
            state.teamsFormError = '';
            state.successMessage = '';
            state.teamFormStatus = null;
        },

        // /**
        //  * find team by index and remove from userTeams array
        //  */
        // leaveTeamReducer (state, action) {
        //     const index = state.userTeams.findIndex(team => team.id === action.payload?.id);
        //
        //     if (index !== -1) {
        //         state.userTeams.splice(index, 1);
        //     }
        // },

        // /**
        //  * add error messages of team forms --> JOIN/CREATE
        //  */
        // teamsFormError (state, action) {
        //     state.teamsFormError = action.payload;
        // },

        // /**
        //  * error message for user & top team request
        //  */
        // teamsRequestError (state, action) {
        //     state.teamsRequestStatus = action.payload;
        //     state.teamFormStatus = 'ERROR';
        // },

        /**
         * add top teams to topTeams array
         */
        topTeamsRequestSuccess (state, action) {
            state.topTeams = action.payload;
        },

        /**
         * add users teams to userTeams array
         */
        userTeamsRequestSuccess (state, action) {
            state.userTeams = action.payload;
        },

        /**
         * Set selected team for showing in team details screen
         */
        setSelectedTeam (state, action) {
            state.selectedTeam = action.payload;
            state.teamMembers = [];
            state.memberNextPage = 1;
        }
    },

    extraReducers: (builder) => {

        builder

            .addCase(changeActiveTeam.pending, (state) => {

            })
            .addCase(changeActiveTeam.fulfilled, (state, action) => {
                state.teamFormStatus = 'SUCCESS';
                state.successMessage = 'Active team updated';
            })
            .addCase(changeActiveTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(createTeam.pending, (state) => {
                state.teamsFormError = '';
                state.teamFormStatus = '';
                state.successMessage = '';
            })
            .addCase(createTeam.fulfilled, (state, action) => {

                // dispatch changeActiveTeam on auth_reducer.js
                state.userTeams.push(action.payload.team);

                // This was commented out on teams_actions
                state.teamFormStatus = 'SUCCESS';

                action.payload.type === 'JOIN'
                    ? (state.successMessage = 'Congrats! you have joined a new team')
                    : (state.successMessage = 'Congrats! you created a new team');
            })
            .addCase(createTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(inactivateTeam.pending, (state) => {
                // no action yet
            })
            .addCase(inactivateTeam.fulfilled, (state) => {
                // other code was commented out
            })
            .addCase(inactivateTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(leaveTeam.pending, (state) => {
                // no action yet
            })
            .addCase(leaveTeam.fulfilled, (state, action) => {
                const index = state.userTeams.findIndex(team => team.id === action.payload.team?.id);

                if (index !== -1) {
                    state.userTeams.splice(index, 1);
                }
            })
            .addCase(leaveTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })


            .addCase(getTeamMembers.pending, (state) => {
                // no action yet
            })
            .addCase(getTeamMembers.fulfilled, (state, action) => {
                state.teamMembers.push(...action.payload.data);

                const nextPage = action.payload.next_page_url;

                state.memberNextPage = nextPage !== null ? nextPage.split('=')[1] : null;
            })
            .addCase(getTeamMembers.rejected, (state, action) => {
                // no action yet
            })

            .addCase(getTopTeams.pending, (state) => {
                // no action yet
            })
            .addCase(getTopTeams.fulfilled, (state, action) => {
                state.topTeams = action.payload;
            })
            .addCase(getTopTeams.rejected, (state, action) => {
                state.teamsRequestStatus = action.payload;
                state.teamFormStatus = 'ERROR';
            })

            .addCase(getUserTeams.pending, (state) => {
                // no action yet
            })
            .addCase(getUserTeams.fulfilled, (state, action) => {
                state.userTeams = action.payload;
            })
            .addCase(getUserTeams.rejected, (state, action) => {
                state.teamsRequestStatus = action.payload;
                state.teamFormStatus = 'ERROR';
            })

            .addCase(joinTeam.pending, (state) => {
                // no action yet
            })
            .addCase(joinTeam.fulfilled, (state, action) => {
                // dispatch changeActiveTeam on auth_reducer.js

                state.userTeams.push(action.payload.team);

                // This was commented out on teams_actions
                // state.teamFormStatus = 'SUCCESS';
                //
                // action.payload.type === 'JOIN'
                //     ? (state.successMessage = 'Congrats! you have joined a new team')
                //     : (state.successMessage = 'Congrats! you created a new team');
            })
            .addCase(joinTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            });
    }
});

export const {
    clearTeamsForm,
    topTeamsRequestSuccess,
    userTeamsRequestSuccess,
    setSelectedTeam
} = teamSlice.actions;

export default teamSlice.reducer;
