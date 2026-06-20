/**
 * ensurePhotoPermission: requests the Android media permissions for a MediaStore
 * gallery import and reports an AML-aware status, so a user who grants photo access
 * but denies media-location is NOT silently sent down the redacted/no-GPS path.
 *
 * Returns one of:
 *   'granted'         media readable AND ACCESS_MEDIA_LOCATION granted (GPS will survive)
 *   'location-denied' media readable but AML denied (photos have GPS we can't read)
 *   'denied'          can't read media at all
 *
 * Android 14 guidance: request READ_MEDIA_IMAGES + READ_MEDIA_VISUAL_USER_SELECTED +
 * ACCESS_MEDIA_LOCATION together. API matrix: 33+ media-images; 29-32 external-storage
 * (+AML); <=28 external-storage only (no scoped-storage redaction, so no AML).
 */
jest.mock('react-native', () => ({Platform: {OS: 'ios', Version: 0}}));
jest.mock('react-native-permissions', () => ({
    PERMISSIONS: {
        ANDROID: {
            READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
            READ_MEDIA_VISUAL_USER_SELECTED: 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
            ACCESS_MEDIA_LOCATION: 'android.permission.ACCESS_MEDIA_LOCATION',
            READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE'
        }
    },
    RESULTS: {GRANTED: 'granted', LIMITED: 'limited', DENIED: 'denied', BLOCKED: 'blocked'},
    requestMultiple: jest.fn()
}));

import {Platform} from 'react-native';
import {requestMultiple, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {ensurePhotoPermission, PHOTO_PERMISSION} from '../../utils/permissions/photoPermission';

const A = PERMISSIONS.ANDROID;

const setAndroid = api => {
    Platform.OS = 'android';
    Platform.Version = api;
};
// helper: build a requestMultiple result where listed perms are granted, rest denied
const grantOnly = (...granted) => async perms => {
    const out = {};
    perms.forEach(p => {
        out[p] = granted.includes(p) ? RESULTS.GRANTED : RESULTS.DENIED;
    });
    return out;
};

describe('ensurePhotoPermission', () => {
    afterEach(() => requestMultiple.mockReset());

    it('iOS: granted without requesting anything', async () => {
        Platform.OS = 'ios';
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.GRANTED);
        expect(requestMultiple).not.toHaveBeenCalled();
    });

    it('Android 33+: requests the three media perms together in one call', async () => {
        setAndroid(34);
        requestMultiple.mockImplementation(grantOnly(A.READ_MEDIA_IMAGES, A.ACCESS_MEDIA_LOCATION));

        await ensurePhotoPermission();

        expect(requestMultiple).toHaveBeenCalledTimes(1);
        expect(requestMultiple).toHaveBeenCalledWith([
            A.READ_MEDIA_IMAGES,
            A.READ_MEDIA_VISUAL_USER_SELECTED,
            A.ACCESS_MEDIA_LOCATION
        ]);
    });

    it('Android 34: media read + AML granted => granted', async () => {
        setAndroid(34);
        requestMultiple.mockImplementation(grantOnly(A.READ_MEDIA_IMAGES, A.ACCESS_MEDIA_LOCATION));
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.GRANTED);
    });

    it('Android 34: media read granted but AML DENIED => location-denied (the P1 hole)', async () => {
        setAndroid(34);
        requestMultiple.mockImplementation(grantOnly(A.READ_MEDIA_IMAGES));
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.LOCATION_DENIED);
    });

    it('Android 34: "Select photos" partial access (visual-user-selected) + AML => granted', async () => {
        setAndroid(34);
        requestMultiple.mockImplementation(grantOnly(A.READ_MEDIA_VISUAL_USER_SELECTED, A.ACCESS_MEDIA_LOCATION));
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.GRANTED);
    });

    it('Android 34: nothing granted => denied', async () => {
        setAndroid(34);
        requestMultiple.mockImplementation(grantOnly());
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.DENIED);
    });

    it('Android 29-32: requests READ_EXTERNAL_STORAGE + AML (not READ_MEDIA_IMAGES)', async () => {
        setAndroid(30);
        requestMultiple.mockImplementation(grantOnly(A.READ_EXTERNAL_STORAGE, A.ACCESS_MEDIA_LOCATION));

        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.GRANTED);
        expect(requestMultiple).toHaveBeenCalledWith([A.READ_EXTERNAL_STORAGE, A.ACCESS_MEDIA_LOCATION]);
    });

    it('Android 29-32: storage granted but AML denied => location-denied', async () => {
        setAndroid(30);
        requestMultiple.mockImplementation(grantOnly(A.READ_EXTERNAL_STORAGE));
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.LOCATION_DENIED);
    });

    it('Android <=28: requests only READ_EXTERNAL_STORAGE (no AML, no scoped-storage redaction)', async () => {
        setAndroid(28);
        requestMultiple.mockImplementation(grantOnly(A.READ_EXTERNAL_STORAGE));

        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.GRANTED);
        expect(requestMultiple).toHaveBeenCalledWith([A.READ_EXTERNAL_STORAGE]);
    });

    it('Android <=28: storage denied => denied', async () => {
        setAndroid(28);
        requestMultiple.mockImplementation(grantOnly());
        expect(await ensurePhotoPermission()).toBe(PHOTO_PERMISSION.DENIED);
    });
});
