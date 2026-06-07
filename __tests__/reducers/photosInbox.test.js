/**
 * Inbox cleanup paths in photos_reducer:
 *  - removeTaggedPhoto: the idempotent-upload `tagged:true` skip path.
 *  - photo-already-uploaded: the transitional "duplicate" 422 drop (kept until
 *    the idempotent backend is deployed). See readme/upload-spec.md.
 */
jest.mock('../../utils/apiClient', () => ({
    __esModule: true,
    default: {post: jest.fn(), put: jest.fn(), get: jest.fn()}
}));
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));
// Native modules pulled in transitively via gallery_reducer — not needed here.
jest.mock('@react-native-camera-roll/camera-roll', () => ({CameraRoll: {}}));
jest.mock('@lodev09/react-native-exify', () => ({}));

import photosReducer, {removeTaggedPhoto} from '../../reducers/photos_reducer';
import {uploadImage, addTagsToPhoto} from '../../reducers/upload_flow_reducer';

const baseState = imagesArray => ({
    imagesArray,
    uploadedUris: [],
    editingPhotos: [],
    taggedThisSession: [],
    swiperIndex: 0,
    customTagError: null
});

describe('photos inbox cleanup', () => {
    it('removeTaggedPhoto removes the photo and records its uri (tagged:true skip)', () => {
        const state = baseState([
            {id: 555, uri: 'file://a.jpg', uploaded: true, tags: [{cloId: 1}]}
        ]);

        const next = photosReducer(state, removeTaggedPhoto(555));

        expect(next.imagesArray).toHaveLength(0);
        expect(next.uploadedUris).toContain('file://a.jpg');
    });

    it('removeTaggedPhoto is a no-op when the id is not present', () => {
        const state = baseState([
            {id: 999, uri: 'file://keep.jpg', uploaded: true, tags: [{cloId: 1}]}
        ]);

        const next = photosReducer(state, removeTaggedPhoto(555));

        expect(next.imagesArray).toHaveLength(1);
        expect(next.uploadedUris).toHaveLength(0);
    });

    it('transitional "duplicate" 422 drops the stranded photo from the inbox', () => {
        const state = baseState([
            {id: 'onboarding_x', uri: 'file://b.jpg', uploaded: false, tags: [{cloId: 1}]}
        ]);

        const next = photosReducer(state, {
            type: uploadImage.rejected.type,
            payload: {errorType: 'photo-already-uploaded'},
            meta: {arg: {imageUri: 'file://b.jpg'}}
        });

        expect(next.imagesArray).toHaveLength(0);
    });

    it('drops the photo when the tag write is rejected as invalid-photo-id (server says id does not exist)', () => {
        const state = baseState([
            {id: 5, uri: 'file://stale.jpg', uploaded: true, tags: [{cloId: 1}]}
        ]);

        const next = photosReducer(state, {
            type: addTagsToPhoto.rejected.type,
            payload: {errorType: 'invalid-photo-id'},
            meta: {arg: {photoId: 5}}
        });

        expect(next.imagesArray).toHaveLength(0);
    });

    it('keeps the photo for retry on a transient tag-write rejection (timeout)', () => {
        const state = baseState([
            {id: 5, uri: 'file://x.jpg', uploaded: true, tags: [{cloId: 1}]}
        ]);

        const next = photosReducer(state, {
            type: addTagsToPhoto.rejected.type,
            payload: {errorType: 'timeout'},
            meta: {arg: {photoId: 5}}
        });

        expect(next.imagesArray).toHaveLength(1);
    });
});
