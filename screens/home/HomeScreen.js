import React, {useEffect, useState} from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
    changeSwiperIndex,
    clearEditingPhoto,
    deleteImage,
    deselectAllImages,
    selectSelectedCount
} from '../../reducers/photos_reducer';
import {fetchAndLoadUntagged} from '../../reducers/server_photos_reducer';
import {closeThankYouMessages, setUploadAbortReason} from '../../reducers/upload_flow_reducer';
import {deleteUploadPhoto} from '../../reducers/uploads_reducer';

import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Colors, Header, Title} from '../components';
import {isTagged} from '../../utils/isTagged';
import {useTranslation} from 'react-i18next';

// Components
import {ActionButton, UploadButton, UploadImagesGrid, UploadModal} from './homeComponents';

// Hooks
import useUploadPhotos from './useUploadPhotos';
import useHomeBootstrap from './useHomeBootstrap';

const HomeScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {height: SCREEN_HEIGHT} = useWindowDimensions();
    const {t} = useTranslation();

    // Boot: device model, permissions, gallery fetch, version check, untagged count
    useHomeBootstrap(navigation);

    // Upload orchestration
    const {
        uploadPhotos,
        cancelUploadFlow,
        retryFailedUploads,
        isUploadCancelled,
        uploadAbortRef,
        cleanup: uploadCleanup
    } = useUploadPhotos();

    useEffect(() => uploadCleanup, [uploadCleanup]);

    // Redux state
    const images = useSelector(state => state.photos.imagesArray);
    const token = useSelector(state => state.auth.token);
    const selected = useSelector(selectSelectedCount);
    const untaggedCount = useSelector(state => state.serverPhotos.untaggedCount);
    const untaggedPreview = useSelector(state => state.serverPhotos.untaggedPreview);

    // Upload flow state
    const showUploadModal = useSelector(state => state.uploadFlow.showUploadModal);
    const showThankYouMessages = useSelector(state => state.uploadFlow.showThankYouMessages);
    const uploadPhase = useSelector(state => state.uploadFlow.uploadPhase);
    const isUploading = uploadPhase !== 'idle';
    const currentUploadIndex = useSelector(state => state.uploadFlow.currentUploadIndex);
    const uploadAbortReason = useSelector(state => state.uploadFlow.uploadAbortReason);
    const totalToUpload = useSelector(state => state.uploadFlow.totalToUpload);
    const uploaded = useSelector(state => state.uploadFlow.uploaded);
    const uploadFailed = useSelector(state => state.uploadFlow.uploadFailed);
    const tagged = useSelector(state => state.uploadFlow.tagged);
    const taggedFailed = useSelector(state => state.uploadFlow.taggedFailed);
    const failedCounts = useSelector(state => state.uploadFlow.failedCounts);

    // Local UI state
    const [isSelectingImagesToDelete, setIsSelectingImagesToDelete] = useState(false);
    const [fetchingUntagged, setFetchingUntagged] = useState(false);

    // Abort upload loop if token expires mid-upload
    useEffect(() => {
        if (uploadAbortReason === 'token-expired') {
            isUploadCancelled.current = true;
            uploadAbortRef.current?.abort();
        }
    }, [uploadAbortReason, isUploadCancelled, uploadAbortRef]);

    // Show alert after re-login if upload was interrupted by token expiry
    useEffect(() => {
        if (token && uploadAbortReason === 'token-expired' && images.length > 0) {
            Alert.alert(
                t('Upload Interrupted'),
                t('Your session expired during upload. Your photos are preserved — press Upload to continue.'),
                [{text: t('OK'), onPress: () => dispatch(setUploadAbortReason(null))}]
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // --- Handlers ---

    const handleTagNextUntagged = async () => {
        setFetchingUntagged(true);
        dispatch(clearEditingPhoto());
        dispatch(changeSwiperIndex(0));
        const result = await dispatch(fetchAndLoadUntagged({perPage: 5}));
        setFetchingUntagged(false);

        if (result.meta?.requestStatus === 'fulfilled') {
            navigation.navigate('ADD_TAGS');
        } else {
            if (__DEV__) console.warn('[HomeScreen] fetchNextUntaggedPhoto:', result.payload);
            Alert.alert(t('No Photos'), t('No untagged photos found on the server.'));
        }
    };

    const handleToggleSelecting = () => {
        dispatch(deselectAllImages());
        setIsSelectingImagesToDelete(prev => !prev);
    };

    const deleteImages = async () => {
        const selectedImages = images.filter(img => img.selected);
        let serverFailCount = 0;

        for (const image of selectedImages) {
            if (image.uploaded) {
                const result = await dispatch(deleteUploadPhoto({photoId: image.id}));
                if (result.meta?.requestStatus === 'rejected') {
                    serverFailCount++;
                    continue;
                }
            }
            dispatch(deleteImage(image.id));
        }

        if (serverFailCount > 0) {
            Alert.alert(t('Error!'), t('{{count}} photo(s) could not be deleted from server.', {count: serverFailCount}));
        }
        setIsSelectingImagesToDelete(false);
    };

    // --- Render helpers ---

    const renderDeleteButton = () => {
        if (isSelectingImagesToDelete) {
            return (
                <Text style={[styles.normalWhiteText, {fontSize: SCREEN_HEIGHT * 0.02}]} onPress={handleToggleSelecting}>
                    {t('Cancel')}
                </Text>
            );
        }
        const hasLocalImages = images?.some(img => !img.uploaded);
        if (hasLocalImages) {
            return (
                <Text style={[styles.normalWhiteText, {fontSize: SCREEN_HEIGHT * 0.02}]} onPress={handleToggleSelecting}>
                    {t('Delete')}
                </Text>
            );
        }
        return null;
    };

    const renderActionButton = () => {
        let status = 'NO_IMAGES';
        let fabFunction = () => navigation.navigate('ALBUM');

        if (isSelectingImagesToDelete) {
            status = 'SELECTING';
            if (selected > 0) {
                status = 'SELECTED';
                fabFunction = deleteImages;
            }
        }

        return <ActionButton status={status} onPress={fabFunction} />;
    };

    const renderUploadButton = () => {
        if (images?.length === 0 || isSelectingImagesToDelete) return null;
        if (images?.length > 0 && images.every(img => img.uploaded && !isTagged(img))) return null;
        return <UploadButton onPress={uploadPhotos} />;
    };

    // --- Render ---

    return (
        <>
            <Header
                leftContent={<Title color="white" dictionary={'Upload'} />}
                rightContent={renderDeleteButton()}
            />
            <View style={styles.container}>
                <UploadModal
                    visible={showUploadModal}
                    isUploading={isUploading}
                    showThankYouMessages={showThankYouMessages}
                    uploadPhase={uploadPhase}
                    currentUploadIndex={currentUploadIndex}
                    totalToUpload={totalToUpload}
                    uploaded={uploaded}
                    uploadFailed={uploadFailed}
                    tagged={tagged}
                    taggedFailed={taggedFailed}
                    failedCounts={failedCounts}
                    onCancel={cancelUploadFlow}
                    onRetry={retryFailedUploads}
                    onClose={() => dispatch(closeThankYouMessages())}
                />

                <UploadImagesGrid
                    navigation={navigation}
                    images={images}
                    isSelecting={isSelectingImagesToDelete}
                    untaggedCount={untaggedCount}
                    untaggedPreview={untaggedPreview}
                    onTagUntagged={handleTagNextUntagged}
                    fetchingUntagged={fetchingUntagged}
                />

                {isSelectingImagesToDelete && (
                    <View style={styles.bottomContainer}>
                        <View style={styles.helperContainer}>
                            <Icon color={Colors.muted} name="information-circle-outline" size={32} />
                            <Body style={{marginLeft: 10}} color="muted" dictionary={'Select the images you want to delete'} />
                        </View>
                    </View>
                )}
            </View>

            {renderActionButton()}
            {renderUploadButton()}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.accentLight
    },
    normalWhiteText: {
        color: 'white'
    },
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
    }
});

export default HomeScreen;
