import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Pressable} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';
import ImageViewer from './components/ImageViewer';
import TagPills from './components/TagPills';
import TagSearchBar from './components/TagSearchBar';
import TagSuggestions from './components/TagSuggestions';
import CategoryBrowser from './components/CategoryBrowser';
import ImageProgressDots from './components/ImageProgressDots';
import TagDetailSheet from './components/TagDetailSheet';
import {
    addBrandToTag,
    addCustomTagToTag,
    addImageCustomTag,
    addTagV5,
    changeSwiperIndex,
    removeBrandFromTag,
    removeCustomTagFromTag,
    removeImageCustomTag,
    removeTagV5,
    setPickedUpOnTag,
    toggleMaterialOnTag,
    updateTagQuantityV5,
    clearEditingPhoto,
    loadPhotoForEditing,
    removeEditingPhoto
} from '../../reducers/photos_reducer';
import {editTagsOnPhoto, fetchNextUntaggedPhoto} from '../../reducers/server_photos_reducer';
import {deleteUploadPhoto} from '../../reducers/uploads_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {isTagged} from '../../utils/isTagged';
import buildTagsPayload from '../../utils/buildTagsPayload';
import {makeTagKey, parseTagKey, resolveTagEntry} from './components/tagUtils';

const AddTagScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();

    // Redux state — use editingPhotos queue if available, otherwise imagesArray
    const defaultPickedUp = useSelector(state => state.auth.user?.picked_up ?? null);
    const editingPhotos = useSelector(state => state.photos.editingPhotos) || [];
    const galleryImages = useSelector(state => state.photos.imagesArray);
    const rawSwiperIndex = useSelector(state => state.photos.swiperIndex);
    const untaggedCount = useSelector(state => state.serverPhotos.untaggedCount);
    const isEditMode = editingPhotos.length > 0;
    const images = useMemo(
        () => isEditMode ? editingPhotos : galleryImages,
        [isEditMode, editingPhotos, galleryImages]
    );
    const swiperIndex = isEditMode ? Math.min(rawSwiperIndex, Math.max(0, images.length - 1)) : rawSwiperIndex;

    const {
        objectEntries,
        categoriesById,
        entriesByCloId,
        typeEntriesByKey,
        materialsById,
        brandsById,
        fetchStatus: tagsFetchStatus
    } = useSelector(state => state.tags, shallowEqual);

    const [isSaving, setIsSaving] = useState(false);
    const [pendingCustomTag, setPendingCustomTag] = useState(null);
    const searchBarRef = useRef(null);

    // Focus mode: hides overlays so user can see full image
    const [focusMode, setFocusMode] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [showBrowser, setShowBrowser] = useState(false);
    const [detailTag, setDetailTag] = useState(null);

    // Close overlays and clear pending state when navigating to a different image
    useEffect(() => {
        setDetailTag(null);
        setShowBrowser(false);
        setPendingCustomTag(null);
    }, [swiperIndex]);

    // Track keyboard visibility
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Overlay opacity for focus mode transitions
    const overlayOpacity = useSharedValue(1);

    // XP badge pulse animation
    const xpScale = useSharedValue(1);

    // Fetch tags on mount if not loaded
    useEffect(() => {
        if (objectEntries.length === 0 && tagsFetchStatus !== 'loading') {
            dispatch(fetchAllTags());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set status bar style when screen is focused
    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
        }, [])
    );

    // Clamp swiperIndex to valid range to prevent out-of-bounds access
    const safeIndex = images.length > 0
        ? Math.max(0, Math.min(swiperIndex, images.length - 1))
        : 0;
    const currentImage = images[safeIndex];

    const currentTags = currentImage?.tags || [];
    const currentCustomTags = currentImage?.customTags || [];
    const bottomInset = keyboardVisible ? 14 : insets.bottom;

    const topInsetStyle = useMemo(
        () => ({paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right}),
        [insets.top, insets.left, insets.right]
    );

    // XP estimate: 5 (upload) + sum(quantities) + 5 per picked_up tag
    // + 2 per material + 3 per brand + 1 per custom tag (per-tag and image-level)
    const xpEstimate = useMemo(() => {
        let xp = 5;
        for (const tag of currentTags) {
            xp += tag.quantity || 1;
            if (tag.picked_up === true) xp += 5;
            xp += (tag.materials?.length || 0) * 2;
            xp += (tag.brands?.length || 0) * 3;
            xp += tag.customTags?.length || 0;
        }
        xp += currentCustomTags.length;
        return xp;
    }, [currentTags, currentCustomTags]);

    // Pulse XP badge when estimate changes
    const prevXp = useRef(xpEstimate);
    useEffect(() => {
        if (xpEstimate === prevXp.current) {
            return;
        }

        xpScale.value = withSequence(
            withTiming(1.15, {duration: 100}),
            withTiming(1.0, {duration: 100})
        );
        prevXp.current = xpEstimate;

        return () => cancelAnimation(xpScale);
    }, [xpEstimate, xpScale]);

    // Track whether a prefetch is already in flight
    const prefetchingRef = useRef(false);

    // Image navigation — prefetch more when approaching the end of the editing queue
    const handleIndexChange = useCallback(
        newIndex => {
            const clamped = Math.max(0, Math.min(newIndex, images.length - 1));
            dispatch(changeSwiperIndex(clamped));

            // Prefetch when within 3 photos of the end of the queue
            if (isEditMode && clamped >= editingPhotos.length - 3 && !prefetchingRef.current) {
                prefetchingRef.current = true;
                dispatch(fetchNextUntaggedPhoto({perPage: 5})).then(result => {
                    prefetchingRef.current = false;
                    if (result.meta?.requestStatus === 'fulfilled') {
                        dispatch(loadPhotoForEditing({photos: result.payload}));
                    }
                });
            }
        },
        [dispatch, images.length, isEditMode, editingPhotos.length]
    );

    // Focus mode toggle from ImageViewer gestures
    // If keyboard is open, dismiss it instead of entering focus mode
    const handleToggleFocus = useCallback(() => {
        if (keyboardVisible) {
            Keyboard.dismiss();
            return;
        }
        setFocusMode(prev => {
            const next = !prev;
            overlayOpacity.value = withTiming(next ? 0 : 1, {duration: 200});
            return next;
        });
    }, [overlayOpacity, keyboardVisible]);

    // When user zooms back to 1x, show overlays
    const handleZoomChange = useCallback(
        isZoomed => {
            if (!isZoomed && focusMode) {
                setFocusMode(false);
                overlayOpacity.value = withTiming(1, {duration: 200});
            }
        },
        [focusMode, overlayOpacity]
    );

    // Arrow navigation
    const goToPrev = useCallback(() => {
        if (swiperIndex > 0) {
            dispatch(changeSwiperIndex(swiperIndex - 1));
        }
    }, [dispatch, swiperIndex]);

    const goToNext = useCallback(() => {
        if (swiperIndex < images.length - 1) {
            dispatch(changeSwiperIndex(swiperIndex + 1));
        }
    }, [dispatch, swiperIndex, images.length]);

    // Tag actions
    const handleAddTag = useCallback(
        (cloId, typeId) => {
            dispatch(addTagV5({imageIndex: swiperIndex, cloId, typeId, defaultPickedUp}));
        },
        [dispatch, swiperIndex, defaultPickedUp]
    );

    const handleRemoveTag = useCallback(
        (cloId, typeId) => {
            dispatch(removeTagV5({imageIndex: swiperIndex, cloId, typeId}));
        },
        [dispatch, swiperIndex]
    );

    const handleUpdateQuantity = useCallback(
        (cloId, typeId, newQuantity) => {
            if (newQuantity <= 0) {
                dispatch(removeTagV5({imageIndex: swiperIndex, cloId, typeId}));
            } else {
                dispatch(
                    updateTagQuantityV5({
                        imageIndex: swiperIndex,
                        cloId,
                        typeId,
                        quantity: newQuantity
                    })
                );
            }
        },
        [dispatch, swiperIndex]
    );

    const handleSetPickedUp = useCallback(
        (cloId, typeId, value) => {
            dispatch(setPickedUpOnTag({imageIndex: swiperIndex, cloId, typeId, value}));
        },
        [dispatch, swiperIndex]
    );

    // Image-level custom tag handlers
    const handleAddImageCustomTag = useCallback(
        text => {
            dispatch(addImageCustomTag({imageIndex: swiperIndex, text}));
        },
        [dispatch, swiperIndex]
    );

    const handleCreatePendingCustomTag = useCallback(() => {
        if (pendingCustomTag) {
            dispatch(addImageCustomTag({imageIndex: swiperIndex, text: pendingCustomTag}));
            setPendingCustomTag(null);
            if (searchBarRef.current) {
                searchBarRef.current.clearQuery();
            }
            Keyboard.dismiss();
        }
    }, [dispatch, swiperIndex, pendingCustomTag]);

    const handleRemoveImageCustomTag = useCallback(
        text => {
            dispatch(removeImageCustomTag({imageIndex: swiperIndex, text}));
        },
        [dispatch, swiperIndex]
    );

    // Materials and brands as sorted arrays for TagDetailSheet
    const materialsArray = useMemo(
        () =>
            materialsById
                ? Object.values(materialsById).sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
                : [],
        [materialsById]
    );

    const brandsArray = useMemo(
        () =>
            brandsById
                ? Object.values(brandsById).sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
                : [],
        [brandsById]
    );

    // Tag detail sheet handlers — store key string instead of full object
    const handleOpenDetail = useCallback(tag => {
        setDetailTag(makeTagKey(tag.cloId, tag.typeId));
    }, []);

    const handleCloseDetail = useCallback(() => {
        setDetailTag(null);
    }, []);

    // Parse detailTag key back to cloId/typeId
    const [detailCloId, detailTypeId] = useMemo(() => {
        if (!detailTag) {
            return [null, null];
        }
        return parseTagKey(detailTag);
    }, [detailTag]);

    // Find the current tag entry for the detail sheet (stays in sync after edits)
    const detailTagCurrent = useMemo(() => {
        if (!detailTag) {
            return null;
        }
        return currentTags.find(
            t =>
                t.cloId === detailCloId &&
                (t.typeId ?? null) === (detailTypeId ?? null)
        );
    }, [detailTag, detailCloId, detailTypeId, currentTags]);

    const detailTagEntry = useMemo(() => {
        if (!detailTag) {
            return null;
        }
        return resolveTagEntry(
            detailCloId,
            detailTypeId,
            entriesByCloId,
            typeEntriesByKey
        );
    }, [
        detailTag,
        detailCloId,
        detailTypeId,
        typeEntriesByKey,
        entriesByCloId
    ]);

    // Factory for detail sheet dispatch handlers
    const dispatchDetailAction = useCallback(
        (actionCreator, extraPayload) => {
            if (!detailTag) {
                return;
            }
            dispatch(
                actionCreator({
                    imageIndex: swiperIndex,
                    cloId: detailCloId,
                    typeId: detailTypeId,
                    ...extraPayload
                })
            );
        },
        [dispatch, swiperIndex, detailTag, detailCloId, detailTypeId]
    );

    const handleToggleMaterial = useCallback(
        materialId => dispatchDetailAction(toggleMaterialOnTag, {materialId}),
        [dispatchDetailAction]
    );

    const handleAddBrand = useCallback(
        brandId => dispatchDetailAction(addBrandToTag, {brandId}),
        [dispatchDetailAction]
    );

    const handleRemoveBrand = useCallback(
        brandId => dispatchDetailAction(removeBrandFromTag, {brandId}),
        [dispatchDetailAction]
    );

    const handleAddCustomTag = useCallback(
        text => dispatchDetailAction(addCustomTagToTag, {text}),
        [dispatchDetailAction]
    );

    const handleRemoveCustomTag = useCallback(
        text => dispatchDetailAction(removeCustomTagFromTag, {text}),
        [dispatchDetailAction]
    );

    const allTagged = useMemo(
        () => images.every(img => isTagged(img)),
        [images]
    );

    const advanceOrClose = useCallback(() => {
        if (editingPhotos.length > 1) {
            // More photos in queue — remove current and stay
            dispatch(removeEditingPhoto(currentImage.id));
            // Fetch 1 more to keep queue filled
            dispatch(fetchNextUntaggedPhoto({perPage: 1})).then(result => {
                if (result.meta?.requestStatus === 'fulfilled') {
                    dispatch(loadPhotoForEditing({photos: result.payload}));
                }
            });
        } else {
            // Last photo — go back
            dispatch(clearEditingPhoto());
            navigation.goBack();
        }
    }, [dispatch, editingPhotos.length, currentImage, navigation]);

    const handleUpdateTags = useCallback(async () => {
        if (!currentImage?.photoId) return;

        const payload = buildTagsPayload(currentImage);
        if (!payload) {
            Alert.alert(t('Error!'), t('Please add at least one tag before saving.'));
            return;
        }

        setIsSaving(true);
        try {
            const result = await dispatch(editTagsOnPhoto({
                photoId: currentImage.photoId,
                tags: payload
            }));

            if (result.meta?.requestStatus === 'rejected') {
                Alert.alert(t('Error!'), t('Failed to update tags. Please try again.'));
            } else {
                advanceOrClose();
            }
        } finally {
            setIsSaving(false);
        }
    }, [dispatch, currentImage, advanceOrClose, t]);

    const handleDeletePhoto = useCallback(async () => {
        if (!currentImage?.photoId) return;

        Alert.alert(
            t('Delete Photo'),
            t('This will permanently delete this photo from the server.'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {
                    text: t('Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const result = await dispatch(
                            deleteUploadPhoto({photoId: currentImage.photoId})
                        );
                        if (result.meta?.requestStatus === 'fulfilled') {
                            advanceOrClose();
                        } else {
                            Alert.alert(t('Error'), t('Failed to delete photo.'));
                        }
                    }
                }
            ]
        );
    }, [dispatch, currentImage, advanceOrClose, t]);

    const handleDone = useCallback(() => {
        if (isEditMode) {
            handleUpdateTags();
            return;
        }

        if (allTagged) {
            navigation.navigate('APP', { screen: 'HOME' });
        } else if (swiperIndex < images.length - 1) {
            dispatch(changeSwiperIndex(swiperIndex + 1));
        } else {
            // On last image but not all tagged — loop to first untagged
            const firstUntagged = images.findIndex(img => !isTagged(img));
            if (firstUntagged !== -1) {
                dispatch(changeSwiperIndex(firstUntagged));
            }
        }
    }, [isEditMode, handleUpdateTags, allTagged, navigation, dispatch, swiperIndex, images]);

    const handleBrowsePress = useCallback(() => {
        setShowBrowser(prev => !prev);
    }, []);

    const handleCloseBrowser = useCallback(() => {
        setShowBrowser(false);
    }, []);

    // Animated overlay style
    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value
    }));

    // XP badge scale animation style
    const xpAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{scale: xpScale.value}]
    }));

    // If no images available, redirect back to HomeScreen immediately
    useEffect(() => {
        if (!currentImage && images.length === 0) {
            navigation.goBack();
        }
    }, [currentImage, images.length, navigation]);

    if (!currentImage) {
        return null;
    }

    return (
        <View style={styles.container}>

            {/* Full-screen image viewer */}
            <ImageViewer
                images={images}
                currentIndex={swiperIndex}
                onIndexChange={handleIndexChange}
                onToggleFocus={handleToggleFocus}
                onZoomChange={handleZoomChange}
            />

            {/* Overlays — hidden in focus mode */}
            <Animated.View
                style={[styles.overlayContainer, overlayAnimatedStyle]}
                pointerEvents={focusMode ? 'none' : 'box-none'}>
                {/* Top gradient overlay */}
                <LinearGradient
                    colors={[
                        'rgba(0,0,0,0.65)',
                        'rgba(0,0,0,0.25)',
                        'transparent'
                    ]}
                    locations={[0, 0.6, 1]}>
                    <View style={topInsetStyle}>
                        <View style={styles.topBar}>
                            <RNPressable
                                onPress={() => {
                                    if (isEditMode) dispatch(clearEditingPhoto());
                                    navigation.goBack();
                                }}
                                style={styles.backButton}
                                hitSlop={12}>
                                <Icon
                                    name="arrow-back"
                                    size={22}
                                    color={Colors.white}
                                />
                            </RNPressable>

                            {isEditMode && untaggedCount != null ? (
                                <View style={styles.untaggedCounter}>
                                    <Caption color="white" family="semiBold">
                                        {swiperIndex + 1} / {untaggedCount}
                                    </Caption>
                                </View>
                            ) : (
                                <ImageProgressDots
                                    images={images}
                                    currentIndex={swiperIndex}
                                    onIndexChange={handleIndexChange}
                                />
                            )}

                            {isEditMode && (
                                <RNPressable
                                    onPress={handleDeletePhoto}
                                    style={styles.deletePhotoButton}
                                    hitSlop={12}>
                                    <Icon
                                        name="trash-outline"
                                        size={20}
                                        color="#ff6b6b"
                                    />
                                </RNPressable>
                            )}

                            <Animated.View
                                style={[
                                    styles.xpBadge,
                                    xpAnimatedStyle
                                ]}>
                                <Caption color="accent" family="semiBold">
                                    +{xpEstimate} XP
                                </Caption>
                            </Animated.View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Arrow buttons for image navigation — hidden when keyboard is open */}
                {images.length > 1 && !keyboardVisible && (
                    <View
                        style={styles.arrowContainer}
                        pointerEvents="box-none">
                        {swiperIndex > 0 ? (
                            <Pressable
                                style={styles.arrowButton}
                                onPress={goToPrev}>
                                <Icon
                                    name="chevron-back"
                                    size={24}
                                    color={Colors.white}
                                />
                            </Pressable>
                        ) : (
                            <View />
                        )}
                        {swiperIndex < images.length - 1 ? (
                            <Pressable
                                style={styles.arrowButton}
                                onPress={goToNext}>
                                <Icon
                                    name="chevron-forward"
                                    size={24}
                                    color={Colors.white}
                                />
                            </Pressable>
                        ) : (
                            <View />
                        )}
                    </View>
                )}

                {/* Bottom gradient section */}
                <KeyboardAvoidingView
                    style={styles.bottomSection}
                    behavior={Platform.OS === 'ios' ? 'position' : undefined}
                    keyboardVerticalOffset={0}>
                    <LinearGradient
                        colors={keyboardVisible ? [
                            'transparent',
                            'transparent'
                        ] : [
                            'transparent',
                            'rgba(0,0,0,0.25)',
                            'rgba(0,0,0,0.6)',
                            'rgba(0,0,0,0.8)'
                        ]}
                        locations={keyboardVisible ? [0, 1] : [0, 0.15, 0.5, 1]}
                        style={[styles.bottomGradient, keyboardVisible && {paddingBottom: 14}]}>
                        {/* Tag pills */}
                        <TagPills
                            key={swiperIndex}
                            tags={currentTags}
                            customTags={currentCustomTags}
                            entriesByCloId={entriesByCloId}
                            typeEntriesByKey={typeEntriesByKey}
                            onRemove={handleRemoveTag}
                            onRemoveCustomTag={handleRemoveImageCustomTag}
                            onUpdateQuantity={handleUpdateQuantity}
                            onOpenDetail={handleOpenDetail}
                        />

                        {/* Tag suggestions from other images */}
                        <TagSuggestions
                            images={images}
                            currentIndex={swiperIndex}
                            currentTags={currentTags}
                            entriesByCloId={entriesByCloId}
                            typeEntriesByKey={typeEntriesByKey}
                            onAddTag={handleAddTag}
                        />

                        {/* Search bar */}
                        <TagSearchBar
                            ref={searchBarRef}
                            objectEntries={objectEntries}
                            entriesByCloId={entriesByCloId}
                            currentTags={currentTags}
                            customTags={currentCustomTags}
                            onAddTag={handleAddTag}
                            onAddCustomTag={handleAddImageCustomTag}
                            onPendingCustomTag={setPendingCustomTag}
                            onBrowsePress={handleBrowsePress}
                            showBrowser={showBrowser}
                        />

                        {/* Category browser */}
                        {showBrowser && (
                            <CategoryBrowser
                                categoriesById={categoriesById}
                                objectEntries={objectEntries}
                                currentTags={currentTags}
                                onAddTag={handleAddTag}
                                onClose={handleCloseBrowser}
                            />
                        )}

                        {/* Bottom controls — hidden when keyboard is open */}
                        {!keyboardVisible && (
                            <View style={{paddingBottom: bottomInset}}>
                                <View style={styles.bottomControls}>
                                    <Pressable
                                        disabled={isSaving}
                                        style={({pressed}) => [
                                            styles.doneButton,
                                            isEditMode && styles.updateButton,
                                            pressed && styles.doneButtonPressed,
                                            isSaving && styles.doneButtonDisabled
                                        ]}
                                        onPress={pendingCustomTag ? handleCreatePendingCustomTag : handleDone}>
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color={Colors.white} />
                                        ) : (
                                            <>
                                                <Icon
                                                    name={
                                                        pendingCustomTag
                                                            ? 'pricetag-outline'
                                                            : isEditMode
                                                                ? 'cloud-upload-outline'
                                                                : allTagged
                                                                    ? 'checkmark'
                                                                    : 'arrow-forward'
                                                    }
                                                    size={18}
                                                    color={Colors.white}
                                                />
                                                <Body
                                                    color="white"
                                                    family="semiBold"
                                                    style={styles.doneText}
                                                    dictionary={
                                                        pendingCustomTag
                                                            ? 'Create Tag'
                                                            : isEditMode
                                                                ? 'Update Tags'
                                                                : allTagged
                                                                    ? 'Done'
                                                                    : 'Next'
                                                    }
                                                />
                                            </>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </LinearGradient>
                </KeyboardAvoidingView>

            </Animated.View>

            <TagDetailSheet
                visible={detailTagCurrent != null}
                tag={detailTagCurrent}
                tagEntry={detailTagEntry}
                materials={materialsArray}
                brands={brandsArray}
                brandsById={brandsById}
                onToggleMaterial={handleToggleMaterial}
                onAddBrand={handleAddBrand}
                onRemoveBrand={handleRemoveBrand}
                onAddCustomTag={handleAddCustomTag}
                onRemoveCustomTag={handleRemoveCustomTag}
                onUpdateQuantity={handleUpdateQuantity}
                onSetPickedUp={handleSetPickedUp}
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
    emptyContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16
    },
    emptyText: {
        marginTop: 8
    },
    emptyButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between'
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
    arrowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8
    },
    arrowButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomSection: {
        justifyContent: 'center'
    },
    bottomGradient: {
        paddingBottom: 0
    },
    bottomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8
    },
    doneButton: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.accent,
        borderRadius: 100,
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
