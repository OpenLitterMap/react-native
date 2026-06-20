/**
 * pickGeotaggedPhotos: the platform-dispatch seam for gallery import.
 *   Android -> native MediaStore module (GPS already read natively), after a
 *             permission gate.
 *   iOS     -> launchImageLibrary + per-asset readGpsFromExif (unchanged behaviour).
 * Both return the SAME normalized Asset[] shape so partitionByGps + the call sites
 * are platform-agnostic. Cancel -> []. Hard picker error -> throws.
 */
jest.mock('react-native', () => ({
    Platform: {OS: 'ios'},
    NativeModules: {OlmGallery: {pick: jest.fn()}}
}));
jest.mock('react-native-image-picker', () => ({launchImageLibrary: jest.fn()}));
jest.mock('../../utils/readGpsFromExif', () => ({readGpsFromExif: jest.fn()}));
jest.mock('../../utils/permissions/photoPermission', () => ({
    ensurePhotoPermission: jest.fn(),
    PHOTO_PERMISSION: {GRANTED: 'granted', LOCATION_DENIED: 'location-denied', DENIED: 'denied'}
}));

import {Platform, NativeModules} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {readGpsFromExif} from '../../utils/readGpsFromExif';
import {ensurePhotoPermission, PHOTO_PERMISSION} from '../../utils/permissions/photoPermission';
import {pickGeotaggedPhotos} from '../../utils/pickGeotaggedPhotos';

beforeEach(() => {
    Platform.OS = 'ios';
    NativeModules.OlmGallery.pick.mockReset();
    launchImageLibrary.mockReset();
    readGpsFromExif.mockReset();
    ensurePhotoPermission.mockReset();
});

describe('pickGeotaggedPhotos — Android', () => {
    it('gates on permission, then returns the native module assets verbatim', async () => {
        Platform.OS = 'android';
        ensurePhotoPermission.mockResolvedValue(PHOTO_PERMISSION.GRANTED);
        const nativeAssets = [
            {uri: 'file://cache/1.jpg', latitude: 51.88, longitude: -8.48, takenAt: 1, source: 'mediastore'}
        ];
        NativeModules.OlmGallery.pick.mockResolvedValue(nativeAssets);

        const out = await pickGeotaggedPhotos({selectionLimit: 0});

        expect(NativeModules.OlmGallery.pick).toHaveBeenCalledWith({selectionLimit: 0});
        expect(out).toBe(nativeAssets);
        expect(launchImageLibrary).not.toHaveBeenCalled();
    });

    it('throws PHOTO_PERMISSION_DENIED when media access is refused (does not open the picker)', async () => {
        Platform.OS = 'android';
        ensurePhotoPermission.mockResolvedValue(PHOTO_PERMISSION.DENIED);

        await expect(pickGeotaggedPhotos({selectionLimit: 1})).rejects.toThrow('PHOTO_PERMISSION_DENIED');
        expect(NativeModules.OlmGallery.pick).not.toHaveBeenCalled();
    });

    it('throws MEDIA_LOCATION_DENIED when media is readable but AML is denied (P1: no silent no-GPS)', async () => {
        Platform.OS = 'android';
        ensurePhotoPermission.mockResolvedValue(PHOTO_PERMISSION.LOCATION_DENIED);

        await expect(pickGeotaggedPhotos({selectionLimit: 1})).rejects.toThrow('MEDIA_LOCATION_DENIED');
        expect(NativeModules.OlmGallery.pick).not.toHaveBeenCalled();
    });
});

describe('pickGeotaggedPhotos — iOS', () => {
    const pickerAsset = {
        uri: 'file://photo.jpg',
        fileName: 'photo.jpg',
        type: 'image/jpeg',
        width: 4000,
        height: 3000,
        fileSize: 12345
    };

    it('merges EXIF GPS + capture time onto each picked asset, preserving its fields', async () => {
        Platform.OS = 'ios';
        launchImageLibrary.mockResolvedValue({assets: [pickerAsset]});
        readGpsFromExif.mockResolvedValue({latitude: 53.349, longitude: -6.26, takenAt: 1710513000});

        const [out] = await pickGeotaggedPhotos({selectionLimit: 1});

        expect(readGpsFromExif).toHaveBeenCalledWith('file://photo.jpg');
        expect(out).toMatchObject({
            uri: 'file://photo.jpg',
            fileName: 'photo.jpg',
            type: 'image/jpeg',
            width: 4000,
            height: 3000,
            fileSize: 12345,
            latitude: 53.349,
            longitude: -6.26,
            takenAt: 1710513000
        });
    });

    it('returns null GPS fields when the photo has no EXIF GPS (so partition skips it)', async () => {
        Platform.OS = 'ios';
        launchImageLibrary.mockResolvedValue({assets: [pickerAsset]});
        readGpsFromExif.mockResolvedValue(null);

        const [out] = await pickGeotaggedPhotos({selectionLimit: 1});

        expect(out).toMatchObject({uri: 'file://photo.jpg', latitude: null, longitude: null, takenAt: null});
    });

    it('returns [] when the user cancels', async () => {
        Platform.OS = 'ios';
        launchImageLibrary.mockResolvedValue({didCancel: true});

        expect(await pickGeotaggedPhotos({selectionLimit: 1})).toEqual([]);
        expect(readGpsFromExif).not.toHaveBeenCalled();
    });

    it('throws on a picker errorCode', async () => {
        Platform.OS = 'ios';
        launchImageLibrary.mockResolvedValue({errorCode: 'others', errorMessage: 'boom'});

        await expect(pickGeotaggedPhotos({selectionLimit: 1})).rejects.toThrow('boom');
    });

    it('reports progress and stops reading once isCancelled() turns true', async () => {
        Platform.OS = 'ios';
        const many = Array.from({length: 8}, (_, i) => ({...pickerAsset, uri: `file://${i}.jpg`}));
        launchImageLibrary.mockResolvedValue({assets: many});
        readGpsFromExif.mockResolvedValue({latitude: 1, longitude: 1, takenAt: null});
        const onProgress = jest.fn();
        let calls = 0;
        // cancel after the first chunk (EXIF_CONCURRENCY = 6)
        const isCancelled = () => calls++ > 0;

        const out = await pickGeotaggedPhotos({selectionLimit: 0, onProgress, isCancelled});

        expect(out.length).toBe(6); // only the first chunk processed before cancel
        expect(onProgress).toHaveBeenCalledWith({done: 6, total: 8});
    });
});
