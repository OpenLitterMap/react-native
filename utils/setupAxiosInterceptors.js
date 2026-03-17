import axios from 'axios';
import {logout} from '../reducers/auth_reducer';
import {setUploadAbortReason} from '../reducers/upload_flow_reducer';

/**
 * Register a global axios response interceptor.
 * - On 401 responses: signals the upload loop to stop, then logs out
 *
 * Auth cleanup is handled by redux-persist — dispatching logout() resets
 * auth state to initialState, which is then persisted (clearing the token).
 *
 * Per-request timeouts are now set in apiClient.js (not here as a global default).
 */
let logoutPromise = null;
let interceptorId = null;

export default function setupAxiosInterceptors(store) {
    // Eject previous interceptor if any (idempotent for hot reload)
    if (interceptorId !== null) {
        axios.interceptors.response.eject(interceptorId);
    }

    interceptorId = axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401 && !logoutPromise) {
                // Use a Promise-based guard instead of setTimeout hack.
                // All concurrent 401s wait on the same promise.
                logoutPromise = (async () => {
                    // If an upload is in progress, signal it to stop gracefully
                    const state = store.getState();
                    if (state.uploadFlow?.uploadPhase !== 'idle') {
                        store.dispatch(setUploadAbortReason('token-expired'));
                    }

                    store.dispatch(logout());
                })();

                try {
                    await logoutPromise;
                } finally {
                    // Reset after logout completes so future 401s (after re-login) work
                    logoutPromise = null;
                }
            }
            return Promise.reject(error);
        }
    );
}
