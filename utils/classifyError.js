import * as Sentry from '@sentry/react-native';

/**
 * Classify an axios error into a structured { errorType, userMessage } object.
 * Used by all upload thunks for consistent error handling.
 */
export function classifyError(error, section) {
    let errorType = 'unknown';
    let userMessage = 'Upload failed. Please try again.';

    if (!error.response) {
        // No server response — network or timeout
        if (error.code === 'ECONNABORTED') {
            errorType = 'timeout';
            userMessage =
                'Upload timed out. Check your connection and try again.';
        } else {
            errorType = 'network';
            userMessage = 'No internet connection. Please check your network.';
        }
    } else {
        const status = error.response.status;
        const msg = error.response.data?.msg || error.response.data?.message;

        if (status === 401) {
            errorType = 'unauthorized';
            userMessage = 'Session expired. Please log in again.';
        } else if (status === 422) {
            if (msg === 'photo-already-uploaded') {
                errorType = 'photo-already-uploaded';
                userMessage = 'This photo was already uploaded.';
            } else if (msg === 'invalid-coordinates') {
                errorType = 'invalid-coordinates';
                userMessage = 'Photo has invalid GPS coordinates.';
            } else {
                errorType = 'validation';
                userMessage = msg || 'Photo could not be processed.';
            }
        } else if (status >= 500) {
            errorType = 'server';
            userMessage = 'Server error. Please try again later.';
        } else {
            errorType = 'unknown';
            userMessage = msg || 'Upload failed. Please try again.';
        }

        Sentry.captureException(
            new Error(JSON.stringify(error.response.data)),
            {
                level: 'error',
                tags: {section, errorType, status: String(status)}
            }
        );
    }

    return {errorType, userMessage};
}
