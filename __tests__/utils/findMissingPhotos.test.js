/**
 * findMissingPhotos: guards the persisted to-tag queue against cache eviction.
 * Android may clear app cache independently of redux-persist, leaving imagesArray
 * entries whose file:// copy is gone — phantom tiles that can't display or upload.
 * This returns the entries whose local file no longer exists so the caller can prune
 * them. Android-only (the native fileExists check); iOS is a no-op here (scoped out).
 */
jest.mock('react-native', () => ({
    Platform: {OS: 'android'},
    NativeModules: {OlmGallery: {fileExists: jest.fn()}}
}));

import {Platform, NativeModules} from 'react-native';
import {findMissingPhotos} from '../../utils/findMissingPhotos';

const img = (uri, extra = {}) => ({id: uri, uri, ...extra});

beforeEach(() => {
    Platform.OS = 'android';
    NativeModules.OlmGallery.fileExists.mockReset();
});

describe('findMissingPhotos (Android)', () => {
    it('returns only the entries whose local file is gone', async () => {
        const gone = img('file:///cache/gone.jpg');
        const here = img('file:///cache/here.jpg');
        NativeModules.OlmGallery.fileExists.mockImplementation(async uri => uri.includes('here'));

        const missing = await findMissingPhotos([gone, here]);

        expect(missing).toEqual([gone]);
    });

    it('skips non-local URIs (server/remote photos are never pruned)', async () => {
        const remote = img('https://olm.test/photo/1.jpg');
        NativeModules.OlmGallery.fileExists.mockResolvedValue(false);

        const missing = await findMissingPhotos([remote]);

        expect(missing).toEqual([]);
        expect(NativeModules.OlmGallery.fileExists).not.toHaveBeenCalled();
    });

    it('never prunes an uploaded item, even if its local file is gone (tag-only retry state)', async () => {
        // After a binary upload the item keeps its file:// uri but is uploaded:true with
        // the server id; the retry path only PUTs tags by id and needs no local file.
        const uploaded = img('file:///cache/uploaded.jpg', {uploaded: true, id: 4321});
        NativeModules.OlmGallery.fileExists.mockResolvedValue(false);

        const missing = await findMissingPhotos([uploaded]);

        expect(missing).toEqual([]);
        expect(NativeModules.OlmGallery.fileExists).not.toHaveBeenCalled();
    });

    it('is conservative: a fileExists error does NOT prune the entry', async () => {
        const item = img('file:///cache/x.jpg');
        NativeModules.OlmGallery.fileExists.mockRejectedValue(new Error('boom'));

        expect(await findMissingPhotos([item])).toEqual([]);
    });

    it('returns [] for an empty queue', async () => {
        expect(await findMissingPhotos([])).toEqual([]);
    });
});

describe('findMissingPhotos (iOS)', () => {
    it('is a no-op (no native check, prunes nothing)', async () => {
        Platform.OS = 'ios';
        const missing = await findMissingPhotos([img('file:///tmp/a.jpg')]);
        expect(missing).toEqual([]);
        expect(NativeModules.OlmGallery.fileExists).not.toHaveBeenCalled();
    });
});
