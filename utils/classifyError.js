import * as Sentry from '@sentry/react-native';
import {IS_PRODUCTION} from './config';

/**
 * Normalize an axios error into a structured object for reducers and UI.
 *
 * Returns: { errorType, userMessage, reportable }
 *
 * errorType values align with reducer failedCounts buckets:
 *   cancelled, timeout, network, unauthorized,
 *   photo-already-uploaded, invalid-coordinates, validation,
 *   server, unknown
 */
export function classifyError(error, section) {
    const normalized = normalizeError(error);

    // Report to Sentry (only in production, skip cancels and network)
    if (IS_PRODUCTION && normalized.reportable) {
        reportToSentry(error, normalized, section);
    }

    return {
        errorType: normalized.errorType,
        userMessage: normalized.userMessage
    };
}

/**
 * Pure classification — no side effects.
 * Separated for testability.
 */
function normalizeError(error) {
    // Axios / AbortController cancellation
    if (
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError' ||
        error?.message === 'canceled'
    ) {
        return {
            errorType: 'cancelled',
            userMessage: 'Upload cancelled.',
            reportable: false
        };
    }

    // No server response — network or timeout
    if (!error?.response) {
        if (error?.code === 'ECONNABORTED') {
            return {
                errorType: 'timeout',
                userMessage: 'Upload timed out. Check your connection and try again.',
                reportable: true
            };
        }
        return {
            errorType: 'network',
            userMessage: 'No internet connection. Please check your network.',
            reportable: false
        };
    }

    const status = error.response.status;
    // Support all backend shapes: { msg }, { message }, { error: { code, message } }, { error: "string" }
    const data = error.response.data;
    const errorField = data?.error;
    const backendMessage = data?.msg || data?.message || '';
    const backendCode = (typeof errorField === 'string' ? errorField : errorField?.code)
        || data?.code || backendMessage;

    if (status === 401) {
        return {
            errorType: 'unauthorized',
            userMessage: 'Session expired. Please log in again.',
            reportable: true
        };
    }

    if (status === 422) {
        const codeStr = String(backendCode || '');
        if (
            codeStr === 'photo-already-uploaded' ||
            codeStr === 'photo_already_uploaded' ||
            codeStr === 'duplicate' ||
            /already uploaded/i.test(codeStr) ||
            /already uploaded/i.test(backendMessage)
        ) {
            return {
                errorType: 'photo-already-uploaded',
                userMessage: 'This photo was already uploaded.',
                reportable: false
            };
        }
        if (backendCode === 'invalid-coordinates' || backendCode === 'invalid_coordinates') {
            return {
                errorType: 'invalid-coordinates',
                userMessage: 'Photo has invalid GPS coordinates.',
                reportable: false
            };
        }
        return {
            errorType: 'validation',
            userMessage: (typeof errorField === 'object' && errorField?.message) || data?.message || 'Photo could not be processed.',
            reportable: true
        };
    }

    if (status >= 500) {
        return {
            errorType: 'server',
            userMessage: 'Server error. Please try again later.',
            reportable: true
        };
    }

    return {
        errorType: 'unknown',
        userMessage: (typeof errorField === 'object' && errorField?.message) || data?.message || 'Upload failed. Please try again.',
        reportable: true
    };
}

/**
 * Report to Sentry with structured tags.
 * Preserves original error for stack trace.
 */
function reportToSentry(rawError, normalized, section) {
    Sentry.captureException(
        rawError instanceof Error ? rawError : new Error('API error'),
        {
            level: normalized.errorType === 'server' ? 'error' : 'warning',
            tags: {
                section,
                errorType: normalized.errorType,
                ...(rawError?.response?.status != null && {
                    status: String(rawError.response.status)
                })
            },
            extra: {
                errorType: normalized.errorType,
                userMessage: normalized.userMessage
            }
        }
    );
}
