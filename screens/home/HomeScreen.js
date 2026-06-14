import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {fetchAllUntaggedPhotos} from '../../reducers/server_photos_reducer';
import {closeThankYouMessages, selectUploadFlow, setUploadAbortReason} from '../../reducers/upload_flow_reducer';
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
    NoGpsPicksCard,
    ImportProgressModal,
    useInbox,
    UntaggedSection,
    UploadModal,
    YourImpactSection
} from './homeComponents';
import CommunityStats from '../components/CommunityStats';

// Hooks
import useUploadPhotos from './useUploadPhotos';
import useHomeBootstrap from './useHomeBootstrap';
import {useRepeatTutorial} from '../../hooks/useRepeatTutorial';

// EXIF reads run with bounded concurrency so a large multi-select import doesn't read
// one-photo-at-a-time (each read has a 5s timeout). The progress modal shows only for
// larger batches; small picks finish before it'd matter.
const EXIF_CONCURRENCY = 6;
const PROGRESS_THRESHOLD = 6;

const HomeScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    // Boot: device model, stats, version check, untagged count
    const {refreshAll} = useHomeBootstrap(navigation);

    // Restart the onboarding tutorial from the beginning (empty-state CTA)
    const repeatTutorial = useRepeatTutorial();

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
    const pendingUploadCount = useMemo(
        () => images.filter(img => isTagged(img)).length,
        [images]
    );

    // Local UI state
    const [refreshing, setRefreshing] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [noGpsPicks, setNoGpsPicks] = useState([]);
    const [importProgress, setImportProgress] = useState(null); // {done,total} while reading EXIF
    const importCancelRef = useRef(false);

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

    /** Section 4: Tap a queued photo — jump the swiper to it (already in imagesArray) */
    const handleTapInboxPhoto = useCallback((photo) => {
        if (!photo.hasGps) return; // only geotagged photos are mappable
        dispatch(clearEditingPhoto());
        const idx = images.findIndex(img => img.uri === photo.uri);
        dispatch(changeSwiperIndex(idx >= 0 ? idx : 0));
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation, images]);

    /** Pull-to-refresh — refresh all dashboard data */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshAll();
        setRefreshing(false);
    }, [refreshAll]);

    /** "Add Photos" — system picker; geotagged picks enter the queue,
        non-geotagged surface in the dismissible no-GPS card (§3b). */
    const handleSelectMore = useCallback(async () => {
        let result;
        try {
            result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 0, // 0 = multi-select (PickMultipleVisualMedia)
                quality: 1
                // No includeExtra: RNIP ties it to library permissions. We read GPS
                // *and* capture time from EXIF via readGpsFromExif (meta.takenAt
                // below); only `id` goes unused (falls back to the uri). Keeps the
                // picker truly permission-free.
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

        const assets = result.assets || [];
        const imported = [];
        const skipped = [];

        // Read EXIF with bounded concurrency (not one-at-a-time). Show progress +
        // allow cancel only for larger batches.
        const showProgress = assets.length > PROGRESS_THRESHOLD;
        importCancelRef.current = false;
        if (showProgress) setImportProgress({done: 0, total: assets.length});

        try {
            for (let i = 0; i < assets.length; i += EXIF_CONCURRENCY) {
                if (importCancelRef.current) break;
                const chunk = assets.slice(i, i + EXIF_CONCURRENCY);
                // RNIP returns no GPS/capture time — read both from EXIF in one pass
                // (avoids includeExtra, which ties to library permissions)
                const metas = await Promise.all(
                    chunk.map(a => readGpsFromExif(a.uri).catch(() => null))
                );
                chunk.forEach((asset, j) => {
                    const meta = metas[j];
                    if (meta && isValidGpsCoords(meta.latitude, meta.longitude)) {
                        imported.push({
                            id: asset.id || `picked_${asset.uri}`,
                            uri: asset.uri,
                            // i + j is the asset's global index in this import, so the
                            // fallback name is unique per pick — without it, picks that
                            // share a millisecond (or the same generated name) would
                            // collide and could be dropped/overwritten downstream.
                            filename: asset.fileName || `picked_${Date.now()}_${i + j}.jpg`,
                            lat: meta.latitude,
                            lon: meta.longitude,
                            // EXIF capture time (epoch s); fall back to import time
                            // only when the photo carries no EXIF date
                            date: meta.takenAt ?? Math.floor(Date.now() / 1000),
                            type: 'gallery',
                            platform: 'mobile',
                            customTags: [],
                            uploaded: false
                        });
                    } else {
                        skipped.push({uri: asset.uri, filename: asset.fileName});
                    }
                });
                if (showProgress) {
                    setImportProgress({
                        done: Math.min(i + chunk.length, assets.length),
                        total: assets.length
                    });
                }
            }
        } finally {
            setImportProgress(null);
        }

        // Non-geotagged → summary card (not the queue; queue stays geotagged-only).
        // On cancel, keep whatever was already read.
        setNoGpsPicks(skipped);

        if (imported.length > 0) {
            dispatch(addImages({images: imported, picked_up: null}));
        }
    }, [dispatch, t]);

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
        <View style={styles.gridBleed}>
            <CommunityStats />
            <YourImpactSection />
            <UntaggedSection
                onTagPhoto={handleTagUntaggedPhoto}
                onTagAll={handleTagAllUntagged}
            />
            <NoGpsPicksCard picks={noGpsPicks} onDismiss={() => setNoGpsPicks([])} />
            <InboxControls
                count={inbox.visiblePhotos.length}
                isSelecting={inbox.isSelecting}
                selectedCount={inbox.selectedUris.size}
                onToggleDelete={inbox.handleToggleDelete}
                onDeleteSelected={inbox.handleDeleteSelected}
                onAddPhotos={handleSelectMore}
            />
        </View>
    ), [
        handleTagUntaggedPhoto, handleTagAllUntagged, noGpsPicks,
        inbox.visiblePhotos.length, inbox.isSelecting, inbox.selectedUris.size,
        inbox.handleToggleDelete, inbox.handleDeleteSelected, handleSelectMore
    ]);

    const listEmpty = useMemo(() => (
        <View style={styles.gridBleed}>
            <InboxEmpty onAddPhotos={handleSelectMore} onRepeatTutorial={repeatTutorial} />
        </View>
    ), [handleSelectMore, repeatTutorial]);

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

            <ImportProgressModal
                progress={importProgress}
                onCancel={() => { importCancelRef.current = true; }}
            />

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
        // Inset the grid to 16px (13 + each tile's 3px margin = 16). Full-width
        // sections cancel this with styles.gridBleed so they keep their own 16px.
        paddingHorizontal: 13,
        paddingBottom: 80
    },
    gridBleed: {
        marginHorizontal: -13
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
