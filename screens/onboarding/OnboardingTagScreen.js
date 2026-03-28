import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
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
const TOOLTIP_STEPS = [
    {
        message: 'What can you see? Tap a tag or search below',
        hint: null,
        position: 'bottom'
    },
    {
        message: 'Great! You can set the quantity or add more tags',
        hint: 'You can always edit this later',
        position: 'bottom'
    },
    {
        message: "Tap 'Done' to save your tags",
        hint: 'One tag is enough to get started',
        position: 'top'
    }
];

const OnboardingTagScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    const imagesArray = useSelector(state => state.photos.imagesArray);
    const swiperIndex = useSelector(state => state.photos.swiperIndex);
    const {objectEntries, entriesByCloId, typeEntriesByKey, brandsById} = useSelector(
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
            if (tooltipStep === 1) {
                setTooltipStep(2);
            }
        },
        [draft, tooltipStep]
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

    const handleCreatePendingCustomTag = useCallback(() => {
        const text = pendingCustomTag?.trim();
        if (text) {
            draft.addImageCustomTag(text);
            setPendingCustomTag(null);
            searchBarRef.current?.clearQuery?.();
            Keyboard.dismiss();
        }
    }, [draft, pendingCustomTag]);

    const handleRemoveCustomTag = useCallback(
        text => draft.removeImageCustomTag(text),
        [draft]
    );

    const handleDone = useCallback(() => {
        if (currentTags.length === 0 && currentCustomTags.length === 0) return;

        // Commit pending custom tag if any
        if (pendingCustomTag) {
            handleCreatePendingCustomTag();
            return;
        }

        Keyboard.dismiss();

        // Commit draft tags to Redux (same as AddTagScreen)
        const {currentTags: tags, currentCustomTags: customs} = draftRef.current;
        dispatch(commitDraftToPhoto({
            imageIndex: swiperIndex,
            tags,
            customTags: customs
        }));

        navigation.replace('CELEBRATION');
    }, [
        currentTags.length, currentCustomTags.length, pendingCustomTag,
        handleCreatePendingCustomTag, dispatch, swiperIndex, navigation
    ]);

    const dismissTooltip = useCallback(() => {
        if (tooltipStep < TOOLTIP_STEPS.length - 1) {
            setTooltipStep(prev => prev + 1);
        } else {
            setTooltipStep(-1);
        }
    }, [tooltipStep]);

    if (!photo) return null;

    const hasTags = currentTags.length > 0 || currentCustomTags.length > 0;
    const currentTooltip = tooltipStep >= 0 && tooltipStep < TOOLTIP_STEPS.length
        ? TOOLTIP_STEPS[tooltipStep]
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
                        {'Done'}
                    </Body>
                </Pressable>

                {/* Reassurance */}
                {hasTags && (
                    <Caption color="muted" style={styles.reassurance}>
                        {'One tag is enough to get started'}
                    </Caption>
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
    }
});

export default OnboardingTagScreen;
