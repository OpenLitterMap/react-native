import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../reducers/auth_reducer';
import { setUploadAbortReason } from '../reducers/images_reducer';

/**
 * Register a global axios response interceptor.
 * - Sets a 30-second default timeout for all requests
 * - On 401 responses: signals the upload loop to stop, then logs out
 */
let isLoggingOut = false;
let interceptorId = null;

export default function setupAxiosInterceptors(store) {
    // Global timeout — prevents uploads from hanging indefinitely
    axios.defaults.timeout = 30000;

    // Eject previous interceptor if any (idempotent for hot reload)
    if (interceptorId !== null) {
        axios.interceptors.response.eject(interceptorId);
    }

    interceptorId = axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401 && !isLoggingOut) {
                isLoggingOut = true;

                // If an upload is in progress, signal it to stop gracefully
                const state = store.getState();
                if (state.images?.uploadPhase !== 'idle') {
                    store.dispatch(setUploadAbortReason('token-expired'));
                }

                await AsyncStorage.removeItem('jwt').catch(() => {});
                store.dispatch(logout());

                // Reset after a tick so future 401s (after re-login) still work
                setTimeout(() => { isLoggingOut = false; }, 0);
            }
            return Promise.reject(error);
        }
    );
}
