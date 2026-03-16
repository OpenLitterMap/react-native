import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setDeviceModel} from '../../reducers/settings_reducer';
import {checkAppVersion} from '../../reducers/shared_reducer';
import {
    changeSwiperIndex,
    clearEditingPhoto,
    deleteImage,
    deselectAllImages,
    selectSelectedCount
} from '../../reducers/photos_reducer';
import {
    fetchAndLoadUntagged,
    fetchUntaggedCount
} from '../../reducers/server_photos_reducer';
import {
    cancelUpload,
    closeThankYouMessages,
    postTagsToPhoto,
    resetThankYouMessages,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    showThankYouMessagesAfterUpload,
    startUploading,
    uploadImage
} from '../../reducers/upload_flow_reducer';
import {getPhotosFromCameraroll} from '../../reducers/gallery_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {deleteUploadPhoto} from '../../reducers/uploads_reducer';

import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Colors, Header, Title} from '../components';

import {checkCameraRollPermission} from '../../utils/permissions';
import {isGeotagged} from '../../utils/isGeotagged';

// Components
import {ActionButton, UploadButton, UploadImagesGrid} from './homeComponents';
import DeviceInfo from 'react-native-device-info';
import {isTagged} from '../../utils/isTagged';
import buildTagsPayload from '../../utils/buildTagsPayload';
import {useTranslation} from 'react-i18next';

const HomeScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();
    const {t} = useTranslation();

    const isUploadCancelled = useRef(false);
    const abortControllerRef = useRef(null);
    const retryTimerRef = useRef(null);
    const [isSelectingImagesToDelete, setIsSelectingImagesToDelete] =
        useState(false);

    useEffect(() => {
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const appVersion = useSelector(state => state.shared?.appVersion);
    const images = useSelector(state => state.photos.imagesArray);
    const showUploadModal = useSelector(state => state.uploadFlow.showUploadModal);
    const deviceModel = useSelector(state => state.settings.deviceModel);
    const showThankYouMessages = useSelector(
        state => state.uploadFlow.showThankYouMessages
    );
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    // Upload progress
    const uploadPhase = useSelector(state => state.uploadFlow.uploadPhase);
    const isUploading = uploadPhase !== 'idle';
    const currentUploadIndex = useSelector(
        state => state.uploadFlow.currentUploadIndex
    );
    const uploadAbortReason = useSelector(
        state => state.uploadFlow.uploadAbortReason
    );

    // Number of selected images (memoized)
    const selected = useSelector(selectSelectedCount);
    const untaggedCount = useSelector(state => state.serverPhotos.untaggedCount);
    const untaggedPreview = useSelector(state => state.serverPhotos.untaggedPreview);
    const [fetchingUntagged, setFetchingUntagged] = useState(false);

    // Uploads
    const totalToUpload = useSelector(state => state.uploadFlow.totalToUpload);
    const uploaded = useSelector(state => state.uploadFlow.uploaded);
    const uploadFailed = useSelector(state => state.uploadFlow.uploadFailed);
    const tagged = useSelector(state => state.uploadFlow.tagged);
    const taggedFailed = useSelector(state => state.uploadFlow.taggedFailed);
    const failedCounts = useSelector(state => state.uploadFlow.failedCounts);

    // Abort the upload loop if token expires mid-upload
    useEffect(() => {
        if (uploadAbortReason === 'token-expired') {
            isUploadCancelled.current = true;
            // Abort the in-flight request immediately, don't wait for it to settle
            abortControllerRef.current?.abort();
        }
    }, [uploadAbortReason]);

    // Show alert after re-login if upload was interrupted by token expiry
    useEffect(() => {
        if (
            token &&
            uploadAbortReason === 'token-expired' &&
            images.length > 0
        ) {
            Alert.alert(
                t('Upload Interrupted'),
                t('Your session expired during upload. Your photos are preserved — press Upload to continue.'),
                [
                    {
                        text: t('OK'),
                        onPress: () => dispatch(setUploadAbortReason(null))
                    }
                ]
            );
        }
        // Only trigger on re-login, not when images/abort state changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        const getDeviceModel = () => {
            dispatch(setDeviceModel(DeviceInfo.getModel()));
        };

        const checkPermissionsAndFetchData = async () => {
            if (!user?.enable_admin_tagging && token) {
                dispatch(fetchUntaggedCount());
            }

            // Pre-fetch tags for the v5 tagging UI
            dispatch(fetchAllTags());

            if (!__DEV__) {
                await checkNewVersion();
            }

            checkGalleryPermission();
        };

        getDeviceModel();
        checkPermissionsAndFetchData();
        // Mount + auth-change only — intentionally excludes user/navigation
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const cancelText = t('Cancel');
    const deleteText = t('Delete');

    const cancelUploadWrapper = () => {
        isUploadCancelled.current = true;
        // Abort any in-flight axios request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        dispatch(resetUploadState());
        dispatch(cancelUpload());
    };

    const handleTagNextUntagged = async () => {
        setFetchingUntagged(true);
        dispatch(clearEditingPhoto());
        dispatch(changeSwiperIndex(0));
        const result = await dispatch(fetchAndLoadUntagged({perPage: 5}));
        setFetchingUntagged(false);

        if (result.meta?.requestStatus === 'fulfilled') {
            navigation.navigate('ADD_TAGS');
        } else {
            const errorMsg = result.payload || 'No untagged photos found';
            if (__DEV__) console.warn('[HomeScreen] fetchNextUntaggedPhoto:', errorMsg);
            Alert.alert(
                t('No Photos'),
                t('No untagged photos found on the server.')
            );
        }
    };

    async function checkGalleryPermission() {
        const result = await checkCameraRollPermission();

        if (result === 'granted' || result === 'limited') {
            const fetchType = result === 'limited' ? 'REFRESH' : undefined;
            await dispatch(getPhotosFromCameraroll(fetchType));
        } else {
            navigation.navigate('PERMISSION', {screen: 'GALLERY_PERMISSION'});
        }
    }

    async function checkNewVersion() {
        if (appVersion === null) {
            await dispatch(checkAppVersion());
        }
    }

    const compareVersions = (latestVersion, currentVersion) => {
        const latest = latestVersion.split('.');
        const current = currentVersion.split('.');
        const max = Math.max(latest.length, current.length);

        for (let i = 0; i < max; i++) {
            const latestPart = parseInt(latest[i], 10) || 0;
            const currentPart = parseInt(current[i], 10) || 0;

            if (latestPart > currentPart) {
                return 1;
            } else if (latestPart < currentPart) {
                return -1;
            }
        }

        return 0;
    };

    useEffect(() => {
        const platform = Platform.OS;
        const currentVersion = DeviceInfo.getVersion();

        if (appVersion) {
            const latestVersion = appVersion[platform]?.version;

            if (latestVersion) {
                const comparisonResult = compareVersions(
                    latestVersion,
                    currentVersion
                );

                if (comparisonResult > 0) {
                    navigation.navigate('UPDATE');
                }
            }
        }
    }, [appVersion, navigation]);

    /**
     * Navigate to album screen
     */
    const loadGallery = async () => {
        navigation.navigate('ALBUM');
    };

    /**
     * fn to determine the state of FAB
     */
    const renderActionButton = () => {
        let status = 'NO_IMAGES';
        let fabFunction = loadGallery;

        if (isSelectingImagesToDelete) {
            status = 'SELECTING';
            if (selected > 0) {
                status = 'SELECTED';
                fabFunction = deleteImages;
            }
        }

        return <ActionButton status={status} onPress={fabFunction} />;
    };

    /**
     * Render helper text when delete button is clicked
     */
    const renderHelperMessage = () => {
        if (isSelectingImagesToDelete) {
            return (
                <View style={[styles.helperContainer, {width: SCREEN_WIDTH - 150}]}>
                    <Icon
                        color={Colors.muted}
                        name="information-circle-outline"
                        size={32}
                    />
                    <Body
                        style={{marginLeft: 10}}
                        color="muted"
                        dictionary={'Select the images you want to delete'}
                    />
                </View>
            );
        }
    };

    const renderUploadButton = () => {
        if (images?.length === 0 || isSelectingImagesToDelete) {
            return;
        }

        // if all images are uploaded with no tags, return
        if (
            images?.length > 0 &&
            images.every(img => img.uploaded && !isTagged(img))
        ) {
            return;
        }

        return <UploadButton onPress={uploadPhotos} />;
    };

    /**
     * Render Delete / Cancel Header Button
     */
    const renderDeleteButton = () => {
        if (isSelectingImagesToDelete) {
            return (
                <Text
                    style={[styles.normalWhiteText, {fontSize: SCREEN_HEIGHT * 0.02}]}
                    onPress={handleToggleSelecting}>
                    {cancelText}
                </Text>
            );
        }

        // Only show Delete when there are local gallery images (not server uploads)
        const hasLocalImages = images?.some(img => !img.uploaded);
        if (hasLocalImages) {
            return (
                <Text
                    style={[styles.normalWhiteText, {fontSize: SCREEN_HEIGHT * 0.02}]}
                    onPress={handleToggleSelecting}>
                    {deleteText}
                </Text>
            );
        }

        return null;
    };

    /**
     * Toggle Selecting - header right
     */
    const handleToggleSelecting = () => {
        dispatch(deselectAllImages());

        setIsSelectingImagesToDelete(prev => !prev);
    };

    /**
     * Delete selected images. For uploaded images, also delete from server.
     */
    const deleteImages = async () => {
        const selectedImages = images.filter(img => img.selected);
        let serverFailCount = 0;

        for (const image of selectedImages) {
            if (image.uploaded) {
                const result = await dispatch(
                    deleteUploadPhoto({
                        photoId: image.id
                    })
                );

                if (result.meta?.requestStatus === 'rejected') {
                    serverFailCount++;
                    continue;
                }
            }

            dispatch(deleteImage(image.id));
        }

        if (serverFailCount > 0) {
            Alert.alert(
                t('Error!'),
                t('{{count}} photo(s) could not be deleted from server.', { count: serverFailCount })
            );
        }

        setIsSelectingImagesToDelete(false);
    };

    const getImageDataForUpload = img => {
        const isGeoTagged = isGeotagged(img);
        const photoHasTags = isTagged(img);

        // Upload any local image (gallery or camera) that has valid GPS
        if (!img.uploaded && isGeoTagged) {
            let imageData = new FormData();

            imageData.append('photo', {
                name: img.filename,
                type: 'image/jpeg',
                uri: img.uri
            });

            imageData.append('lat', img.lat);
            imageData.append('lon', img.lon);
            const timestamp = Number(img.date);
            if (Number.isFinite(timestamp)) {
                imageData.append('date', String(Math.round(timestamp)));
            }
            imageData.append('model', deviceModel);

            // Tags are always posted separately via POST /api/v3/tags
            return [imageData, photoHasTags, isGeoTagged];
        } else if (img.uploaded) {
            return [null, photoHasTags, true];
        }

        return [null, false, false];
    };

    /**
     * Upload photos, 1 photo per request.
     * Two-step for v5 tags: upload photo first, then POST tags separately.
     */
    const uploadPhotos = async () => {
        // Pre-upload validation: filter out non-geotagged gallery images
        const geotaggedImages = images.filter(isGeotagged);
        const skippedCount = images.length - geotaggedImages.length;

        if (skippedCount > 0) {
            const confirmed = await new Promise(resolve => {
                Alert.alert(
                    t('Missing GPS Data'),
                    `${geotaggedImages.length} ${t('of')} ${
                        images.length
                    } ${t('photos will be uploaded.')} ${skippedCount} ${
                        skippedCount === 1 ? t('photo') : t('photos')
                    } ${t('skipped (no GPS data).')}`,
                    [
                        {
                            text: t('Cancel'),
                            onPress: () => resolve(false),
                            style: 'cancel'
                        },
                        {text: t('Continue'), onPress: () => resolve(true)}
                    ]
                );
            });

            if (!confirmed) {
                return;
            }
        }

        dispatch(resetUploadState());
        dispatch(resetThankYouMessages());
        isUploadCancelled.current = false;
        abortControllerRef.current = new AbortController();

        // Count all items as work (gallery uploads + web tagging)
        dispatch(setTotalToUpload(geotaggedImages.length));

        // shared.js -> showUploadModal = true
        dispatch(startUploading());

        let failedUploads = 0;
        const failureReasons = [];

        if (geotaggedImages.length) {
            for (let i = 0; i < geotaggedImages.length; i++) {
                const img = geotaggedImages[i];

                if (isUploadCancelled.current) {
                    break;
                }

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
                            photoHasTags: false, // tags always posted separately
                            signal: abortControllerRef.current?.signal
                        })
                    );

                    if (result.meta?.requestStatus === 'rejected') {
                        failedUploads++;
                        failureReasons.push(result.payload?.userMessage || 'Upload failed');
                    } else if (
                        tagsPayload &&
                        tagsPayload.length > 0 &&
                        result.payload?.serverPhotoId
                    ) {
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
                    } else if (
                        result.meta?.requestStatus === 'fulfilled' &&
                        tagsPayload &&
                        tagsPayload.length > 0 &&
                        !result.payload?.serverPhotoId
                    ) {
                        // Upload succeeded but no server photo ID — can't post tags
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

        dispatch(setUploadPhase('idle'));
        if (!isUploadCancelled.current) {
            dispatch(showThankYouMessagesAfterUpload());
        }
    };

    /**
     * Retry uploads. Re-runs uploadPhotos on all remaining images.
     * Already-uploaded images skip the upload step and only re-post tags.
     * Tag posts are idempotent (PUT replaces).
     */
    const retryFailedUploads = () => {
        dispatch(closeThankYouMessages());
        dispatch(resetUploadState());
        // Small delay to let modal close, then re-trigger
        retryTimerRef.current = setTimeout(() => uploadPhotos(), 300);
    };

    /**
     * Close modal after uploading - shared_reducer
     */
    const hideThankYouMessages = () => {
        dispatch(closeThankYouMessages());
    };

    /**
     * Render the upload progress text based on current phase
     */
    const renderProgressText = () => {
        const current = currentUploadIndex + 1;
        const total = totalToUpload;

        if (uploadPhase === 'tagging') {
            return t('Tagging {{current}} of {{total}}...', {current, total});
        }
        return t('Uploading {{current}} of {{total}}...', {current, total});
    };

    /**
     * Render failure details in the thank-you modal
     */
    const renderFailureDetails = () => {
        const items = [];

        if (failedCounts.network > 0) {
            items.push(
                `${failedCounts.network} ${t('failed — no internet connection')}`
            );
        }
        if (failedCounts.timeout > 0) {
            items.push(`${failedCounts.timeout} ${t('failed — connection timed out')}`);
        }
        if (failedCounts.server > 0) {
            items.push(`${failedCounts.server} ${t('failed — server error')}`);
        }
        if (failedCounts.alreadyUploaded > 0) {
            items.push(`${failedCounts.alreadyUploaded} ${t('already uploaded')}`);
        }
        if (failedCounts.invalidCoordinates > 0) {
            items.push(
                `${failedCounts.invalidCoordinates} ${t('invalid coordinates')}`
            );
        }
        if (failedCounts.unknown > 0) {
            items.push(`${failedCounts.unknown} ${t('failed — unknown error')}`);
        }

        return items.map((text, i) => (
            <Text
                key={i}
                style={{
                    fontSize: 12,
                    fontFamily: 'Poppins-Regular',
                    color: '#92400e',
                    marginBottom: 2
                }}>
                {text}
            </Text>
        ));
    };

    const totalFailed = uploadFailed + taggedFailed;

    return (
        <>
            <Header
                leftContent={<Title color="white" dictionary={'Upload'} />}
                rightContent={renderDeleteButton()}
            />
            <View style={styles.container}>
                {/* INFO: modal to show during image upload */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showUploadModal}
                    onRequestClose={isUploading ? cancelUploadWrapper : hideThankYouMessages}>
                    {/* Uploading spinner with phase-aware progress */}
                    {isUploading && (
                        <View style={styles.modal}>
                            <Text style={[styles.uploadText, {fontSize: SCREEN_HEIGHT * 0.02}]}>
                                {totalToUpload > 0
                                    ? renderProgressText()
                                    : t('Please wait while your photos upload')}
                            </Text>

                            <ActivityIndicator style={{marginBottom: 10}} />

                            <Button
                                onPress={cancelUploadWrapper}
                                title={cancelText}
                            />
                        </View>
                    )}

                    {/* Upload result */}
                    {showThankYouMessages && (
                        <View style={styles.modal}>
                            <View style={[styles.resultCard, {width: SCREEN_WIDTH * 0.8}]}>
                                {/* Success state */}
                                {totalFailed === 0 && (
                                    <>
                                        <Icon
                                            name="checkmark-circle"
                                            size={48}
                                            color={Colors.accent}
                                            style={{marginBottom: 8}}
                                        />
                                        <Text style={styles.resultTitle}>
                                            {t('Thank you!!!')}
                                        </Text>
                                    </>
                                )}

                                {/* Partial failure state */}
                                {totalFailed > 0 && (
                                    <>
                                        <Icon
                                            name="alert-circle"
                                            size={48}
                                            color="#f59e0b"
                                            style={{marginBottom: 8}}
                                        />
                                        <Text style={styles.resultTitle}>
                                            {t('Upload incomplete')}
                                        </Text>
                                    </>
                                )}

                                {/* Stats row */}
                                <View style={styles.resultStats}>
                                    {uploaded > 0 ? (
                                        <View style={styles.resultStatItem}>
                                            <Text
                                                style={styles.resultStatNumber}>
                                                {uploaded}
                                            </Text>
                                            <Text
                                                style={styles.resultStatLabel}>
                                                {uploaded === 1
                                                    ? t('photo uploaded')
                                                    : t('photos uploaded')}
                                            </Text>
                                        </View>
                                    ) : tagged > 0 ? (
                                        <View style={styles.resultStatItem}>
                                            <Text
                                                style={styles.resultStatNumber}>
                                                {tagged}
                                            </Text>
                                            <Text
                                                style={styles.resultStatLabel}>
                                                {tagged === 1
                                                    ? t('tag added')
                                                    : t('tags added')}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Failure details */}
                                {totalFailed > 0 && (
                                    <View style={styles.resultFailure}>
                                        <Text style={styles.resultFailureTitle}>
                                            {totalFailed}{' '}
                                            {totalFailed === 1
                                                ? t('item')
                                                : t('items')}{' '}
                                            {t('failed')}
                                        </Text>
                                        {renderFailureDetails()}
                                    </View>
                                )}

                                {/* Buttons */}
                                <View style={styles.resultButtons}>
                                    {totalFailed > 0 && (
                                        <Pressable
                                            style={styles.resultActionButton}
                                            onPress={retryFailedUploads}>
                                            <Text
                                                style={styles.resultActionText}>
                                                {t('Retry')}
                                            </Text>
                                        </Pressable>
                                    )}
                                    <Pressable
                                        style={[
                                            styles.resultActionButton,
                                            totalFailed === 0 &&
                                                styles.resultCloseButtonSuccess
                                        ]}
                                        onPress={hideThankYouMessages}>
                                        <Text
                                            style={[
                                                styles.resultActionText,
                                                totalFailed === 0 &&
                                                    styles.resultCloseTextSuccess
                                            ]}>
                                            {totalFailed === 0
                                                ? t('Done')
                                                : t('Close')}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    )}
                </Modal>

                {/* Grid to display images -- 3 columns */}
                <UploadImagesGrid
                    navigation={navigation}
                    images={images}
                    isSelecting={isSelectingImagesToDelete}
                    untaggedCount={untaggedCount}
                    untaggedPreview={untaggedPreview}
                    onTagUntagged={handleTagNextUntagged}
                    fetchingUntagged={fetchingUntagged}
                />

                <View style={styles.bottomContainer}>
                    {renderHelperMessage()}
                </View>
            </View>

            {renderActionButton()}
            {renderUploadButton()}
        </>
    );
};

const styles = StyleSheet.create({
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20
    },
    helperContainer: {
        position: 'relative',
        bottom: 30,
        height: 80,
        flexDirection: 'row',
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: Colors.accentLight
    },
    normalWhiteText: {
        color: 'white'
    },
    modal: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    resultCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center'
    },
    resultTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16
    },
    resultStats: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16
    },
    resultStatItem: {
        alignItems: 'center'
    },
    resultStatNumber: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: Colors.accent
    },
    resultStatLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#888888',
        marginTop: 2
    },
    resultFailure: {
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        width: '100%',
        marginBottom: 16
    },
    resultFailureTitle: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4
    },
    resultButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%'
    },
    resultActionButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    resultActionText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#333333'
    },
    resultCloseButtonSuccess: {
        backgroundColor: Colors.accent
    },
    resultCloseTextSuccess: {
        color: '#ffffff'
    },
    uploadText: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10
    }
});

export default HomeScreen;
