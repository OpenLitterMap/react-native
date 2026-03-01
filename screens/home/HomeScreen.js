import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setModel} from '../../reducers/settings_reducer';
import {
    cancelUpload,
    checkAppVersion,
    closeThankYouMessages,
    resetThankYouMessages,
    showThankYouMessagesAfterUpload,
    startUploading
} from '../../reducers/shared_reducer';
import {
    cancelUploadImages,
    deleteImage,
    deselectAllImages,
    getUntaggedImages,
    postTagsToPhoto,
    resetUploadState,
    setCurrentUploadIndex,
    setTotalToUpload,
    setUploadAbortReason,
    setUploadPhase,
    uploadImage
} from '../../reducers/images_reducer';
import {getPhotosFromCameraroll} from '../../reducers/gallery_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {deleteUploadPhoto} from '../../reducers/my_uploads_reducer';

import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Colors, Header, Title} from '../components';

import {checkCameraRollPermission} from '../../utils/permissions';
import {isGeotagged} from '../../utils/isGeotagged';

// Components
import {ActionButton, UploadButton, UploadImagesGrid} from './homeComponents';
import DeviceInfo from 'react-native-device-info';
import {isTagged} from '../../utils/isTagged';
import {useTranslation} from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const HomeScreen = ({navigation}) => {
    const dispatch = useDispatch();

    const isUploadCancelled = useRef(false);
    const [isSelectingImagesToDelete, setIsSelectingImagesToDelete] =
        useState(false);

    const appVersion = useSelector(state => state.shared.appVersion);
    const images = useSelector(state => state.images.imagesArray);
    const lang = useSelector(state => state.auth.lang);
    const showModal = useSelector(state => state.shared.showModal);
    const model = useSelector(state => state.settings.model);
    const showThankYouMessages = useSelector(
        state => state.shared.showThankYouMessages
    );
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const uniqueValue = useSelector(state => state.shared.uniqueValue);
    const isUploading = useSelector(state => state.shared.isUploading);
    // Upload progress
    const uploadPhase = useSelector(state => state.images.uploadPhase);
    const currentUploadIndex = useSelector(
        state => state.images.currentUploadIndex
    );
    const uploadAbortReason = useSelector(
        state => state.images.uploadAbortReason
    );

    // Number of selected images
    const selected = images.filter(img => img.selected).length;

    // Uploads
    const totalToUpload = useSelector(state => state.images.totalToUpload);
    const uploaded = useSelector(state => state.images.uploaded);
    const uploadFailed = useSelector(state => state.images.uploadFailed);
    const tagged = useSelector(state => state.images.tagged);
    const taggedFailed = useSelector(state => state.images.taggedFailed);
    const failedCounts = useSelector(state => state.images.failedCounts);

    // Abort the upload loop if token expires mid-upload
    useEffect(() => {
        if (uploadAbortReason === 'token-expired') {
            isUploadCancelled.current = true;
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
                'Upload Interrupted',
                'Your session expired during upload. Your photos are preserved — press Upload to continue.',
                [
                    {
                        text: 'OK',
                        onPress: () => dispatch(setUploadAbortReason(null))
                    }
                ]
            );
        }
    }, [token]);

    useEffect(() => {
        const getModel = () => {
            const model = DeviceInfo.getModel();

            dispatch(setModel(model));
        };

        const checkPermissionsAndFetchData = async () => {
            if (!user?.enable_admin_tagging && token) {
                await dispatch(getUntaggedImages({token}));
            }

            // Pre-fetch tags for the v5 tagging UI
            dispatch(fetchAllTags({token}));

            if (!__DEV__) {
                await checkNewVersion();
            }

            checkGalleryPermission();
        };

        getModel();
        checkPermissionsAndFetchData();
    }, [token]);

    const {t} = useTranslation();
    const cancelText = t('Cancel');
    const deleteText = t('Delete');

    const cancelUploadWrapper = () => {
        isUploadCancelled.current = true;
        dispatch(cancelUpload());
    };

    async function checkGalleryPermission() {
        const result = await checkCameraRollPermission();

        if (result === 'granted' || result === 'limited') {
            await dispatch(getPhotosFromCameraroll());
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

        for (let i = 0; i < latest.length; i++) {
            const latestPart = parseInt(latest[i], 10);
            const currentPart = parseInt(current[i], 10);

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
    }, [appVersion]);

    /**
     * Navigate to album screen
     */
    const loadGallery = async () => {
        navigation.navigate('ALBUM', {screen: 'GALLERY'});
    };

    /**
     * fn to determine the state of FAB
     */
    const renderActionButton = () => {
        let status = 'NO_IMAGES';
        let fabFunction = loadGallery;

        if (images?.length === 0) {
            status = 'NO_IMAGES';
            fabFunction = loadGallery;
        }

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
                <View style={styles.helperContainer}>
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
                    style={styles.normalWhiteText}
                    onPress={handleToggleSelecting}>
                    {cancelText}
                </Text>
            );
        }

        if (images?.length > 0) {
            return (
                <Text
                    style={styles.normalWhiteText}
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

        setIsSelectingImagesToDelete(!isSelectingImagesToDelete);
    };

    /**
     * if image is of type WEB -- hit api to delete uploaded image
     * then delete from state
     *
     * else
     * delete images from state based on id
     */
    const deleteImages = async () => {
        const selectedImages = images.filter(img => img.selected);

        for (const image of selectedImages) {
            if (image.uploaded) {
                const result = await dispatch(
                    deleteUploadPhoto({
                        token,
                        photoId: image.id
                    })
                );

                if (result.meta?.requestStatus === 'rejected') continue;
            }

            dispatch(deleteImage(image.id));
        }

        setIsSelectingImagesToDelete(false);
    };

    /**
     * Build v5 tags payload from an image's tagsV5 array.
     * Uses CLO format: { category_litter_object_id, litter_object_type_id, ... }
     */
    const buildV5TagsPayload = img => {
        if (!img.tagsV5 || img.tagsV5.length === 0) {
            return null;
        }

        const v5Tags = img.tagsV5.map(tag => ({
            category_litter_object_id: tag.cloId,
            litter_object_type_id: tag.typeId || null,
            quantity: tag.quantity,
            picked_up: img.picked_up ? true : false,
            materials: tag.materials || [],
            brands: (tag.brands || []).map(b => ({
                id: b.id,
                quantity: b.quantity || 1
            })),
            custom_tags: tag.customTags || []
        }));

        // Attach image-level custom tags to the first tag entry (deduplicated)
        if (v5Tags.length > 0 && img.customTags && img.customTags.length > 0) {
            const existing = new Set(v5Tags[0].custom_tags);
            const newTags = img.customTags.filter(ct => !existing.has(ct));
            v5Tags[0].custom_tags = [...v5Tags[0].custom_tags, ...newTags];
        }

        return v5Tags;
    };

    const getImageDataForUpload = img => {
        const isGeoTagged = isGeotagged(img);
        const photoHasTags = isTagged(img);

        // Upload any new image that is tagged or not
        if (img.type === 'gallery' && isGeoTagged) {
            let imageData = new FormData();

            imageData.append('photo', {
                name: img.filename,
                type: 'image/jpeg',
                uri: img.uri
            });

            imageData.append('lat', img.lat);
            imageData.append('lon', img.lon);
            imageData.append('date', parseInt(img.date));
            imageData.append('picked_up', img.picked_up ? 1 : 0);
            imageData.append('model', model);

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
                    'Missing GPS Data',
                    `${geotaggedImages.length} of ${
                        images.length
                    } photos will be uploaded. ${skippedCount} ${
                        skippedCount === 1 ? 'photo' : 'photos'
                    } skipped (no GPS data).`,
                    [
                        {
                            text: 'Cancel',
                            onPress: () => resolve(false),
                            style: 'cancel'
                        },
                        {text: 'Continue', onPress: () => resolve(true)}
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

        // Count all items as work (gallery uploads + web tagging)
        dispatch(setTotalToUpload(geotaggedImages.length));

        // shared.js -> showModal = true; isUploading = true;
        dispatch(startUploading());

        if (geotaggedImages.length) {
            for (let i = 0; i < geotaggedImages.length; i++) {
                const img = geotaggedImages[i];

                if (isUploadCancelled.current) {
                    dispatch(cancelUploadImages());
                    break;
                }

                dispatch(setCurrentUploadIndex(i));

                const [imageData, , isGeoTagged] =
                    getImageDataForUpload(img);

                const v5Payload = buildV5TagsPayload(img);

                if (img.type === 'gallery' && isGeoTagged) {
                    dispatch(setUploadPhase('uploading'));

                    const result = await dispatch(
                        uploadImage({
                            token,
                            imageData,
                            imageId: img.id,
                            imageUri: img.uri,
                            enableAdminTagging: user?.enable_admin_tagging,
                            photoHasTags: false // tags always posted separately
                        })
                    );

                    if (
                        v5Payload &&
                        v5Payload.length > 0 &&
                        result.payload?.photo_id
                    ) {
                        dispatch(setUploadPhase('tagging'));

                        await dispatch(
                            postTagsToPhoto({
                                token,
                                photoId: result.payload.photo_id,
                                tags: v5Payload,
                                pickedUp: img.picked_up
                            })
                        );
                    } else if (result.payload?.photo_id) {
                        dispatch(deleteImage(result.payload.photo_id));
                    }
                } else if (
                    img.uploaded &&
                    v5Payload &&
                    v5Payload.length > 0
                ) {
                    dispatch(setUploadPhase('tagging'));

                    await dispatch(
                        postTagsToPhoto({
                            token,
                            photoId: img.id,
                            tags: v5Payload,
                            pickedUp: img.picked_up
                        })
                    );
                }
            }
        }

        dispatch(setUploadPhase('idle'));
        dispatch(showThankYouMessagesAfterUpload());
    };

    /**
     * Retry only the failed uploads (images still in state)
     */
    const retryFailedUploads = () => {
        dispatch(closeThankYouMessages());
        dispatch(resetUploadState());
        // Small delay to let modal close, then re-trigger
        setTimeout(() => uploadPhotos(), 300);
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
            return `Tagging ${current} of ${total}...`;
        }
        return `Uploading ${current} of ${total}...`;
    };

    /**
     * Render failure details in the thank-you modal
     */
    const renderFailureDetails = () => {
        const items = [];

        if (failedCounts.network > 0) {
            items.push(
                `${failedCounts.network} failed — no internet connection`
            );
        }
        if (failedCounts.timeout > 0) {
            items.push(`${failedCounts.timeout} failed — connection timed out`);
        }
        if (failedCounts.server > 0) {
            items.push(`${failedCounts.server} failed — server error`);
        }
        if (failedCounts.alreadyUploaded > 0) {
            items.push(`${failedCounts.alreadyUploaded} already uploaded`);
        }
        if (failedCounts.invalidCoordinates > 0) {
            items.push(
                `${failedCounts.invalidCoordinates} invalid coordinates`
            );
        }
        if (failedCounts.unknown > 0) {
            items.push(`${failedCounts.unknown} failed — unknown error`);
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
                    visible={showModal}>
                    {/* Uploading spinner with phase-aware progress */}
                    {isUploading && (
                        <View style={styles.modal}>
                            <Text style={styles.uploadText}>
                                {totalToUpload > 0
                                    ? renderProgressText()
                                    : t('Please wait while your photos upload')}
                            </Text>

                            <ActivityIndicator style={{marginBottom: 10}} />

                            <Button
                                onPress={cancelUploadWrapper}
                                title="Cancel"
                            />
                        </View>
                    )}

                    {/* Upload result */}
                    {showThankYouMessages && (
                        <View style={styles.modal}>
                            <View style={styles.resultCard}>
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
                                            Upload incomplete
                                        </Text>
                                    </>
                                )}

                                {/* Stats row */}
                                <View style={styles.resultStats}>
                                    {uploaded > 0 && (
                                        <View style={styles.resultStatItem}>
                                            <Text style={styles.resultStatNumber}>
                                                {uploaded}
                                            </Text>
                                            <Text style={styles.resultStatLabel}>
                                                {uploaded === 1
                                                    ? 'photo uploaded'
                                                    : 'photos uploaded'}
                                            </Text>
                                        </View>
                                    )}
                                    {tagged > 0 && (
                                        <View style={styles.resultStatItem}>
                                            <Text style={styles.resultStatNumber}>
                                                {tagged}
                                            </Text>
                                            <Text style={styles.resultStatLabel}>
                                                {tagged === 1
                                                    ? 'photo tagged'
                                                    : 'photos tagged'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Failure details */}
                                {totalFailed > 0 && (
                                    <View style={styles.resultFailure}>
                                        <Text style={styles.resultFailureTitle}>
                                            {totalFailed}{' '}
                                            {totalFailed === 1
                                                ? 'item'
                                                : 'items'}{' '}
                                            failed
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
                                            <Text style={styles.resultActionText}>
                                                Retry
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
                                                ? 'Done'
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
                    lang={lang}
                    uniqueValue={uniqueValue}
                    isSelecting={isSelectingImagesToDelete}
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
        width: SCREEN_WIDTH - 150,
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
    normalText: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    normalWhiteText: {
        color: 'white',
        fontSize: SCREEN_HEIGHT * 0.02
    },
    modal: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    photo: {
        height: 100,
        width: SCREEN_WIDTH * 0.325,
        marginRight: 2
    },
    photos: {
        flexDirection: 'row',
        marginLeft: 2,
        width: SCREEN_WIDTH * 0.99
    },
    resultCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: SCREEN_WIDTH * 0.8,
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
        fontSize: SCREEN_HEIGHT * 0.02,
        fontWeight: 'bold',
        marginBottom: 10
    }
});

export default HomeScreen;
