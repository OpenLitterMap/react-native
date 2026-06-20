import {Platform, NativeModules} from 'react-native';

/**
 * Find queued photos whose local file no longer exists.
 *
 * The to-tag queue (`imagesArray`) is persisted across restarts, but on Android the
 * imported copies live in app cache, which the OS can evict independently. That can
 * leave phantom entries pointing at deleted files (broken tiles, cryptic upload
 * failures). This checks each local `file://` entry against the native `fileExists`
 * helper and returns the ones that are gone so the caller can prune them.
 *
 * Android-only: the existence check goes through the native MediaStore module. On
 * iOS (and for non-`file://` / remote URIs) it prunes nothing — RNIP's iOS cache
 * URIs share the same latent issue but are out of scope for this guard. The check is
 * conservative: any error leaves the entry in place (never prune on uncertainty).
 *
 * @param {Array<{uri?: string}>} images
 * @returns {Promise<Array>} the subset whose file is confirmed missing
 */
export const findMissingPhotos = async images => {
    if (Platform.OS !== 'android' || !NativeModules.OlmGallery?.fileExists) return [];

    const results = await Promise.all(
        images.map(async img => {
            if (!img?.uri || !img.uri.startsWith('file://')) return null;
            // Uploaded items keep their file:// uri but no longer need the local file —
            // their retry path PUTs tags by server id. Pruning one would destroy that
            // recoverable tag state, so never treat an uploaded entry as missing.
            if (img.uploaded) return null;
            try {
                const exists = await NativeModules.OlmGallery.fileExists(img.uri);
                return exists ? null : img;
            } catch {
                return null; // conservative: don't prune on a failed check
            }
        })
    );
    return results.filter(Boolean);
};
