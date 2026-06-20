import {Platform, NativeModules} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {readGpsFromExif} from './readGpsFromExif';
import {ensurePhotoPermission} from './permissions/photoPermission';

// Read EXIF for up to this many iOS picks at once (bounded so a large multi-select
// doesn't open hundreds of streams). Android reads GPS natively in one round-trip.
const EXIF_CONCURRENCY = 6;

/**
 * Normalize a picked asset to the shared contract consumed by partitionByGps and
 * both call sites. `meta` is the readGpsFromExif result (iOS) or undefined.
 */
const normalize = (asset, meta) => ({
    uri: asset.uri,
    fileName: asset.fileName,
    type: asset.type,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
    latitude: meta?.latitude ?? null,
    longitude: meta?.longitude ?? null,
    takenAt: meta?.takenAt ?? null,
    source: 'picker'
});

/**
 * Pick photos from the device gallery, returning a normalized Asset[] where each
 * entry carries `latitude`/`longitude` (or null). Platform dispatch:
 *
 *   Android — request media permission, then the native MediaStore module reads
 *             unredacted GPS and copies each pick to app cache (file:// URIs).
 *   iOS     — system picker + per-asset readGpsFromExif (unchanged behaviour).
 *
 * Cancel resolves to []. A hard picker error throws (call sites surface their own UI).
 *
 * @param {{selectionLimit?: number, onProgress?: (p: {done: number, total: number}) => void,
 *          isCancelled?: () => boolean}} [opts]
 * @returns {Promise<Array>}
 */
export const pickGeotaggedPhotos = async ({selectionLimit = 1, onProgress, isCancelled} = {}) => {
    if (Platform.OS === 'android') {
        const granted = await ensurePhotoPermission();
        if (!granted) throw new Error('PHOTO_PERMISSION_DENIED');
        const assets = await NativeModules.OlmGallery.pick({selectionLimit});
        return assets || [];
    }

    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit, quality: 1});
    if (result.didCancel) return [];
    if (result.errorCode) {
        throw new Error(result.errorMessage || 'Image picker error');
    }

    const assets = result.assets || [];
    const out = [];
    for (let i = 0; i < assets.length; i += EXIF_CONCURRENCY) {
        if (isCancelled?.()) break;
        const chunk = assets.slice(i, i + EXIF_CONCURRENCY);
        const metas = await Promise.all(
            chunk.map(a => readGpsFromExif(a.uri).catch(() => null))
        );
        chunk.forEach((asset, j) => out.push(normalize(asset, metas[j])));
        onProgress?.({done: Math.min(i + chunk.length, assets.length), total: assets.length});
    }
    return out;
};
