import api from '../utils/apiClient';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {changeUsersActiveTeam, logout} from './auth_reducer';

const initialState = {
    topTeams: [],
    topTeamsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    userTeams: [],
    teamMembers: [],
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
    async ({teamId}, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/teams/active', {
                token,
                data: {team_id: teamId}
            });

            if (!response.data?.success) {
                return rejectWithValue('Max teams reached');
            }

            if (response.data?.team?.id) {
                dispatch(changeUsersActiveTeam(response.data.team.id));
                return response.data.team.id;
            }

            return rejectWithValue('Failed to change active team');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createTeam = createAsyncThunk(
    'teams/createTeam',
    async ({name, identifier}, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/teams/create', {
                token,
                data: {name, identifier, teamType: 1}
            });

            if (!response.data.success) {
                return rejectWithValue('Max teams reached');
            }

            return {
                team: response.data.team,
                type: 'CREATE'
            };
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const errorData = error.response.data.errors;

                const msg =
                    errorData.name?.[0] ||
                    errorData.identifier?.[0] ||
                    'Validation error';
                return rejectWithValue(msg);
            }

            return rejectWithValue('Network Error, please try again');
        }
    }
);

export const inactivateTeam = createAsyncThunk(
    'teams/inactivateTeam',
    async (_, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/teams/inactivate', {
                token
            });

            if (!response.data.success) {
                return rejectWithValue('Max teams reached');
            }

            dispatch(changeUsersActiveTeam(null));

            return true;
        } catch (error) {
            if (__DEV__) {
                console.error(error);
            }
            return rejectWithValue(error.message);
        }
    }
);

export const leaveTeam = createAsyncThunk(
    'teams/leaveTeam',
    async ({teamId}, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/teams/leave', {
                token,
                data: {team_id: teamId}
            });

            if (!response.data) {
                return rejectWithValue('Failed to leave the team');
            }

            // Backend auto-assigns a new active team (or null if no
            // other teams). Always sync — don't skip when null.
            dispatch(
                changeUsersActiveTeam(
                    response.data.activeTeam?.id ?? null
                )
            );

            return {
                activeTeamId: response.data.activeTeam?.id ?? null,
                team: response.data.team
            };
        } catch (error) {
            const msg = error.response?.data?.message;
            if (msg === 'you-are-last-member') {
                return rejectWithValue(
                    'You are the last member. Delete the team instead.'
                );
            }
            if (msg === 'not-a-member') {
                return rejectWithValue('You are not a member of this team.');
            }
            return rejectWithValue('Error while trying to leave the team');
        }
    }
);

export const getTeamMembers = createAsyncThunk(
    'teams/getTeamMembers',
    async ({teamId, page = 1}, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get('/api/teams/members', {
                token,
                params: {team_id: teamId, page}
            });

            if (!response.data) {
                return rejectWithValue('No data received');
            }

            return response.data.result;
        } catch (error) {
            return rejectWithValue('Error fetching team members');
        }
    }
);

export const getTopTeams = createAsyncThunk(
    'teams/getTopTeams',
    async (_, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get('/api/teams/leaderboard', {
                token
            });

            if (!response.data) {
                return rejectWithValue('No data received');
            }

            return response.data;
        } catch (error) {
            if (error.response) {
                return rejectWithValue(
                    'Something went wrong, please try again'
                );
            } else {
                return rejectWithValue('Network Error, please try again');
            }
        }
    }
);

export const getUserTeams = createAsyncThunk(
    'teams/getUserTeams',
    async (_, {getState, rejectWithValue}) => {
        try {
            const token = getState().auth.token;
            const response = await api.get('/api/teams/list', {
                token
            });
            if (response.data && response.data.success) {
                return response.data.teams;
            } else {
                return rejectWithValue(
                    'Something went wrong, please try again'
                );
            }
        } catch (error) {
            if (error.response) {
                return rejectWithValue(
                    'Something went wrong, please try again'
                );
            } else {
                return rejectWithValue('Network Error, please try again');
            }
        }
    }
);

export const joinTeam = createAsyncThunk(
    'teams/joinTeam',
    async ({identifier}, {getState, rejectWithValue, dispatch}) => {
        try {
            const token = getState().auth.token;
            const response = await api.post('/api/teams/join', {
                token,
                data: {identifier}
            });
            if (!response.data?.success) {
                return rejectWithValue(
                    'You have already joined this team.'
                );
            }

            const activeTeamId = response.data?.activeTeam?.id ?? null;
            dispatch(changeUsersActiveTeam(activeTeamId));

            return {
                activeTeamId,
                team: response.data?.team,
                type: 'JOIN'
            };
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

/**
 * Normalize a raw Team model from the backend to match the
 * shape returned by /api/teams/list (which renames DB columns).
 * join/create/leave endpoints return raw Eloquent models with
 * DB column names (total_litter, members) instead of the renamed
 * fields (total_tags, total_members) that list() provides.
 */
const normalizeTeam = team => {
    if (!team) {
        return team;
    }
    return {
        ...team,
        total_images: team.total_images ?? team.photos ?? 0,
        total_tags: team.total_tags ?? team.total_litter ?? 0,
        total_members: team.total_members ?? team.members ?? 0
    };
};

const teamSlice = createSlice({
    name: 'team',

    initialState,

    reducers: {
        clearTeamsForm(state) {
            state.teamsFormError = '';
            state.successMessage = '';
            state.teamFormStatus = null;
        },

        /**
         * Set selected team for showing in team details screen
         */
        setSelectedTeam(state, action) {
            state.selectedTeam = action.payload;
            state.teamMembers = [];
            state.memberNextPage = 1;
        }
    },

    extraReducers: builder => {
        builder

            .addCase(changeActiveTeam.fulfilled, (state, action) => {
                state.teamFormStatus = 'SUCCESS';
                state.successMessage = 'Active team updated';
            })
            .addCase(changeActiveTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(createTeam.pending, state => {
                state.teamsFormError = '';
                state.teamFormStatus = null;
                state.successMessage = '';
            })
            .addCase(createTeam.fulfilled, (state, action) => {
                if (action.payload?.team &&
                    !state.userTeams.some(t => t.id === action.payload.team.id)) {
                    state.userTeams.push(normalizeTeam(action.payload.team));
                }
                state.teamFormStatus = 'SUCCESS';
                state.successMessage = 'Congrats! you created a new team';
            })
            .addCase(createTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(inactivateTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(leaveTeam.fulfilled, (state, action) => {
                const leftTeamId = action.payload.team?.id;

                const index = state.userTeams.findIndex(
                    team => team.id === leftTeamId
                );

                if (index !== -1) {
                    state.userTeams.splice(index, 1);
                }

                // If the left team was the currently viewed team, clear it
                if (state.selectedTeam?.id === leftTeamId) {
                    state.selectedTeam = {};
                    state.teamMembers = [];
                    state.memberNextPage = 1;
                }
            })
            .addCase(leaveTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })

            .addCase(getTeamMembers.fulfilled, (state, action) => {
                if (action.payload?.data) {
                    const existingIds = new Set(
                        state.teamMembers.map(m => m.id)
                    );
                    const newMembers = action.payload.data.filter(
                        m => !existingIds.has(m.id)
                    );
                    state.teamMembers.push(...newMembers);
                }

                const nextPage = action.payload?.next_page_url;
                if (nextPage) {
                    try {
                        const url = new URL(nextPage);
                        state.memberNextPage = Number(url.searchParams.get('page'));
                    } catch {
                        state.memberNextPage = null;
                    }
                } else {
                    state.memberNextPage = null;
                }
            })
            .addCase(getTeamMembers.rejected, (state, action) => {
                state.teamsFormError = action.payload || 'Failed to load members';
            })

            .addCase(getTopTeams.pending, state => {
                state.topTeamsStatus = 'loading';
            })
            .addCase(getTopTeams.fulfilled, (state, action) => {
                const raw = action.payload?.data ?? action.payload;
                state.topTeams = Array.isArray(raw) ? raw.map(normalizeTeam) : [];
                state.topTeamsStatus = 'succeeded';
            })
            .addCase(getTopTeams.rejected, (state, action) => {
                state.topTeamsStatus = 'failed';
                state.teamsFormError = action.payload || 'Failed to load teams';
            })

            .addCase(getUserTeams.fulfilled, (state, action) => {
                state.userTeams = action.payload;
            })

            .addCase(joinTeam.fulfilled, (state, action) => {
                if (action.payload?.team &&
                    !state.userTeams.some(t => t.id === action.payload.team.id)) {
                    state.userTeams.push(normalizeTeam(action.payload.team));
                }
                state.teamFormStatus = 'SUCCESS';
                state.successMessage = action.payload?.message || 'Team joined successfully';
            })
            .addCase(joinTeam.rejected, (state, action) => {
                state.teamsFormError = action.payload;
            })
            .addCase(logout, () => initialState);
    }
});

export const {clearTeamsForm, setSelectedTeam} = teamSlice.actions;

// Selectors
export const selectTopTeamsLoading = state => state.teams.topTeamsStatus === 'loading';
export const selectUserTeams = state => state.teams.userTeams;
export const selectSelectedTeam = state => state.teams.selectedTeam;

export default teamSlice.reducer;
