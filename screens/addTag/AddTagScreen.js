import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable as RNPressable,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    cancelAnimation
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';

// Components
import ImageViewer from './components/ImageViewer';
import TagPills from './components/TagPills';
import TagSearchBar from './components/TagSearchBar';
import QuickTags from './components/QuickTags';
import TagSuggestions from './components/TagSuggestions';
import CategoryBrowser from './components/CategoryBrowser';
import ImageProgressDots from './components/ImageProgressDots';
import TagDetailSheet from './components/TagDetailSheet';

// Hooks
import useTaggingQueue from './hooks/useTaggingQueue';
import useTagDraft from './hooks/useTagDraft';
import useQuickTagsInit from './hooks/useQuickTagsInit';

// Utils
import {makeTagKey, parseTagKey, resolveTagEntry, MAX_QUANTITY_TRUSTED, MAX_QUANTITY_DEFAULT} from './components/tagUtils';
import {clearEditingPhoto} from '../../reducers/photos_reducer';
import {addQuickTag, removeQuickTagByCloId} from '../../reducers/quick_tags_reducer';

const EMPTY_TYPES = [];

const AddTagScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();

    // --- Layer A: Queue ---
    const queue = useTaggingQueue(navigation);
    const {
        photos, activePhoto, activeIndex, isEditMode, untaggedCount, allTagged,
        goToIndex, commitDraft, deleteCurrent, handleDone: queueHandleDone
    } = queue;

    // --- Quick tags initialization ---
    useQuickTagsInit();

    // --- Layer C: Draft ---
    const user = useSelector(state => state.auth.user);
    const defaultPickedUp = user?.picked_up ?? null;
    const isTrusted = user?.verification_required === false;
    const maxQuantity = isTrusted ? MAX_QUANTITY_TRUSTED : MAX_QUANTITY_DEFAULT;
    const draft = useTagDraft(activePhoto, defaultPickedUp, maxQuantity);
    const {currentTags, currentCustomTags, xpEstimate} = draft;

    // Getter for queue callbacks to read current draft state
    const draftRef = useRef({currentTags, currentCustomTags});
    draftRef.current = {currentTags, currentCustomTags};
    const getDraft = useCallback(() => draftRef.current, []);

    // --- UI state ---
    const [showBrowser, setShowBrowser] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeferredPanels, setShowDeferredPanels] = useState(false);

    // --- Tags catalogue ---
    const {
        objectEntries,
        entriesByCloId,
        typeEntriesByKey,
        materialsById,
        brandsById
    } = useSelector(state => state.tags, shallowEqual);

    const [pendingCustomTag, setPendingCustomTag] = useState(null);
    const searchBarRef = useRef(null);
    const [detailTag, setDetailTag] = useState(null);
    // Incomplete browse candidate awaiting category resolution (multi-category
    // object from "All Objects"). The sheet renders a category chooser for it.
    const [detailCandidate, setDetailCandidate] = useState(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Hide the top bar while the keyboard is open so its dark overlay + XP badge
    // can't cover the search input when the editor rises above the keyboard.
    useEffect(() => {
        const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Set status bar style when screen is focused
    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
            setShowDeferredPanels(false);
            const task = InteractionManager.runAfterInteractions(() => {
                setShowDeferredPanels(true);
            });

            return () => {
                task.cancel();
            };
        }, [])
    );

    // Close overlays when navigating to a different image
    useEffect(() => {
        setDetailTag(null);
        setDetailCandidate(null);
        setPendingCustomTag(null);
        setShowBrowser(false);
    }, [activeIndex]);

    const topInsetStyle = useMemo(
        () => ({paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right}),
        [insets.top, insets.left, insets.right]
    );

    // XP badge pulse animation
    const xpScale = useSharedValue(1);
    const prevXp = useRef(xpEstimate);
    useEffect(() => {
        if (xpEstimate !== prevXp.current) {
            prevXp.current = xpEstimate;
            xpScale.value = withSequence(
                withTiming(1.15, {duration: 100}),
                withTiming(1.0, {duration: 100})
            );
        }
    }, [xpEstimate, xpScale]);
    const xpAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{scale: xpScale.value}]
    }));

    // --- Quick tag presets (must be above handleAddTag which references it) ---
    const quickTagPresets = useSelector(state => state.quickTags.presets);

    // --- Tag actions (delegate to draft) ---
    const handleAddTag = useCallback(
        (cloId, typeId) => {
            if (__DEV__) console.log('[Tag] addTag cloId:', cloId, 'typeId:', typeId, 'index:', activeIndex);
            // If there's a matching quick tag preset, apply its metadata (picked_up, materials, brands)
            const preset = quickTagPresets.find(
                p => p.cloId === cloId && (p.typeId ?? null) === (typeId ?? null)
            );
            if (preset) {
                draft.addTagWithPreset(preset);
            } else {
                draft.addTag(cloId, typeId);
            }
        },
        [draft.addTag, draft.addTagWithPreset, quickTagPresets, activeIndex]
    );

    const handleAddBrandOnly = useCallback(
        (brandId, brandName, brandKey) => {
            draft.addBrandOnly(brandId, brandName, brandKey);
        },
        [draft.addBrandOnly]
    );

    const handleAddTagWithPreset = useCallback(
        (preset) => {
            if (__DEV__) console.log('[Tag] addTagWithPreset cloId:', preset.cloId, 'index:', activeIndex);
            draft.addTagWithPreset(preset);
        },
        [draft.addTagWithPreset, activeIndex]
    );
    const quickTagCloIds = useMemo(() => {
        const set = new Set();
        for (const p of quickTagPresets) {
            set.add(makeTagKey(p.cloId, p.typeId));
        }
        return set;
    }, [quickTagPresets]);

    const handleToggleQuickTag = useCallback(
        (cloId, typeId, metadata) => {
            const key = makeTagKey(cloId, typeId);
            if (quickTagCloIds.has(key)) {
                dispatch(removeQuickTagByCloId({cloId, typeId}));
            } else {
                const entry = resolveTagEntry(cloId, typeId, entriesByCloId, typeEntriesByKey);
                dispatch(addQuickTag({
                    cloId,
                    typeId,
                    name: entry?.displayName ?? null,
                    quantity: metadata?.quantity ?? 1,
                    picked_up: metadata?.picked_up ?? null,
                    materials: metadata?.materials ?? [],
                    brands: metadata?.brands ?? []
                }));
            }
        },
        [dispatch, quickTagCloIds, entriesByCloId, typeEntriesByKey]
    );

    const handleRemoveTag = useCallback(
        (cloId, typeId, brandId) => draft.removeTag(cloId, typeId, brandId),
        [draft.removeTag]
    );

    const handleUpdateQuantity = useCallback(
        (cloId, typeId, newQuantity, brandId) => draft.updateQuantity(cloId, typeId, newQuantity, brandId),
        [draft.updateQuantity]
    );

    // Image-level custom tags
    const handleAddImageCustomTag = useCallback(
        text => draft.addImageCustomTag(text),
        [draft.addImageCustomTag]
    );

    const handleCreatePendingCustomTag = useCallback(() => {
        const text = pendingCustomTag?.trim();
        if (text) {
            if (__DEV__) console.log('[Tag] createCustomTag:', text, 'index:', activeIndex);
            draft.addImageCustomTag(text);
            setPendingCustomTag(null);
            if (searchBarRef.current) {
                searchBarRef.current.clearQuery();
            }
            Keyboard.dismiss();
        }
    }, [draft.addImageCustomTag, pendingCustomTag, activeIndex]);

    const handleRemoveImageCustomTag = useCallback(
        text => draft.removeImageCustomTag(text),
        [draft.removeImageCustomTag]
    );

    // Materials and brands for detail sheet
    const materialsArray = useMemo(
        () => materialsById
            ? Object.values(materialsById).sort((a, b) => a.name.localeCompare(b.name))
            : [],
        [materialsById]
    );

    const brandsArray = useMemo(
        () => brandsById
            ? Object.values(brandsById).sort((a, b) => a.name.localeCompare(b.name))
            : [],
        [brandsById]
    );

    // --- Detail sheet ---
    const handleOpenDetail = useCallback(tag => {
        setDetailTag(makeTagKey(tag.cloId, tag.typeId));
    }, []);

    const handleCloseDetail = useCallback(() => {
        setDetailTag(null);
        setDetailCandidate(null);
    }, []);

    // Browse selection → route through the detail sheet for precision (type,
    // and category when the object spans several). Simple single-category,
    // type-less objects are added directly (fast path).
    const handleBrowseCandidate = useCallback(candidate => {
        if (candidate.cloId != null) {
            const hasTypes = objectEntries.some(
                e => e.isType && e.cloId === candidate.cloId
            );
            handleAddTag(candidate.cloId, candidate.typeId ?? null);
            if (hasTypes) {
                setDetailTag(makeTagKey(candidate.cloId, candidate.typeId ?? null));
            }
            return;
        }
        // "All Objects" — resolve the object's categories.
        const cats = objectEntries.filter(
            e => !e.isType && e.objectId === candidate.objectId
        );
        if (cats.length === 1) {
            const cloId = cats[0].cloId;
            const hasTypes = objectEntries.some(e => e.isType && e.cloId === cloId);
            handleAddTag(cloId, null);
            if (hasTypes) {
                setDetailTag(makeTagKey(cloId, null));
            }
        } else if (cats.length > 1) {
            setDetailCandidate(candidate);
        }
    }, [objectEntries, handleAddTag]);

    // User picked a category in the sheet's chooser — create the tag and, if it
    // has types, keep the sheet open bound to the new tag for type selection.
    const handleResolveCandidate = useCallback(cloId => {
        setDetailCandidate(null);
        const hasTypes = objectEntries.some(e => e.isType && e.cloId === cloId);
        handleAddTag(cloId, null);
        if (hasTypes) {
            setDetailTag(makeTagKey(cloId, null));
        }
    }, [objectEntries, handleAddTag]);

    // Re-key the tag's type and re-bind the sheet to the new identity.
    const handleSetType = useCallback((cloId, fromTypeId, toTypeId) => {
        draft.setType(cloId, fromTypeId, toTypeId);
        setDetailTag(makeTagKey(cloId, toTypeId));
    }, [draft.setType]);

    // Search adds the tag directly. Type rows were removed from search results,
    // so when a simple noun has types available but none was chosen, open the
    // sheet on it — that's where the type gets set ("accept Type if not set").
    const handleSearchAddTag = useCallback((cloId, typeId) => {
        handleAddTag(cloId, typeId);
        if ((typeId ?? null) === null) {
            const hasTypes = objectEntries.some(e => e.isType && e.cloId === cloId);
            if (hasTypes) {
                setDetailTag(makeTagKey(cloId, null));
            }
        }
    }, [handleAddTag, objectEntries]);

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
    }, [detailTag, detailCloId, detailTypeId, typeEntriesByKey, entriesByCloId]);

    // Categories an object belongs to (for the candidate chooser).
    const candidateCategories = useMemo(() => {
        if (!detailCandidate) return null;
        return objectEntries
            .filter(e => !e.isType && e.objectId === detailCandidate.objectId)
            .map(e => ({
                cloId: e.cloId,
                categoryId: e.categoryId,
                categoryKey: e.categoryKey,
                categoryDisplayName: e.categoryDisplayName
            }));
    }, [detailCandidate, objectEntries]);

    // Valid types for the (object, category) pair currently in the sheet.
    const availableTypes = useMemo(() => {
        if (detailCloId == null) return EMPTY_TYPES;
        return objectEntries
            .filter(e => e.isType && e.cloId === detailCloId)
            .map(e => ({typeId: e.typeId, typeName: e.typeName}));
    }, [detailCloId, objectEntries]);

    // Detail sheet actions — delegate to draft with cloId/typeId from detail
    const handleDetailToggleMaterial = useCallback(
        materialId => {
            if (__DEV__) console.log('[Tag] toggleMaterial:', materialId, 'on cloId:', detailCloId);
            draft.toggleMaterial(detailCloId, detailTypeId, materialId);
        },
        [draft.toggleMaterial, detailCloId, detailTypeId]
    );
    const handleDetailAddBrand = useCallback(
        brandId => {
            if (__DEV__) console.log('[Tag] addBrand:', brandId, 'on cloId:', detailCloId);
            draft.addBrand(detailCloId, detailTypeId, brandId);
        },
        [draft.addBrand, detailCloId, detailTypeId]
    );
    const handleDetailRemoveBrand = useCallback(
        brandId => draft.removeBrand(detailCloId, detailTypeId, brandId),
        [draft.removeBrand, detailCloId, detailTypeId]
    );
    const handleDetailAddCustomTag = useCallback(
        text => draft.addCustomTag(detailCloId, detailTypeId, text),
        [draft.addCustomTag, detailCloId, detailTypeId]
    );
    const handleDetailRemoveCustomTag = useCallback(
        text => draft.removeCustomTag(detailCloId, detailTypeId, text),
        [draft.removeCustomTag, detailCloId, detailTypeId]
    );
    const handleDetailSetPickedUp = useCallback(
        (cloId, typeId, value) => draft.setPickedUp(cloId, typeId, value),
        [draft.setPickedUp]
    );

    // --- Done / Save ---
    // Commit draft before advancing so edits persist across swipes in both modes.
    const handleIndexChangeWithCommit = useCallback(
        newIndex => {
            if (__DEV__) console.log('[Tag] commitDraft before index change →', newIndex);
            commitDraft(getDraft);
            goToIndex(newIndex);
        },
        [commitDraft, getDraft, goToIndex]
    );

    const handleDone = useCallback(() => {
        if (__DEV__) console.log('[UI] Done button pressed, pendingCustomTag:', !!pendingCustomTag);
        if (pendingCustomTag) {
            handleCreatePendingCustomTag();
            return;
        }
        queueHandleDone(getDraft, setIsSaving);
    }, [pendingCustomTag, handleCreatePendingCustomTag, queueHandleDone, getDraft]);

    const handleBrowsePress = useCallback(() => {
        Keyboard.dismiss();
        setShowBrowser(prev => !prev);
    }, []);

    const handleCloseBrowser = useCallback(() => {
        setShowBrowser(false);
    }, []);

    const handleImageTap = useCallback(() => {
        Keyboard.dismiss();
        searchBarRef.current?.blurInput?.();
    }, []);

    if (!activePhoto) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Layer 1: Image viewer — fills entire screen, gestures only here */}
            <ImageViewer
                images={photos}
                currentIndex={activeIndex}
                onIndexChange={handleIndexChangeWithCommit}
                onSingleTap={handleImageTap}
            />

            {/* Layer 2: Top bar — absolute, floats over image.
                Hidden while the keyboard is up so it never overlaps the search/editor. */}
            <View
                style={[
                    styles.topBarOverlay,
                    {paddingTop: insets.top},
                    keyboardVisible && styles.hidden
                ]}
                pointerEvents="box-none">
                <View style={styles.topBar}>
                    <RNPressable
                        onPress={() => {
                            // Persist tags to Redux before leaving so they survive navigation
                            if (!isEditMode) commitDraft(getDraft);
                            if (isEditMode) dispatch(clearEditingPhoto());
                            InteractionManager.runAfterInteractions(() => {
                                if (navigation.canGoBack()) navigation.goBack();
                            });
                        }}
                        style={styles.backButton}
                        hitSlop={12}>
                        <Icon name="arrow-back" size={22} color={Colors.white} />
                    </RNPressable>

                    {isEditMode && photos.length > 0 ? (
                        <View style={styles.untaggedCounter}>
                            <Caption color="white" family="semiBold">
                                {activeIndex + 1} / {photos.length}
                            </Caption>
                        </View>
                    ) : (
                        <ImageProgressDots
                            images={photos}
                            currentIndex={activeIndex}
                            onIndexChange={handleIndexChangeWithCommit}
                        />
                    )}

                    {isEditMode && (
                        <RNPressable
                            onPress={deleteCurrent}
                            disabled={isSaving}
                            style={[styles.deletePhotoButton, isSaving && {opacity: 0.3}]}
                            hitSlop={12}>
                            <Icon name="trash-outline" size={20} color="#ff6b6b" />
                        </RNPressable>
                    )}

                    <Animated.View style={[styles.xpBadge, xpAnimatedStyle]}>
                        <Caption color="accent" family="semiBold">
                            +{xpEstimate} XP
                        </Caption>
                    </Animated.View>
                </View>
            </View>

            {/* Layer 3: Editor panel — absolute bottom, floats over image.
                Sibling of ImageViewer (not nested inside it or a shared box-none parent).
                Touches here go directly to the editor — they CANNOT reach the
                ImageViewer's GestureDetector because they are separate native view trees. */}
            <KeyboardAvoidingView
                style={[styles.editorPanel, {paddingBottom: insets.bottom}]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>
                <TagPills
                    tags={currentTags}
                    customTags={currentCustomTags}
                    entriesByCloId={entriesByCloId}
                    typeEntriesByKey={typeEntriesByKey}
                    quickTagCloIds={quickTagCloIds}
                    maxQuantity={maxQuantity}
                    onRemove={handleRemoveTag}
                    onRemoveCustomTag={handleRemoveImageCustomTag}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenDetail={handleOpenDetail}
                    onToggleQuickTag={handleToggleQuickTag}
                />

                {showDeferredPanels && (
                    <QuickTags
                        currentTags={currentTags}
                        entriesByCloId={entriesByCloId}
                        typeEntriesByKey={typeEntriesByKey}
                        onAddTagWithPreset={handleAddTagWithPreset}
                    />
                )}

                {showDeferredPanels && (
                    <TagSuggestions
                        images={photos}
                        currentIndex={activeIndex}
                        currentTags={currentTags}
                        entriesByCloId={entriesByCloId}
                        typeEntriesByKey={typeEntriesByKey}
                        onAddTag={handleAddTag}
                    />
                )}

                <TagSearchBar
                    ref={searchBarRef}
                    objectEntries={objectEntries}
                    entriesByCloId={entriesByCloId}
                    currentTags={currentTags}
                    customTags={currentCustomTags}
                    brands={brandsArray}
                    quickTagCloIds={quickTagCloIds}
                    onAddTag={handleSearchAddTag}
                    onAddBrandOnly={handleAddBrandOnly}
                    onAddCustomTag={handleAddImageCustomTag}
                    onPendingCustomTag={setPendingCustomTag}
                    onBrowsePress={handleBrowsePress}
                    onToggleQuickTag={handleToggleQuickTag}
                    showBrowser={showBrowser}
                />

                {showBrowser && (
                    <CategoryBrowser
                        objectEntries={objectEntries}
                        currentTags={currentTags}
                        onSelectCandidate={handleBrowseCandidate}
                        onClose={handleCloseBrowser}
                    />
                )}

                <View>
                    <View style={styles.bottomControls}>
                        <RNPressable
                            disabled={isSaving}
                            style={[
                                styles.doneButton,
                                isEditMode && styles.updateButton,
                                isSaving && styles.doneButtonDisabled
                            ]}
                            onPress={handleDone}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Icon
                                        name={
                                            pendingCustomTag ? 'pricetag-outline'
                                                : isEditMode ? 'cloud-upload-outline'
                                                    : allTagged ? 'checkmark' : 'arrow-forward'
                                        }
                                        size={18}
                                        color={Colors.white}
                                    />
                                    <Body
                                        color="white"
                                        family="semiBold"
                                        style={styles.doneText}
                                        dictionary={
                                            pendingCustomTag ? 'Create Tag'
                                                : isEditMode ? 'Update Tags'
                                                    : allTagged ? 'Done' : 'Next'
                                        }
                                    />
                                </>
                            )}
                        </RNPressable>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <TagDetailSheet
                visible={detailTagCurrent != null || detailCandidate != null}
                tag={detailTagCurrent}
                tagEntry={detailTagEntry}
                candidate={detailCandidate}
                candidateCategories={candidateCategories}
                availableTypes={availableTypes}
                maxQuantity={maxQuantity}
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
                onResolveCandidate={handleResolveCandidate}
                onSetType={handleSetType}
                onClose={handleCloseDetail}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    topBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    hidden: {
        display: 'none'
    },
    editorPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingTop: 8
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deletePhotoButton: {
        marginLeft: 'auto',
        padding: 8
    },
    untaggedCounter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    xpBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: Colors.accentLight,
        borderRadius: 100
    },
    bottomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4
    },
    doneButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: Colors.accent,
        borderRadius: 14,
        gap: 6
    },
    doneButtonPressed: {
        backgroundColor: '#229954'
    },
    doneButtonDisabled: {
        opacity: 0.6
    },
    updateButton: {
        backgroundColor: '#2563eb'
    },
    doneText: {
        fontSize: 15
    }
});

export default AddTagScreen;
