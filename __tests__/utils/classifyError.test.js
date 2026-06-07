// Mock Sentry before importing classifyError
jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn()
}));

// Mock IS_PRODUCTION to false for tests
jest.mock('../../utils/config', () => ({
    IS_PRODUCTION: false,
    URL: 'http://localhost:8000'
}));

import {classifyError} from '../../utils/classifyError';

describe('classifyError', () => {
    it('classifies abort/cancel errors', () => {
        const error = {code: 'ERR_CANCELED', message: 'canceled'};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('cancelled');
    });

    it('classifies CanceledError by name', () => {
        const error = {name: 'CanceledError'};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('cancelled');
    });

    it('classifies timeout errors', () => {
        const error = {code: 'ECONNABORTED'};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('timeout');
    });

    it('classifies network errors (no response)', () => {
        const error = {message: 'Network Error'};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('network');
    });

    it('classifies 401 as unauthorized', () => {
        const error = {response: {status: 401, data: {}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('unauthorized');
    });

    it('classifies 422 photo-already-uploaded', () => {
        const error = {response: {status: 422, data: {msg: 'photo-already-uploaded'}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('photo-already-uploaded');
    });

    it('classifies 422 with new error.code format', () => {
        const error = {response: {status: 422, data: {error: {code: 'photo_already_uploaded'}}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('photo-already-uploaded');
    });

    it('classifies 422 with "already uploaded" message string', () => {
        const error = {response: {status: 422, data: {message: 'You have already uploaded this photo'}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('photo-already-uploaded');
    });

    it('classifies 422 with error: "duplicate" format', () => {
        const error = {response: {status: 422, data: {error: 'duplicate'}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('photo-already-uploaded');
    });

    it('classifies 422 invalid-coordinates', () => {
        const error = {response: {status: 422, data: {msg: 'invalid-coordinates'}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('invalid-coordinates');
    });

    it('classifies 422 backend photo_id "selected ... is invalid" (nonexistent/deleted) as invalid-photo-id', () => {
        const error = {response: {status: 422, data: {
            message: 'The selected photo id is invalid.',
            errors: {photo_id: ['The selected photo id is invalid.']}
        }}};
        const result = classifyError(error, 'put_tags_v3');
        expect(result.errorType).toBe('invalid-photo-id');
    });

    it('classifies 422 backend photo_id "must be an integer" as invalid-photo-id', () => {
        const error = {response: {status: 422, data: {
            message: 'The photo id field must be an integer.',
            errors: {photo_id: ['The photo id field must be an integer.']}
        }}};
        const result = classifyError(error, 'put_tags_v3');
        expect(result.errorType).toBe('invalid-photo-id');
    });

    it('still classifies a non-photo_id 422 as generic validation', () => {
        const error = {response: {status: 422, data: {
            message: 'The tags field is required.',
            errors: {tags: ['The tags field is required.']}
        }}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('validation');
    });

    it('classifies 500+ as server error', () => {
        const error = {response: {status: 503, data: {}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('server');
    });

    it('classifies unknown status as unknown', () => {
        const error = {response: {status: 403, data: {}}};
        const result = classifyError(error, 'test');
        expect(result.errorType).toBe('unknown');
    });

    it('returns userMessage for each error type', () => {
        const cases = [
            [{code: 'ERR_CANCELED'}, 'Upload cancelled.'],
            [{code: 'ECONNABORTED'}, 'Upload timed out. Check your connection and try again.'],
            [{message: 'fail'}, 'No internet connection. Please check your network.'],
            [{response: {status: 401, data: {}}}, 'Session expired. Please log in again.'],
            [{response: {status: 500, data: {}}}, 'Server error. Please try again later.']
        ];
        for (const [error, expectedMsg] of cases) {
            expect(classifyError(error, 'test').userMessage).toBe(expectedMsg);
        }
    });
});
