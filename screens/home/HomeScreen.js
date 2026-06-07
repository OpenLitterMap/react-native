import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
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
import {selectGeotaggedPhotos} from '../../reducers/gallery_reducer';
import {launchImageLibrary} from 'react-native-image-picker';
import {isTagged} from '../../utils/isTagged';
import {isValidGpsCoords} from '../../utils/gps';
import {readGpsFromExif} from '../../utils/readGpsFromExif';
import {checkCameraWithLocation, requestCameraWithLocation} from '../../utils/permissions/cameraPermission';
import CameraCapture from '../camera/CameraCapture';

import DeviceInfo from 'react-native-device-info';
import {Body, Caption, Colors, Header} from '../components';
import {useTranslation} from 'react-i18next';

// Dashboard sections
import {
    NUM_COLUMNS,
    InboxThumbnail,
    InboxControls,
    InboxEmpty,
    InboxFooter,
    useInbox,
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
    const recentPhotos = useSelector(selectGeotaggedPhotos);
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

    /** "Select More" — open the system gallery, import geotagged picks into the tag queue */
    const handleSelectMore = useCallback(async () => {
        let result;
        try {
            result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 0,
                includeExtra: true,
                quality: 1
            });
        } catch {
            Alert.alert(t('Error!'), t('Something went wrong. Please try again.'));
            return;
        }
        if (result.didCancel) return;
        if (result.errorCode) {
            Alert.alert(t('Error!'), result.errorMessage || t('Something went wrong. Please try again.'));
            return;
        }

        const imported = [];
        let skipped = 0;
        for (const asset of result.assets || []) {
            // react-native-image-picker doesn't return GPS — read from EXIF
            const gps = await readGpsFromExif(asset.uri);
            if (gps && isValidGpsCoords(gps.latitude, gps.longitude)) {
                imported.push({
                    id: asset.id || `picked_${asset.uri}`,
                    uri: asset.uri,
                    filename: asset.fileName || `picked_${Date.now()}.jpg`,
                    lat: gps.latitude,
                    lon: gps.longitude,
                    date: asset.timestamp
                        ? Math.floor(new Date(asset.timestamp).getTime() / 1000)
                        : Math.floor(Date.now() / 1000),
                    type: 'gallery',
                    platform: 'mobile',
                    customTags: [],
                    uploaded: false
                });
            } else {
                skipped += 1;
            }
        }

        if (imported.length === 0) {
            Alert.alert(t('Missing GPS Data'), t('None of the selected photos have location data.'));
            return;
        }

        dispatch(clearEditingPhoto());
        dispatch(addImages({images: imported, picked_up: null}));
        dispatch(changeSwiperIndex(images.length));
        if (skipped > 0) {
            Alert.alert(
                t('Missing GPS Data'),
                `${skipped} ${skipped === 1 ? t('photo') : t('photos')} ${t('skipped (no GPS data).')}`
            );
        }
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation, images, t]);

    // --- Inbox grid (the dashboard's virtualized list data) ---
    const inbox = useInbox(handleTapInboxPhoto);

    const renderInboxItem = useCallback(({item}) => (
        <InboxThumbnail
            photo={item}
            onPress={inbox.handlePhotoPress}
            isSelecting={inbox.isSelecting}
            isSelected={inbox.selectedUris.has(item.uri)}
            hasTag={inbox.taggedUris.has(item.uri)}
        />
    ), [inbox.handlePhotoPress, inbox.isSelecting, inbox.selectedUris, inbox.taggedUris]);

    // Re-render items when selection / tagging / select-mode changes.
    const inboxExtraData = useMemo(
        () => ({selecting: inbox.isSelecting, selected: inbox.selectedUris, tagged: inbox.taggedUris}),
        [inbox.isSelecting, inbox.selectedUris, inbox.taggedUris]
    );

    const listHeader = useMemo(() => (
        <>
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
            <InboxControls
                count={inbox.visiblePhotos.length}
                isSelecting={inbox.isSelecting}
                selectedCount={inbox.selectedUris.size}
                onToggleDelete={inbox.handleToggleDelete}
                onDeleteSelected={inbox.handleDeleteSelected}
                onSelectMore={handleSelectMore}
            />
        </>
    ), [
        handleTagUntaggedPhoto, handleTagAllUntagged, permissionStatus, refreshCameraRoll,
        inbox.visiblePhotos.length, inbox.isSelecting, inbox.selectedUris.size,
        inbox.handleToggleDelete, inbox.handleDeleteSelected, handleSelectMore
    ]);

    const listEmpty = useMemo(() => (
        <InboxEmpty
            permissionStatus={permissionStatus}
            requestPermission={requestPermission}
            totalGalleryPhotos={inbox.totalGalleryPhotos}
            hasMorePages={inbox.hasMorePages}
            isLoading={inbox.isLoading}
            onLoadMore={inbox.handleLoadMore}
        />
    ), [permissionStatus, requestPermission, inbox.totalGalleryPhotos, inbox.hasMorePages, inbox.isLoading, inbox.handleLoadMore]);

    const listFooter = useMemo(() => (
        <InboxFooter
            count={inbox.visiblePhotos.length}
            hasMoreToShow={inbox.hasMoreToShow}
            isLoading={inbox.isLoading}
            onLoadMore={inbox.handleLoadMore}
        />
    ), [inbox.visiblePhotos.length, inbox.hasMoreToShow, inbox.isLoading, inbox.handleLoadMore]);

    // --- Render ---

    return (
        <>
            <Header
                rightContent={<Caption color="white">v{DeviceInfo.getVersion()}</Caption>}
            />
            <View style={styles.container}>
                <FlashList
                    data={inbox.visiblePhotos}
                    renderItem={renderInboxItem}
                    keyExtractor={item => String(item.id)}
                    numColumns={NUM_COLUMNS}
                    extraData={inboxExtraData}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.accent}
                        />
                    }
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={listEmpty}
                    ListFooterComponent={listFooter}
                />
            </View>

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
