import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {Body, Caption, Colors} from '../components';
import ImageViewer from './components/ImageViewer';
import TagPills from './components/TagPills';
import TagSearchBar from './components/TagSearchBar';
import TagSuggestions from './components/TagSuggestions';
import CategoryBrowser from './components/CategoryBrowser';
import ImageProgressDots from './components/ImageProgressDots';
import {
    addTagV5,
    changeSwiperIndex,
    removeTagV5,
    togglePickedUpByIndex,
    updateTagQuantityV5
} from '../../reducers/images_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';

const AddTagScreen = ({navigation}) => {
    const dispatch = useDispatch();

    // Redux state
    const images = useSelector(state => state.images.imagesArray);
    const swiperIndex = useSelector(state => state.images.swiperIndex);
    const token = useSelector(state => state.auth.token);

    const {
        objectEntries,
        categoriesById,
        entriesByCloId,
        typeEntriesByKey,
        loading: tagsLoading
    } = useSelector(state => state.tags);

    // Focus mode: hides overlays so user can see full image
    const [focusMode, setFocusMode] = useState(false);
    const [showBrowser, setShowBrowser] = useState(false);

    // Overlay opacity for focus mode transitions
    const overlayOpacity = useRef(new Animated.Value(1)).current;

    // XP badge pulse animation
    const xpScale = useRef(new Animated.Value(1)).current;

    // Fetch tags on mount if not loaded
    useEffect(() => {
        if (objectEntries.length === 0 && !tagsLoading) {
            dispatch(fetchAllTags({token}));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentImage = images[swiperIndex];
    const currentTags = useMemo(
        () => currentImage?.tagsV5 || [],
        [currentImage?.tagsV5]
    );
    const pickedUp = currentImage?.picked_up || false;

    // XP estimate: 5 (upload) + sum(quantities) + 5 if picked_up
    const xpEstimate = useMemo(() => {
        let xp = 5;
        for (const tag of currentTags) {
            xp += tag.quantity;
        }
        if (pickedUp) {
            xp += 5;
        }
        return xp;
    }, [currentTags, pickedUp]);

    // Pulse XP badge when estimate changes
    const prevXp = useRef(xpEstimate);
    useEffect(() => {
        if (xpEstimate !== prevXp.current) {
            Animated.sequence([
                Animated.timing(xpScale, {
                    toValue: 1.15,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(xpScale, {
                    toValue: 1.0,
                    duration: 100,
                    useNativeDriver: true
                })
            ]).start();
            prevXp.current = xpEstimate;
        }
    }, [xpEstimate, xpScale]);

    // Image navigation
    const handleIndexChange = useCallback(
        newIndex => {
            dispatch(changeSwiperIndex(newIndex));
        },
        [dispatch]
    );

    // Focus mode toggle from ImageViewer gestures
    const handleToggleFocus = useCallback(() => {
        setFocusMode(prev => {
            const next = !prev;
            Animated.timing(overlayOpacity, {
                toValue: next ? 0 : 1,
                duration: 200,
                useNativeDriver: true
            }).start();
            return next;
        });
    }, [overlayOpacity]);

    // When user zooms back to 1x, show overlays
    const handleZoomChange = useCallback(
        isZoomed => {
            if (!isZoomed && focusMode) {
                setFocusMode(false);
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }).start();
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
            dispatch(addTagV5({imageIndex: swiperIndex, cloId, typeId}));
        },
        [dispatch, swiperIndex]
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

    const handleTogglePickedUp = useCallback(() => {
        dispatch(togglePickedUpByIndex(swiperIndex));
    }, [dispatch, swiperIndex]);

    const handleDone = useCallback(() => {
        navigation.navigate('HOME');
    }, [navigation]);

    const handleBrowsePress = useCallback(() => {
        setShowBrowser(prev => !prev);
    }, []);

    const handleCloseBrowser = useCallback(() => {
        setShowBrowser(false);
    }, []);

    // Animated overlay style
    const overlayAnimatedStyle = {opacity: overlayOpacity};

    if (!currentImage) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Icon name="images-outline" size={48} color={Colors.muted} />
                <Body color="muted" style={styles.emptyText}>
                    No images selected
                </Body>
                <Pressable onPress={handleDone} style={styles.emptyButton}>
                    <Body color="accent">Go Back</Body>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

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
                    <SafeAreaView>
                        <View style={styles.topBar}>
                            <Pressable
                                onPress={handleDone}
                                style={styles.backButton}
                                hitSlop={8}>
                                <Icon
                                    name="arrow-back"
                                    size={22}
                                    color={Colors.white}
                                />
                            </Pressable>

                            <ImageProgressDots
                                images={images}
                                currentIndex={swiperIndex}
                                onIndexChange={handleIndexChange}
                            />

                            <Animated.View
                                style={[
                                    styles.xpBadge,
                                    {transform: [{scale: xpScale}]}
                                ]}>
                                <Caption color="accent" family="semiBold">
                                    +{xpEstimate} XP
                                </Caption>
                            </Animated.View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Arrow buttons for image navigation */}
                {images.length > 1 && (
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
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}>
                    <LinearGradient
                        colors={[
                            'transparent',
                            'rgba(0,0,0,0.25)',
                            'rgba(0,0,0,0.6)',
                            'rgba(0,0,0,0.8)'
                        ]}
                        locations={[0, 0.15, 0.5, 1]}
                        style={styles.bottomGradient}>
                        {/* Tag pills */}
                        <TagPills
                            tags={currentTags}
                            entriesByCloId={entriesByCloId}
                            typeEntriesByKey={typeEntriesByKey}
                            onRemove={handleRemoveTag}
                            onUpdateQuantity={handleUpdateQuantity}
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
                            objectEntries={objectEntries}
                            entriesByCloId={entriesByCloId}
                            categoriesById={categoriesById}
                            currentTags={currentTags}
                            onAddTag={handleAddTag}
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

                        {/* Bottom controls */}
                        <SafeAreaView>
                            <View style={styles.bottomControls}>
                                {/* Picked up toggle */}
                                <Pressable
                                    style={[
                                        styles.pickedUpToggle,
                                        pickedUp && styles.pickedUpActive
                                    ]}
                                    onPress={handleTogglePickedUp}>
                                    <Icon
                                        name={
                                            pickedUp
                                                ? 'checkmark-circle'
                                                : 'checkmark-circle-outline'
                                        }
                                        size={18}
                                        color={
                                            pickedUp
                                                ? Colors.white
                                                : Colors.accent
                                        }
                                    />
                                    <Caption
                                        color={pickedUp ? 'white' : 'white'}
                                        family="medium"
                                        style={styles.pickedUpText}>
                                        Picked Up
                                    </Caption>
                                </Pressable>

                                {/* Tag count */}
                                {currentTags.length > 0 && (
                                    <View style={styles.tagCountBadge}>
                                        <Caption color="white" family="medium">
                                            {currentTags.length} tag
                                            {currentTags.length !== 1
                                                ? 's'
                                                : ''}
                                        </Caption>
                                    </View>
                                )}

                                {/* Done button */}
                                <Pressable
                                    style={({pressed}) => [
                                        styles.doneButton,
                                        pressed && styles.doneButtonPressed
                                    ]}
                                    onPress={handleDone}>
                                    <Icon
                                        name="checkmark"
                                        size={18}
                                        color={Colors.white}
                                    />
                                    <Body
                                        color="white"
                                        family="semiBold"
                                        style={styles.doneText}>
                                        Done
                                    </Body>
                                </Pressable>
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                </KeyboardAvoidingView>
            </Animated.View>
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    xpBadge: {
        marginLeft: 'auto',
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
        paddingBottom: 0
    },
    bottomGradient: {
        paddingBottom: 8
    },
    bottomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8
    },
    pickedUpToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    pickedUpActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent
    },
    pickedUpText: {
        marginLeft: 6,
        fontSize: 12
    },
    tagCountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 100
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
    doneText: {
        fontSize: 15
    }
});

export default AddTagScreen;
