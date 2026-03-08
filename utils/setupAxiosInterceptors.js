import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../reducers/auth_reducer';
import { setUploadAbortReason } from '../reducers/images_reducer';

/**
 * Register a global axios response interceptor.
 * - Sets a 30-second default timeout for all requests
 * - On 401 responses: signals the upload loop to stop, then logs out
 */
export default function setupAxiosInterceptors(store) {
    // Global timeout — prevents uploads from hanging indefinitely
    axios.defaults.timeout = 30000;

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                // If an upload is in progress, signal it to stop gracefully
                const state = store.getState();
                if (state.shared?.isUploading) {
                    store.dispatch(setUploadAbortReason('token-expired'));
                }

                await AsyncStorage.removeItem('jwt').catch(() => {});
                store.dispatch(logout());
            }
            return Promise.reject(error);
        }
    );
}
