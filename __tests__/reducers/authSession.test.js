/**
 * Boot session contract: only a real auth error (401 / invalid token) clears the
 * session. Transient failures (timeout/network/5xx) on checkValidToken must keep
 * the token so a network blip can't force a logout on launch.
 */
jest.mock('@sentry/react-native', () => ({setUser: jest.fn(), captureException: jest.fn()}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {post: jest.fn(), get: jest.fn()}}));
jest.mock('../../reducers/quick_tags_reducer', () => ({fetchQuickTags: () => ({type: 'quickTags/noop'})}));

import authReducer, {checkValidToken} from '../../reducers/auth_reducer';

const withToken = {token: 'jwt-123', user: {id: 1}};

describe('checkValidToken.rejected session gating', () => {
    it('keeps the token on a transient failure (isAuthError: false)', () => {
        const next = authReducer(withToken, {
            type: checkValidToken.rejected.type,
            payload: {message: 'Could not validate session.', isAuthError: false}
        });
        expect(next.token).toBe('jwt-123');
        expect(next.user).toEqual({id: 1});
    });

    it('clears the session on a real auth error (isAuthError: true)', () => {
        const next = authReducer(withToken, {
            type: checkValidToken.rejected.type,
            payload: {message: 'Please login again.', isAuthError: true}
        });
        expect(next.token).toBeNull();
        expect(next.user).toBeNull();
    });

    it('keeps the token when the rejection carries no payload', () => {
        const next = authReducer(withToken, {
            type: checkValidToken.rejected.type
        });
        expect(next.token).toBe('jwt-123');
    });
});
