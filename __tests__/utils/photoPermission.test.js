/**
 * ensurePhotoPermission: requests the right Android media permissions per API level
 * before a MediaStore gallery import. iOS needs none (the picker is permission-free).
 *
 * API matrix (spec):
 *   33+   READ_MEDIA_IMAGES + ACCESS_MEDIA_LOCATION
 *   29-32 READ_EXTERNAL_STORAGE + ACCESS_MEDIA_LOCATION
 *   <=28  READ_EXTERNAL_STORAGE
 * Returns true when photos are readable (read permission granted or — Android 14
 * partial access — limited). GPS un-redaction additionally wants AML, requested above.
 */
// The RN jest preset loads the iOS Platform impl (Version not reliably mutable),
// so mock Platform as a plain object we can drive per API level.
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
    request: jest.fn()
}));

import {Platform} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {ensurePhotoPermission} from '../../utils/permissions/photoPermission';

const {ANDROID} = PERMISSIONS;

const setAndroid = api => {
    Platform.OS = 'android';
    Platform.Version = api;
};

describe('ensurePhotoPermission', () => {
    afterEach(() => request.mockReset());

    it('Android 33+: requests READ_MEDIA_IMAGES + ACCESS_MEDIA_LOCATION', async () => {
        setAndroid(34);
        request.mockResolvedValue(RESULTS.GRANTED);

        const ok = await ensurePhotoPermission();

        expect(ok).toBe(true);
        expect(request).toHaveBeenCalledWith(ANDROID.READ_MEDIA_IMAGES);
        expect(request).toHaveBeenCalledWith(ANDROID.ACCESS_MEDIA_LOCATION);
        expect(request).not.toHaveBeenCalledWith(ANDROID.READ_EXTERNAL_STORAGE);
    });

    it('Android 14 "Select photos" partial access (limited) still counts as usable', async () => {
        setAndroid(34);
        request.mockImplementation(async perm =>
            perm === ANDROID.READ_MEDIA_IMAGES ? RESULTS.LIMITED : RESULTS.DENIED
        );

        expect(await ensurePhotoPermission()).toBe(true);
    });

    it('Android 33+: denied media read returns false', async () => {
        setAndroid(33);
        request.mockResolvedValue(RESULTS.DENIED);

        expect(await ensurePhotoPermission()).toBe(false);
    });

    it('Android 29-32: requests READ_EXTERNAL_STORAGE + ACCESS_MEDIA_LOCATION (not READ_MEDIA_IMAGES)', async () => {
        setAndroid(30);
        request.mockResolvedValue(RESULTS.GRANTED);

        await ensurePhotoPermission();

        expect(request).toHaveBeenCalledWith(ANDROID.READ_EXTERNAL_STORAGE);
        expect(request).toHaveBeenCalledWith(ANDROID.ACCESS_MEDIA_LOCATION);
        expect(request).not.toHaveBeenCalledWith(ANDROID.READ_MEDIA_IMAGES);
    });

    it('Android <=28: requests only READ_EXTERNAL_STORAGE (no AML below API 29)', async () => {
        setAndroid(28);
        request.mockResolvedValue(RESULTS.GRANTED);

        await ensurePhotoPermission();

        expect(request).toHaveBeenCalledWith(ANDROID.READ_EXTERNAL_STORAGE);
        expect(request).not.toHaveBeenCalledWith(ANDROID.ACCESS_MEDIA_LOCATION);
    });

    it('iOS: no permission requested (picker is permission-free)', async () => {
        Platform.OS = 'ios';

        expect(await ensurePhotoPermission()).toBe(true);
        expect(request).not.toHaveBeenCalled();
    });
});
