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
import TagSuggestions from './components/TagSuggestions';
import CategoryBrowser from './components/CategoryBrowser';
import ImageProgressDots from './components/ImageProgressDots';
import TagDetailSheet from './components/TagDetailSheet';

// Hooks
import useTaggingQueue from './hooks/useTaggingQueue';
import useTagDraft from './hooks/useTagDraft';

// Utils
import {makeTagKey, parseTagKey, resolveTagEntry} from './components/tagUtils';
import {clearEditingPhoto} from '../../reducers/photos_reducer';

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

    // --- Layer C: Draft ---
    const defaultPickedUp = useSelector(state => state.auth.user?.picked_up ?? null);
    const draft = useTagDraft(activePhoto, defaultPickedUp);
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
        categoriesById,
        entriesByCloId,
        typeEntriesByKey,
        materialsById,
        brandsById
    } = useSelector(state => state.tags, shallowEqual);

    const [pendingCustomTag, setPendingCustomTag] = useState(null);
    const searchBarRef = useRef(null);
    const [detailTag, setDetailTag] = useState(null);

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

    // --- Tag actions (delegate to draft) ---
    const handleAddTag = useCallback(
        (cloId, typeId) => {
            if (__DEV__) console.log('[Tag] addTag cloId:', cloId, 'typeId:', typeId, 'index:', activeIndex);
            draft.addTag(cloId, typeId);
        },
        [draft.addTag, activeIndex]
    );

    const handleAddBrandOnly = useCallback(
        (brandId, brandName, brandKey) => {
            draft.addBrandOnly(brandId, brandName, brandKey);
        },
        [draft.addBrandOnly]
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
    }, [detailTag, detailCloId, detailTypeId, typeEntriesByKey, entriesByCloId]);

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

            {/* Layer 2: Top bar — absolute, floats over image */}
            <View style={[styles.topBarOverlay, {paddingTop: insets.top}]} pointerEvents="box-none">
                <View style={styles.topBar}>
                    <RNPressable
                        onPress={() => {
                            // Persist tags to Redux before leaving so they survive navigation
                            if (!isEditMode) commitDraft(getDraft);
                            if (isEditMode) dispatch(clearEditingPhoto());
                            InteractionManager.runAfterInteractions(() => navigation.goBack());
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
                    onRemove={handleRemoveTag}
                    onRemoveCustomTag={handleRemoveImageCustomTag}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenDetail={handleOpenDetail}
                />

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
                    onAddTag={handleAddTag}
                    onAddBrandOnly={handleAddBrandOnly}
                    onAddCustomTag={handleAddImageCustomTag}
                    onPendingCustomTag={setPendingCustomTag}
                    onBrowsePress={handleBrowsePress}
                    showBrowser={showBrowser}
                />

                {showBrowser && (
                    <CategoryBrowser
                        categoriesById={categoriesById}
                        objectEntries={objectEntries}
                        currentTags={currentTags}
                        onAddTag={handleAddTag}
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
                visible={detailTagCurrent != null}
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
