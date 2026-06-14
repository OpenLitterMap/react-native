/**
 * getUserTeams request status — mirrors the existing topTeamsStatus on
 * getTopTeams so a failed /api/teams/list isn't silently swallowed. State
 * only; no UI wiring here.
 */
jest.mock('@sentry/react-native', () => ({setUser: jest.fn(), captureException: jest.fn()}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {post: jest.fn(), get: jest.fn()}}));
jest.mock('../../reducers/quick_tags_reducer', () => ({fetchQuickTags: () => ({type: 'quickTags/noop'})}));

import teamReducer, {getUserTeams} from '../../reducers/team_reducer';

const initial = teamReducer(undefined, {type: '@@INIT'});

describe('getUserTeams status (mirrors getTopTeams)', () => {
    it('starts idle', () => {
        expect(initial.userTeamsStatus).toBe('idle');
    });

    it('sets userTeamsStatus to loading on pending', () => {
        const next = teamReducer(initial, {type: getUserTeams.pending.type});
        expect(next.userTeamsStatus).toBe('loading');
    });

    it('stores teams and marks succeeded on fulfilled', () => {
        const teams = [{id: 1, name: 'Team A'}];
        const next = teamReducer(initial, {type: getUserTeams.fulfilled.type, payload: teams});
        expect(next.userTeams).toEqual(teams);
        expect(next.userTeamsStatus).toBe('succeeded');
    });

    it('marks failed and records the error on rejected', () => {
        const next = teamReducer(initial, {
            type: getUserTeams.rejected.type,
            payload: 'Network Error, please try again'
        });
        expect(next.userTeamsStatus).toBe('failed');
        expect(next.teamsFormError).toBe('Network Error, please try again');
    });
});
