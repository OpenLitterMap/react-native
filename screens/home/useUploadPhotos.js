import {useCallback, useRef} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {isGeotagged} from '../../utils/isGeotagged';
import {isTagged} from '../../utils/isTagged';
import buildTagsPayload from '../../utils/buildTagsPayload';
import {
    cancelUpload,
    closeThankYouMessages,
    postTagsToPhoto,
    resetThankYouMessages,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadPhase,
    showThankYouMessagesAfterUpload,
    startUploading,
    uploadImage
} from '../../reducers/upload_flow_reducer';

/**
 * Custom hook that encapsulates the upload orchestration logic.
 * Extracts the upload loop, cancel flow, and retry from HomeScreen.
 */
export default function useUploadPhotos() {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const images = useSelector(state => state.photos.imagesArray);
    const user = useSelector(state => state.auth.user);
    const deviceModel = useSelector(state => state.settings.deviceModel);

    const isUploadCancelled = useRef(false);
    const abortControllerRef = useRef(null);
    const retryTimerRef = useRef(null);

    const getImageDataForUpload = useCallback(img => {
        const isGeoTagged = isGeotagged(img);
        const photoHasTags = isTagged(img);

        if (!img.uploaded && isGeoTagged) {
            const imageData = new FormData();
            imageData.append('photo', {
                name: img.filename,
                type: 'image/jpeg',
                uri: img.uri
            });
            imageData.append('lat', img.lat);
            imageData.append('lon', img.lon);
            const timestamp = Number(img.date);
            if (Number.isFinite(timestamp)) {
                imageData.append('date', String(timestamp));
            }
            imageData.append('model', deviceModel);
            return [imageData, photoHasTags, isGeoTagged];
        } else if (img.uploaded) {
            return [null, photoHasTags, true];
        }

        return [null, false, false];
    }, [deviceModel]);

    /**
     * Upload photos sequentially.
     * Only processes photos that have tags — untagged photos are skipped.
     * Two-step for new photos: upload photo binary, then POST tags.
     * Already-uploaded photos with tags: POST tags only (retry path).
     */
    const uploadPhotos = useCallback(async () => {
        // Only upload photos that are geotagged AND have been tagged by the user
        const uploadable = images.filter(img => isGeotagged(img) && isTagged(img));

        if (uploadable.length === 0) return;

        const skippedNoGps = images.filter(img => !isGeotagged(img) && isTagged(img)).length;
        if (skippedNoGps > 0) {
            const confirmed = await new Promise(resolve => {
                Alert.alert(
                    t('Missing GPS Data'),
                    `${skippedNoGps} ${skippedNoGps === 1 ? t('photo') : t('photos')} ${t('skipped (no GPS data).')}`,
                    [
                        {text: t('Cancel'), onPress: () => resolve(false), style: 'cancel'},
                        {text: t('Continue'), onPress: () => resolve(true)}
                    ]
                );
            });
            if (!confirmed) return;
        }

        const geotaggedImages = uploadable;

        dispatch(resetUploadState());
        dispatch(resetThankYouMessages());
        isUploadCancelled.current = false;
        abortControllerRef.current = new AbortController();

        dispatch(setTotalToUpload(geotaggedImages.length));
        dispatch(startUploading());

        let failedUploads = 0;
        const failureReasons = [];

        for (let i = 0; i < geotaggedImages.length; i++) {
            const img = geotaggedImages[i];

            if (isUploadCancelled.current) break;

            dispatch(setCurrentUploadIndex(i));

            const [imageData, , isGeoTagged] = getImageDataForUpload(img);
            const tagsPayload = buildTagsPayload(img);

            if (!img.uploaded && isGeoTagged) {
                dispatch(setUploadPhase('uploading'));

                const result = await dispatch(
                    uploadImage({
                        imageData,
                        photoId: img.id,
                        imageUri: img.uri,
                        enableAdminTagging: user?.enable_admin_tagging,
                        photoHasTags: false,
                        signal: abortControllerRef.current?.signal
                    })
                );

                if (result.meta?.requestStatus === 'rejected') {
                    failedUploads++;
                    failureReasons.push(result.payload?.userMessage || 'Upload failed');
                } else if (tagsPayload && tagsPayload.length > 0 && result.payload?.serverPhotoId) {
                    dispatch(setUploadPhase('tagging'));
                    const tagResult = await dispatch(
                        postTagsToPhoto({
                            photoId: result.payload.serverPhotoId,
                            tags: tagsPayload,
                            signal: abortControllerRef.current?.signal
                        })
                    );
                    if (tagResult.meta?.requestStatus === 'rejected') {
                        failedUploads++;
                        failureReasons.push(tagResult.payload?.userMessage || 'Tag upload failed');
                    }
                } else if (result.meta?.requestStatus === 'fulfilled' && tagsPayload && tagsPayload.length > 0 && !result.payload?.serverPhotoId) {
                    failedUploads++;
                    failureReasons.push('Upload succeeded but server did not return photo ID');
                }
            } else if (img.uploaded && tagsPayload && tagsPayload.length > 0) {
                dispatch(setUploadPhase('tagging'));
                const tagResult = await dispatch(
                    postTagsToPhoto({
                        photoId: img.id,
                        tags: tagsPayload,
                        signal: abortControllerRef.current?.signal
                    })
                );
                if (tagResult.meta?.requestStatus === 'rejected') {
                    failedUploads++;
                    failureReasons.push(tagResult.payload?.userMessage || 'Tag upload failed');
                }
            }
        }

        if (!isUploadCancelled.current && failedUploads > 0) {
            const uniqueReasons = [...new Set(failureReasons)];
            const detail = uniqueReasons.length > 0
                ? uniqueReasons.map(r => t(r)).join('\n')
                : t('Some uploads failed. You can retry from your uploads.');
            Alert.alert(
                t('Error!'),
                `${failedUploads} ${failedUploads === 1 ? t('upload') : t('uploads')} ${t('failed')}:\n\n${detail}`
            );
        }

        if (!isUploadCancelled.current) {
            dispatch(showThankYouMessagesAfterUpload());
        } else {
            dispatch(setUploadPhase('idle'));
        }
    }, [dispatch, images, user?.enable_admin_tagging, getImageDataForUpload, t]);

    const cancelUploadFlow = useCallback(() => {
        isUploadCancelled.current = true;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        dispatch(resetUploadState());
        dispatch(cancelUpload());
    }, [dispatch]);

    /**
     * Retry uploads. Re-runs uploadPhotos on all remaining images.
     * Already-uploaded images skip the upload step and only re-post tags.
     * Tag posts are idempotent (PUT replaces).
     */
    const retryFailedUploads = useCallback(() => {
        dispatch(closeThankYouMessages());
        dispatch(resetUploadState());
        retryTimerRef.current = setTimeout(() => uploadPhotos(), 300);
    }, [dispatch, uploadPhotos]);

    // Cleanup on unmount
    const cleanup = useCallback(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        uploadPhotos,
        cancelUploadFlow,
        retryFailedUploads,
        isUploadCancelled,
        uploadAbortRef: abortControllerRef,
        cleanup
    };
}
