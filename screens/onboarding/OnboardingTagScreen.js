import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
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
import useTagDraft from '../addTag/hooks/useTagDraft';
import {commitDraftToPhoto} from '../../reducers/photos_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';

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
    const {objectEntries, entriesByCloId, typeEntriesByKey, brandsById, fetchStatus} = useSelector(
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

    // Ref to read latest draft in callbacks
    const draftRef = useRef({currentTags, currentCustomTags});
    draftRef.current = {currentTags, currentCustomTags};

    const tooltipSteps = useMemo(() => [
        {message: t('What can you see? Tap a tag or search below'), hint: null, position: 'bottom'},
        {message: t('Great! You can set the quantity or add more tags'), hint: t('You can always edit this later'), position: 'bottom'},
        {message: t("Tap 'Done' to save your tags"), hint: t('One tag is enough to get started'), position: 'top'}
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

    // Tooltip step tracking
    const [tooltipStep, setTooltipStep] = useState(0);
    const [pendingCustomTag, setPendingCustomTag] = useState(null);
    const searchBarRef = useRef(null);

    // Advance tooltip when user selects first tag
    useEffect(() => {
        if (currentTags.length > 0 && tooltipStep === 0) {
            setTooltipStep(1);
        }
    }, [currentTags.length, tooltipStep]);

    const handleAddTag = useCallback(
        (cloId, typeId) => {
            draft.addTag(cloId, typeId);
            // Sync picked_up to match the onboarding toggle
            draft.setPickedUp(cloId, typeId ?? null, pickedUp);
            if (tooltipStep === 1) {
                setTooltipStep(2);
            }
        },
        [draft, tooltipStep, pickedUp]
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

    const handleDone = useCallback(() => {
        // Commit pending custom tag inline (don't return early)
        if (pendingCustomTag?.trim()) {
            draft.addImageCustomTag(pendingCustomTag.trim());
            setPendingCustomTag(null);
            searchBarRef.current?.clearQuery?.();
        }

        // Read latest draft after potential custom tag commit
        const {currentTags: tags, currentCustomTags: customs} = draftRef.current;
        if (tags.length === 0 && customs.length === 0) return;

        Keyboard.dismiss();

        // Commit draft tags to Redux (same as AddTagScreen)
        dispatch(commitDraftToPhoto({
            imageIndex: swiperIndex,
            tags,
            customTags: customs
        }));

        navigation.replace('CELEBRATION');
    }, [
        pendingCustomTag, draft, dispatch, swiperIndex, navigation
    ]);

    const dismissTooltip = useCallback(() => {
        if (tooltipStep < TOOLTIP_COUNT - 1) {
            setTooltipStep(prev => prev + 1);
        } else {
            setTooltipStep(-1);
        }
    }, [tooltipStep]);

    if (!photo) return null;

    const tagsLoading = (!objectEntries || objectEntries.length === 0) && fetchStatus !== 'failed';
    const tagsFailed = fetchStatus === 'failed' && (!objectEntries || objectEntries.length === 0);
    const hasTags = currentTags.length > 0 || currentCustomTags.length > 0;
    const currentTooltip = tooltipStep >= 0 && tooltipStep < TOOLTIP_COUNT
        ? tooltipSteps[tooltipStep]
        : null;

    return (
        <View style={styles.container}>
            {/* Photo display */}
            <View style={[styles.imageContainer, {paddingTop: insets.top}]}>
                <StepIndicator currentStep={2} completedSteps={[1]} />
                <View style={styles.imageWrapper}>
                    <Image
                        source={{uri: photo.uri}}
                        style={styles.photo}
                        resizeMode="cover"
                    />
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
                                {t('I picked this up')}
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
                            onPress={handleDone}
                            disabled={!hasTags}
                            style={({pressed}) => [
                                styles.doneButton,
                                !hasTags && styles.doneButtonDisabled,
                                pressed && hasTags && styles.doneButtonPressed
                            ]}>
                            <Icon name="checkmark-circle" size={22} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.doneText}>
                                {t('Done')}
                            </Body>
                        </Pressable>

                        {/* Reassurance */}
                        {hasTags && (
                            <Caption color="muted" style={styles.reassurance}>
                                {t('One tag is enough to get started')}
                            </Caption>
                        )}
                    </>
                )}
            </KeyboardAvoidingView>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a'
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
    }
});

export default OnboardingTagScreen;
