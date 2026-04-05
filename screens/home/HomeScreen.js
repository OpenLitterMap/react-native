import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    addImages,
    addOnboardingPhoto,
    changeSwiperIndex,
    clearEditingPhoto,
    loadPhotoForEditing
} from '../../reducers/photos_reducer';
import {
    fetchAllUntaggedPhotos,
    fetchUntaggedCount
} from '../../reducers/server_photos_reducer';
import {closeThankYouMessages, selectUploadFlow, setUploadAbortReason} from '../../reducers/upload_flow_reducer';
import {getStats} from '../../reducers/stats_reducer';
import {selectRecentGeotaggedPhotos} from '../../reducers/gallery_reducer';
import {isTagged} from '../../utils/isTagged';
import {isValidGpsCoords} from '../../utils/gps';
import {checkCameraWithLocation, requestCameraWithLocation} from '../../utils/permissions/cameraPermission';
import CameraCapture from '../camera/CameraCapture';

import DeviceInfo from 'react-native-device-info';
import {Body, Caption, Colors, Header} from '../components';
import {useTranslation} from 'react-i18next';

// Dashboard sections
import {
    InboxSection,
    LimitedAccessBanner,
    UntaggedSection,
    UploadModal,
    YourImpactSection
} from './homeComponents';
import CommunityStats from '../components/CommunityStats';

// Hooks
import useUploadPhotos from './useUploadPhotos';
import useHomeBootstrap from './useHomeBootstrap';

const HomeScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    // Boot: device model, stats, camera roll, version check, untagged count
    const {permissionStatus, refreshCameraRoll, requestPermission} = useHomeBootstrap(navigation);

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
    const token = useSelector(state => state.auth.token);
    const images = useSelector(state => state.photos.imagesArray);

    // Upload flow state (single memoized selector)
    const {
        showUploadModal,
        showThankYouMessages,
        uploadPhase,
        currentUploadIndex,
        uploadAbortReason,
        totalToUpload,
        uploaded,
        uploadFailed,
        tagged,
        taggedFailed,
        failedCounts
    } = useSelector(selectUploadFlow);
    const isUploading = uploadPhase !== 'idle';

    // Count tagged photos ready to upload (for the upload button)
    const dismissedUris = useSelector(state => state.gallery.dismissedUris);
    const pendingUploadCount = useMemo(() => {
        const dismissed = new Set(dismissedUris || []);
        return images.filter(img => isTagged(img) && !dismissed.has(img.uri)).length;
    }, [images, dismissedUris]);

    // Local UI state
    const [refreshing, setRefreshing] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    // Camera FAB: check permissions, then open camera modal
    const handleCameraFab = useCallback(async () => {
        const {location, camera} = await checkCameraWithLocation();
        if (location === 'granted' && camera === 'granted') {
            setShowCamera(true);
            return;
        }
        // Request permissions if not granted
        const result = await requestCameraWithLocation();
        if (result.location === 'granted' && result.camera === 'granted') {
            setShowCamera(true);
        } else {
            Alert.alert(
                t('Camera & Location Required'),
                t('OpenLitterMap needs camera and location access to take GPS-tagged photos. Please enable them in Settings.'),
                [{text: t('OK')}]
            );
        }
    }, [t]);

    // Camera FAB: handle accepted photo
    const handleCameraPhoto = useCallback((preview) => {
        setShowCamera(false);

        if (!isValidGpsCoords(preview.lat, preview.lon)) {
            Alert.alert(
                t('No GPS Data'),
                t('This photo has no location data. Make sure location services are enabled and try again.')
            );
            return;
        }

        dispatch(addOnboardingPhoto({
            uri: preview.uri,
            filename: `capture_${Date.now()}.jpg`,
            lat: preview.lat,
            lon: preview.lon,
            width: preview.width,
            height: preview.height,
            type: 'image/jpeg'
        }));
        // Navigate to tagging — upload happens via normal HomeScreen flow after tagging
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation, t]);

    // Abort upload loop if token expires mid-upload
    useEffect(() => {
        if (uploadAbortReason === 'token-expired') {
            isUploadCancelled.current = true;
            uploadAbortRef.current?.abort();
        }
    }, [uploadAbortReason, isUploadCancelled, uploadAbortRef]);

    // Clear abort reason after re-login so the upload button becomes active again
    useEffect(() => {
        if (token && uploadAbortReason === 'token-expired') {
            dispatch(setUploadAbortReason(null));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // --- Handlers ---

    /** Section 3: Tap a single untagged server photo to tag it */
    const handleTagUntaggedPhoto = useCallback((photo) => {
        dispatch(clearEditingPhoto());
        dispatch(changeSwiperIndex(0));
        dispatch(loadPhotoForEditing({photo}));
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation]);

    /** Section 3: "Tag All" — load all untagged photos into edit queue */
    const handleTagAllUntagged = useCallback(async () => {
        dispatch(clearEditingPhoto());
        dispatch(changeSwiperIndex(0));

        const result = await dispatch(fetchAllUntaggedPhotos());
        if (result.meta?.requestStatus === 'fulfilled') {
            navigation.navigate('ADD_TAGS');
        } else {
            Alert.alert(t('No Photos'), t('No untagged photos found on the server.'));
        }
    }, [dispatch, navigation, t]);

    /** Section 4: Tap a camera roll photo — load all inbox photos, swipe to tapped one */
    const recentPhotos = useSelector(selectRecentGeotaggedPhotos);
    const handleTapInboxPhoto = useCallback((photo) => {
        dispatch(clearEditingPhoto());
        // Add all recent geotagged photos so user can swipe through the full inbox
        dispatch(addImages({images: recentPhotos, picked_up: null}));
        // addImages deduplicates — photo may already be in images from a prior tap.
        // Search existing array first, then fall back to appended position.
        const existingIdx = images.findIndex(img => img.uri === photo.uri);
        if (existingIdx >= 0) {
            dispatch(changeSwiperIndex(existingIdx));
        } else {
            // Photo was newly added — it's at the end after existing images
            const tappedOffset = recentPhotos.findIndex(p => p.uri === photo.uri);
            dispatch(changeSwiperIndex(images.length + Math.max(0, tappedOffset)));
        }
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation, recentPhotos, images]);

    /** Pull-to-refresh — refresh all dashboard data */
    const user = useSelector(state => state.auth.user);
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        const fetches = [
            dispatch(getStats()),
            refreshCameraRoll()
        ];
        if (!user?.enable_admin_tagging) {
            fetches.push(dispatch(fetchUntaggedCount()));
        }
        await Promise.allSettled(fetches);
        setRefreshing(false);
    }, [dispatch, refreshCameraRoll, user?.enable_admin_tagging]);

    // --- Render ---

    return (
        <>
            <Header
                rightContent={<Caption color="white">v{DeviceInfo.getVersion()}</Caption>}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.accent}
                    />
                }>
                <CommunityStats />
                <YourImpactSection />
                <UntaggedSection
                    onTagPhoto={handleTagUntaggedPhoto}
                    onTagAll={handleTagAllUntagged}
                />
                <LimitedAccessBanner
                    permissionStatus={permissionStatus}
                    onRefresh={refreshCameraRoll}
                />
                <InboxSection
                    onTapPhoto={handleTapInboxPhoto}
                    permissionStatus={permissionStatus}
                    requestPermission={requestPermission}
                />
            </ScrollView>

            {pendingUploadCount > 0 && !isUploading && (
                <View style={styles.uploadBarContainer}>
                    <Pressable onPress={uploadPhotos} style={styles.uploadBar}>
                        <Body style={styles.uploadBarText}>
                            {t('Upload')} ({pendingUploadCount})
                        </Body>
                    </Pressable>
                </View>
            )}

            {/* Camera FAB */}
            <Pressable
                onPress={handleCameraFab}
                style={({pressed}) => [
                    styles.cameraFab,
                    pressed && styles.cameraFabPressed
                ]}>
                <Icon name="camera" size={26} color={Colors.white} />
            </Pressable>

            {/* Camera Modal */}
            <Modal visible={showCamera} animationType="slide">
                <CameraCapture
                    onPhotoAccepted={handleCameraPhoto}
                    onCancel={() => setShowCamera(false)}
                    hintText="Point your camera at some litter and tap the button"
                />
            </Modal>

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
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    contentContainer: {
        paddingBottom: 80
    },
    uploadBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 30,
        paddingTop: 10,
        backgroundColor: 'rgba(245,247,250,0.95)'
    },
    uploadBar: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center'
    },
    uploadBarText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700'
    },
    cameraFab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6
    },
    cameraFabPressed: {
        backgroundColor: '#229954',
        shadowOpacity: 0.15
    }
});

export default HomeScreen;
