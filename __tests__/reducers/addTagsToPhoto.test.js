/**
 * Upload-flow tagging: PUT (replace) semantics + the idempotent-upload guards.
 * See readme/upload-spec.md.
 */
import api from '../../utils/apiClient';
import {addTagsToPhoto} from '../../reducers/upload_flow_reducer';

jest.mock('../../utils/apiClient', () => ({
    __esModule: true,
    default: {post: jest.fn(), put: jest.fn(), get: jest.fn()}
}));
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));

const getState = () => ({auth: {token: 'tok'}});
const dispatch = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('addTagsToPhoto thunk', () => {
    it('writes tags with PUT (replace), never POST', async () => {
        api.put.mockResolvedValue({data: {success: true}});

        const result = await addTagsToPhoto({photoId: 123, tags: [{cloId: 1}]})(
            dispatch, getState, undefined
        );

        expect(api.put).toHaveBeenCalledWith(
            '/api/v3/tags',
            expect.objectContaining({data: {photo_id: 123, tags: [{cloId: 1}]}})
        );
        expect(api.post).not.toHaveBeenCalled();
        expect(addTagsToPhoto.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({photoId: 123});
    });

    it('rejects a non-integer (local/onboarding) id without hitting the network', async () => {
        const result = await addTagsToPhoto({photoId: 'onboarding_1700_ab', tags: []})(
            dispatch, getState, undefined
        );

        expect(api.put).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
        expect(addTagsToPhoto.rejected.match(result)).toBe(true);
        expect(result.payload.errorType).toBe('invalid-photo-id');
    });

    it('accepts a positive-integer string id (Laravel coerces) via PUT', async () => {
        api.put.mockResolvedValue({data: {success: true}});

        const result = await addTagsToPhoto({photoId: '456', tags: []})(
            dispatch, getState, undefined
        );

        expect(api.put).toHaveBeenCalled();
        expect(addTagsToPhoto.fulfilled.match(result)).toBe(true);
    });
});
