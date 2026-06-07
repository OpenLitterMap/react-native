import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';
import StepIndicator from './components/StepIndicator';
import OnboardingChips from './components/OnboardingChips';
import TooltipOverlay from './components/TooltipOverlay';
import TagSearchBar from '../addTag/components/TagSearchBar';
import TagPills from '../addTag/components/TagPills';
import TagDetailSheet from '../addTag/components/TagDetailSheet';
import {makeTagKey, parseTagKey, resolveTagEntry} from '../addTag/components/tagUtils';
import useTagDraft from '../addTag/hooks/useTagDraft';
import {commitDraftToPhoto, deleteImage} from '../../reducers/photos_reducer';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';
import {uploadImage, addTagsToPhoto} from '../../reducers/upload_flow_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import buildTagsPayload from '../../utils/buildTagsPayload';

/**
 * Guided tagging screen for onboarding.
 * Uses the same useTagDraft hook as AddTagScreen — tags are managed in local
 * state and committed to Redux on save. This is the pattern that works.
 */
const TOOLTIP_COUNT = 3;

const OnboardingTagScreen = ({navigation}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    const imagesArray = useSelector(state => state.photos.imagesArray);
    const swiperIndex = useSelector(state => state.photos.swiperIndex);
    const {objectEntries, entriesByCloId, typeEntriesByKey, materialsById, brandsById, fetchStatus} = useSelector(
        state => state.tags,
        shallowEqual
    );

    const photo = imagesArray[swiperIndex];

    // Ensure tags are loaded — on clean install, HomeScreen hasn't mounted yet
    useEffect(() => {
        if (!objectEntries || objectEntries.length === 0) {
            dispatch(fetchAllTags());
        }
    }, [dispatch, objectEntries]);

    // Use the same draft hook as AddTagScreen
    const defaultPickedUp = useSelector(state => state.auth.user?.picked_up ?? null);
    const draft = useTagDraft(photo, defaultPickedUp);
    const {currentTags, currentCustomTags} = draft;

    const selectedCloIds = useMemo(() => currentTags.map(t => t.cloId), [currentTags]);

    const brandsArray = useMemo(
        () => brandsById
            ? Object.values(brandsById).sort((a, b) => a.name.localeCompare(b.name))
            : [],
        [brandsById]
    );

    const materialsArray = useMemo(
        () => materialsById ? Object.values(materialsById) : [],
        [materialsById]
    );

    // --- Detail sheet ---
    const [detailTag, setDetailTag] = useState(null);

    const handleOpenDetail = useCallback(tag => {
        setDetailTag(makeTagKey(tag.cloId, tag.typeId));
    }, []);

    const handleCloseDetail = useCallback(() => {
        setDetailTag(null);
    }, []);

    const [detailCloId, detailTypeId] = useMemo(() => {
        if (!detailTag) return [null, null];
        return parseTagKey(detailTag);
    }, [detailTag]);

    const detailTagCurrent = useMemo(() => {
        if (!detailTag) return null;
        return currentTags.find(
            tag => tag.cloId === detailCloId && (tag.typeId ?? null) === (detailTypeId ?? null)
        );
    }, [detailTag, detailCloId, detailTypeId, currentTags]);

    const detailTagEntry = useMemo(() => {
        if (!detailTag) return null;
        return resolveTagEntry(detailCloId, detailTypeId, entriesByCloId, typeEntriesByKey);
    }, [detailTag, detailCloId, detailTypeId, entriesByCloId, typeEntriesByKey]);

    const handleDetailToggleMaterial = useCallback(
        materialId => draft.toggleMaterial(detailCloId, detailTypeId, materialId),
        [draft, detailCloId, detailTypeId]
    );
    const handleDetailAddBrand = useCallback(
        brandId => draft.addBrand(detailCloId, detailTypeId, brandId),
        [draft, detailCloId, detailTypeId]
    );
    const handleDetailRemoveBrand = useCallback(
        brandId => draft.removeBrand(detailCloId, detailTypeId, brandId),
        [draft, detailCloId, detailTypeId]
    );
    const handleDetailAddCustomTag = useCallback(
        text => draft.addCustomTag(detailCloId, detailTypeId, text),
        [draft, detailCloId, detailTypeId]
    );
    const handleDetailRemoveCustomTag = useCallback(
        text => draft.removeCustomTag(detailCloId, detailTypeId, text),
        [draft, detailCloId, detailTypeId]
    );
    const handleDetailSetPickedUp = useCallback(
        (cloId, typeId, value) => draft.setPickedUp(cloId, typeId, value),
        [draft]
    );

    // Ref to read latest draft in callbacks
    const draftRef = useRef({currentTags, currentCustomTags});
    draftRef.current = {currentTags, currentCustomTags};

    const tooltipSteps = useMemo(() => [
        {message: t('What type of litter is it? Search from our list or type anything and press Enter to create a Custom Tag'), hint: null, position: 'bottom'},
        {message: t('Great! You can set the quantity or add more tags'), hint: t('You can update your tags later'), position: 'mid'},
        {message: t("Tap 'Done' to save your tags"), hint: null, position: 'top'}
    ], [t]);

    // Picked up toggle — applies to all tags in this onboarding photo
    const [pickedUp, setPickedUp] = useState(defaultPickedUp ?? false);

    const handleTogglePickedUp = useCallback((value) => {
        setPickedUp(value);
        // Apply to all existing tags in the draft
        for (const tag of currentTags) {
            draft.setPickedUp(tag.cloId, tag.typeId ?? null, value);
        }
    }, [currentTags, draft]);

    const user = useSelector(state => state.auth.user);
    const deviceModel = useSelector(state => state.settings.deviceModel);

    // Upload state
    const [uploadState, setUploadState] = useState('idle'); // idle | uploading | tagging | error
    const [uploadError, setUploadError] = useState(null);

    // Tooltip step tracking
    const [tooltipStep, setTooltipStep] = useState(0);
    const [pendingCustomTag, setPendingCustomTag] = useState(null);
    const searchBarRef = useRef(null);

    // Show tooltip step 1 when user adds their first tag
    const hasAddedFirstTag = useRef(false);
    useEffect(() => {
        if (currentTags.length > 0 && !hasAddedFirstTag.current) {
            hasAddedFirstTag.current = true;
            setTooltipStep(1);
        }
    }, [currentTags.length]);

    const hasShownDoneTooltip = useRef(false);
    const handleAddTag = useCallback(
        (cloId, typeId) => {
            draft.addTag(cloId, typeId);
            draft.setPickedUp(cloId, typeId ?? null, pickedUp);
            // Show "Tap Done" tooltip on second tag add (only once)
            if (hasAddedFirstTag.current && !hasShownDoneTooltip.current) {
                hasShownDoneTooltip.current = true;
                setTooltipStep(2);
            }
        },
        [draft, pickedUp]
    );

    const handleRemoveTag = useCallback(
        (cloId, typeId) => draft.removeTag(cloId, typeId),
        [draft]
    );

    const handleUpdateQuantity = useCallback(
        (cloId, typeId, quantity) => draft.updateQuantity(cloId, typeId, quantity),
        [draft]
    );

    const handleAddCustomTag = useCallback(
        text => draft.addImageCustomTag(text),
        [draft]
    );

    const handleRemoveCustomTag = useCallback(
        text => draft.removeImageCustomTag(text),
        [draft]
    );

    const commitTags = useCallback(() => {
        let justAddedCustomTag = null;
        if (pendingCustomTag?.trim()) {
            justAddedCustomTag = pendingCustomTag.trim();
            draft.addImageCustomTag(justAddedCustomTag);
            setPendingCustomTag(null);
            searchBarRef.current?.clearQuery?.();
        }

        const {currentTags: tags, currentCustomTags: customs} = draftRef.current;
        const mergedCustoms = justAddedCustomTag && !customs.includes(justAddedCustomTag)
            ? [...customs, justAddedCustomTag]
            : customs;

        if (tags.length === 0 && mergedCustoms.length === 0) return null;

        Keyboard.dismiss();

        dispatch(commitDraftToPhoto({
            imageIndex: swiperIndex,
            tags,
            customTags: mergedCustoms
        }));

        return {tags, customTags: mergedCustoms};
    }, [pendingCustomTag, draft, dispatch, swiperIndex]);

    const handleUploadLater = useCallback(async () => {
        const committed = commitTags();
        if (!committed) return;
        // Mark onboarding complete and go to HomeScreen — photo stays in queue
        await setOnboardingComplete(user?.id);
        dispatch(markOnboardingComplete());
    }, [commitTags, dispatch, user]);

    const handleDone = useCallback(async () => {
        const committed = commitTags();
        if (!committed) return;
        const {tags, customTags: mergedCustoms} = committed;

        // Build the photo object with committed tags for upload
        const img = {
            ...photo,
            tags,
            customTags: mergedCustoms
        };

        // --- Step 1: Upload photo binary ---
        setUploadState('uploading');
        setUploadError(null);

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
        if (deviceModel) imageData.append('model', deviceModel);

        const uploadResult = await dispatch(uploadImage({
            imageData,
            photoId: img.id,
            imageUri: img.uri,
            enableAdminTagging: user?.enable_admin_tagging,
            photoHasTags: true
        }));

        if (uploadResult.meta?.requestStatus !== 'fulfilled') {
            setUploadState('error');
            setUploadError(t('Photo upload failed. Check your connection and try again.'));
            return;
        }

        const serverPhotoId = uploadResult.payload?.serverPhotoId;

        // --- Step 2: Submit tags ---
        setUploadState('tagging');

        const tagsPayload = buildTagsPayload(img);
        if (tagsPayload && serverPhotoId) {
            const tagResult = await dispatch(addTagsToPhoto({
                photoId: serverPhotoId,
                tags: tagsPayload
            }));

            if (tagResult.meta?.requestStatus !== 'fulfilled') {
                setUploadState('error');
                setUploadError(t('Tag submission failed. Check your connection and try again.'));
                return;
            }
        }

        setUploadState('idle');
        navigation.replace('CELEBRATION', {
            serverPhotoId,
            lat: photo.lat,
            lon: photo.lon
        });
    }, [
        commitTags, dispatch, navigation,
        photo, user, deviceModel, t
    ]);

    const handleDeletePhoto = useCallback(() => {
        if (photo?.id) {
            dispatch(deleteImage(photo.id));
        }
        navigation.goBack();
    }, [dispatch, photo, navigation]);

    const dismissTooltip = useCallback(() => {
        // Hide the current tooltip. The next one appears when its
        // trigger fires (first tag added → step 1, second tag → step 2).
        setTooltipStep(-1);
    }, []);

    if (!photo) return null;

    const tagsLoading = (!objectEntries || objectEntries.length === 0) && fetchStatus !== 'failed';
    const tagsFailed = fetchStatus === 'failed' && (!objectEntries || objectEntries.length === 0);
    const hasTags = currentTags.length > 0 || currentCustomTags.length > 0 || !!pendingCustomTag?.trim();
    const currentTooltip = tooltipStep >= 0 && tooltipStep < TOOLTIP_COUNT
        ? tooltipSteps[tooltipStep]
        : null;

    return (
        <View style={styles.container}>
            {/* Step indicator on light background */}
            <View style={[styles.stepBar, {paddingTop: insets.top}]}>
                <StepIndicator currentStep={2} completedSteps={[1]} />
            </View>

            {/* Photo display */}
            <View style={styles.imageContainer}>
                <View style={styles.imageWrapper}>
                    <Image
                        source={{uri: photo.uri}}
                        style={styles.photo}
                        resizeMode="cover"
                    />
                    <Pressable
                        onPress={handleDeletePhoto}
                        style={({pressed}) => [
                            styles.deletePhotoButton,
                            pressed && styles.deletePhotoButtonPressed
                        ]}>
                        <Icon name="trash" size={20} color="#ff4444" />
                    </Pressable>
                </View>
            </View>

            {/* Editor panel */}
            <KeyboardAvoidingView
                style={[styles.editorPanel, {paddingBottom: insets.bottom + 8}]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>

                {tagsFailed ? (
                    <View style={styles.loadingContainer}>
                        <Icon name="cloud-offline-outline" size={40} color={Colors.muted} />
                        <Caption color="muted" style={styles.loadingText}>
                            {t("Couldn't load tags. Check your connection.")}
                        </Caption>
                        <Pressable
                            onPress={() => dispatch(fetchAllTags({forceRefresh: true}))}
                            style={({pressed}) => [
                                styles.retryButton,
                                pressed && styles.retryButtonPressed
                            ]}>
                            <Body color="accent" family="semiBold">{t('Try again')}</Body>
                        </Pressable>
                    </View>
                ) : tagsLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.accent} />
                        <Caption color="muted" style={styles.loadingText}>
                            {t('Loading tags...')}
                        </Caption>
                    </View>
                ) : (
                    <>
                        {/* Selected tags */}
                        {hasTags && (
                            <TagPills
                                tags={currentTags}
                                customTags={currentCustomTags}
                                entriesByCloId={entriesByCloId}
                                typeEntriesByKey={typeEntriesByKey}
                                onRemove={handleRemoveTag}
                                onRemoveCustomTag={handleRemoveCustomTag}
                                onUpdateQuantity={handleUpdateQuantity}
                                onOpenDetail={handleOpenDetail}
                            />
                        )}

                        {/* Quick-select chips */}
                        <OnboardingChips
                            objectEntries={objectEntries}
                            onSelect={handleAddTag}
                            selectedCloIds={selectedCloIds}
                        />

                        {/* Search bar */}
                        <TagSearchBar
                            ref={searchBarRef}
                            objectEntries={objectEntries}
                            entriesByCloId={entriesByCloId}
                            currentTags={currentTags}
                            customTags={currentCustomTags}
                            brands={brandsArray}
                            onAddTag={handleAddTag}
                            onAddCustomTag={handleAddCustomTag}
                            onPendingCustomTag={setPendingCustomTag}
                            showBrowser={false}
                        />

                        {/* Picked up toggle */}
                        <View style={styles.pickedUpRow}>
                            <Body style={styles.pickedUpLabel}>
                                {t('Picked Up?')}
                            </Body>
                            <Switch
                                value={pickedUp}
                                onValueChange={handleTogglePickedUp}
                                trackColor={{false: '#ddd', true: Colors.accentLight}}
                                thumbColor={pickedUp ? Colors.accent : '#f4f4f4'}
                            />
                        </View>

                        {/* Done button */}
                        <Pressable
                            onPress={() => {
                                Alert.alert(
                                    t('Upload now?'),
                                    t('Your data point, location & photo will appear on the map immediately.'),
                                    [
                                        {text: t('Upload later'), style: 'cancel', onPress: handleUploadLater},
                                        {text: t('Upload now'), onPress: handleDone}
                                    ]
                                );
                            }}
                            disabled={!hasTags || uploadState !== 'idle'}
                            style={({pressed}) => [
                                styles.doneButton,
                                (!hasTags || uploadState !== 'idle') && styles.doneButtonDisabled,
                                pressed && hasTags && styles.doneButtonPressed
                            ]}>
                            <Icon name="checkmark-circle" size={22} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.doneText}>
                                {t('Done')}
                            </Body>
                        </Pressable>

                    </>
                )}
            </KeyboardAvoidingView>

            {/* Upload overlay */}
            {(uploadState === 'uploading' || uploadState === 'tagging') && (
                <View style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <ActivityIndicator size="large" color={Colors.accent} />
                        <Body family="semiBold" style={styles.uploadText}>
                            {uploadState === 'uploading'
                                ? t('Uploading your photo...')
                                : t('Submitting tags...')}
                        </Body>
                    </View>
                </View>
            )}

            {/* Upload error */}
            {uploadState === 'error' && (
                <View style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <Icon name="alert-circle-outline" size={40} color={Colors.error} />
                        <Body color="muted" style={styles.uploadText}>
                            {uploadError}
                        </Body>
                        <Pressable
                            onPress={handleDone}
                            style={({pressed}) => [
                                styles.retryButton,
                                pressed && styles.retryButtonPressed
                            ]}>
                            <Body color="accent" family="semiBold">{t('Try again')}</Body>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Tooltip — does not block touches on UI underneath */}
            {currentTooltip && (
                <TooltipOverlay
                    visible={true}
                    message={currentTooltip.message}
                    hint={currentTooltip.hint}
                    position={currentTooltip.position}
                    onDismiss={dismissTooltip}
                />
            )}

            {/* Tag detail sheet */}
            <TagDetailSheet
                visible={!!detailTag}
                tag={detailTagCurrent}
                tagEntry={detailTagEntry}
                materials={materialsArray}
                brands={brandsArray}
                brandsById={brandsById}
                onToggleMaterial={handleDetailToggleMaterial}
                onAddBrand={handleDetailAddBrand}
                onRemoveBrand={handleDetailRemoveBrand}
                onAddCustomTag={handleDetailAddCustomTag}
                onRemoveCustomTag={handleDetailRemoveCustomTag}
                onUpdateQuantity={handleUpdateQuantity}
                onSetPickedUp={handleDetailSetPickedUp}
                onClose={handleCloseDetail}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a'
    },
    stepBar: {
        backgroundColor: '#f0faf4'
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a'
    },
    imageWrapper: {
        flex: 1,
        margin: 8,
        borderRadius: 12,
        overflow: 'hidden'
    },
    photo: {
        flex: 1
    },
    deletePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deletePhotoButtonPressed: {
        backgroundColor: 'rgba(0,0,0,0.8)'
    },
    editorPanel: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 8,
        height: 48,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        shadowColor: Colors.accent,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    doneButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0
    },
    doneButtonPressed: {
        backgroundColor: '#229954'
    },
    doneText: {
        fontSize: 16
    },
    reassurance: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 12
    },
    pickedUpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 4
    },
    pickedUpLabel: {
        fontSize: 14
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 32
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    retryButtonPressed: {
        backgroundColor: Colors.accentLight
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
    },
    uploadCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 32,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8
    },
    uploadText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 15
    }
});

export default OnboardingTagScreen;
