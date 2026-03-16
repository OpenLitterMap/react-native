import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Image, StyleSheet, useWindowDimensions, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import resolveUri from '../../../utils/resolveUri';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    cancelAnimation
} from 'react-native-reanimated';

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;
const DOUBLE_TAP_SCALE = 2.0;
const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 400;
const ZOOM_THRESHOLD = 1.02;
const SNAP_DURATION = 250;


/**
 * Single slide that renders an image at a fixed horizontal offset.
 * Does NOT receive any animated style — avoids Reanimated crash from
 * toggling useAnimatedStyle across mount/unmount cycles.
 */
const SlideImage = React.memo(({uri, screenWidth, screenHeight}) => {
    const [loading, setLoading] = useState(true);

    // Reset loading when URI changes (component is reused across slides)
    useEffect(() => {
        setLoading(true);
    }, [uri]);

    return (
        <>
            {loading && (
                <ActivityIndicator
                    style={styles.slideLoader}
                    color="rgba(255,255,255,0.5)"
                    size="large"
                />
            )}
            <Image
                source={{uri}}
                style={{width: screenWidth, height: screenHeight}}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
            />
        </>
    );
});

const Slide = React.memo(({uri, offsetX, screenWidth, screenHeight}) => (
    <View style={[styles.slide, {left: offsetX, width: screenWidth}]}>
        {uri && (
            <SlideImage
                uri={uri}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
            />
        )}
    </View>
));

const ImageViewer = ({
    images,
    currentIndex: rawCurrentIndex,
    onIndexChange,
    onToggleFocus,
    onZoomChange
}) => {
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();

    // Clamp index locally to prevent out-of-bounds access when array shrinks
    const currentIndex = images?.length
        ? Math.max(0, Math.min(rawCurrentIndex, images.length - 1))
        : 0;

    // --- Shared values for worklet-safe access ---
    // These mirror the JS props so gesture worklets always read current values.
    const indexSV = useSharedValue(currentIndex);
    const countSV = useSharedValue(images?.length ?? 0);

    // Keep shared values in sync with props
    useEffect(() => {
        indexSV.value = currentIndex;
    }, [currentIndex, indexSV]);

    useEffect(() => {
        countSV.value = images?.length ?? 0;
    }, [images?.length, countSV]);

    // Use ref for callbacks so worklet closures are never stale
    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    const onZoomChangeRef = useRef(onZoomChange);
    onZoomChangeRef.current = onZoomChange;

    const onToggleFocusRef = useRef(onToggleFocus);
    onToggleFocusRef.current = onToggleFocus;

    // Zoom (current image only)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const zoomX = useSharedValue(0);
    const zoomY = useSharedValue(0);
    const savedZoomX = useSharedValue(0);
    const savedZoomY = useSharedValue(0);

    // Swipe — horizontal offset of the entire strip
    const stripOffset = useSharedValue(0);
    const isSwipeProcessing = useSharedValue(false);

    const clampTranslation = (tx, ty, s) => {
        'worklet';
        const maxX = Math.max(0, (SCREEN_WIDTH * s - SCREEN_WIDTH) / 2);
        const maxY = Math.max(0, (SCREEN_HEIGHT * s - SCREEN_HEIGHT) / 2);
        return {
            x: Math.min(maxX, Math.max(-maxX, tx)),
            y: Math.min(maxY, Math.max(-maxY, ty))
        };
    };

    // Resolve URI for a given index — reads directly from images array.
    const getUri = (idx) => {
        if (idx < 0 || idx >= images.length) return null;
        const img = images[idx];
        if (!img) return null;
        return resolveUri(img.uri || img.filename);
    };

    // Compute the 3 visible URIs. Use a ref to avoid unnecessary re-renders
    // when the images array grows (prefetch appends) but the visible 3 are unchanged.
    const prevSlotUris = useRef([null, null, null]);
    const slotUris = useMemo(() => {
        const next = [
            getUri(currentIndex - 1),
            getUri(currentIndex),
            getUri(currentIndex + 1)
        ];
        // Return same reference if URIs haven't changed (prevents Image remount)
        if (
            next[0] === prevSlotUris.current[0] &&
            next[1] === prevSlotUris.current[1] &&
            next[2] === prevSlotUris.current[2]
        ) {
            return prevSlotUris.current;
        }
        prevSlotUris.current = next;
        return next;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, images]);

    // Prefetch next 2 images for smooth swiping (deduplicated, only marked after success)
    const prefetchedUris = useRef(new Set());
    const prefetchTargets = useMemo(
        () => [getUri(currentIndex + 1), getUri(currentIndex + 2)].filter(Boolean),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentIndex, images]
    );
    useEffect(() => {
        prefetchTargets
            .filter(uri => !prefetchedUris.current.has(uri))
            .forEach(uri => {
                Image.prefetch(uri)
                    .then(() => prefetchedUris.current.add(uri))
                    .catch(() => {});
            });
    }, [prefetchTargets]);

    // Stable JS-thread callback for runOnJS — uses ref to avoid stale closure
    const commitIndexChange = useCallback(
        newIndex => {
            const len = countSV.value;
            if (newIndex >= 0 && newIndex < len) {
                onIndexChangeRef.current(newIndex);
            }
            isSwipeProcessing.value = false;
        },
        [countSV, isSwipeProcessing]
    );

    const notifyZoomReset = useCallback(() => {
        onZoomChangeRef.current?.(false);
    }, []);

    const notifyToggleFocus = useCallback(() => {
        onToggleFocusRef.current?.('tap');
    }, []);

    // --- Gestures ---

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate(e => {
            const newScale = Math.min(
                MAX_SCALE,
                Math.max(MIN_SCALE, savedScale.value * e.scale)
            );
            scale.value = newScale;
            if (savedScale.value > 0) {
                const diff = newScale / savedScale.value;
                const newX =
                    savedZoomX.value +
                    (1 - diff) * (e.focalX - SCREEN_WIDTH / 2);
                const newY =
                    savedZoomY.value +
                    (1 - diff) * (e.focalY - SCREEN_HEIGHT / 2);
                const clamped = clampTranslation(newX, newY, newScale);
                zoomX.value = clamped.x;
                zoomY.value = clamped.y;
            }
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            savedZoomX.value = zoomX.value;
            savedZoomY.value = zoomY.value;
            if (scale.value < MIN_SCALE + 0.05) {
                scale.value = withTiming(1, {duration: 200});
                savedScale.value = 1;
                zoomX.value = withTiming(0, {duration: 200});
                zoomY.value = withTiming(0, {duration: 200});
                savedZoomX.value = 0;
                savedZoomY.value = 0;
                runOnJS(notifyZoomReset)();
            }
        });

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        .onStart(() => {
            cancelAnimation(stripOffset);
            if (scale.value > ZOOM_THRESHOLD) {
                savedZoomX.value = zoomX.value;
                savedZoomY.value = zoomY.value;
            }
        })
        .onUpdate(e => {
            if (scale.value > ZOOM_THRESHOLD) {
                const newX = savedZoomX.value + e.translationX;
                const newY = savedZoomY.value + e.translationY;
                const clamped = clampTranslation(newX, newY, scale.value);
                zoomX.value = clamped.x;
                zoomY.value = clamped.y;
            } else {
                stripOffset.value = e.translationX;
            }
        })
        .onEnd(e => {
            if (scale.value > ZOOM_THRESHOLD) {
                savedZoomX.value = zoomX.value;
                savedZoomY.value = zoomY.value;
                return;
            }

            const isHorizontal =
                Math.abs(e.translationX) > Math.abs(e.translationY) * 1.2;
            const hasDist = Math.abs(e.translationX) > SWIPE_THRESHOLD;
            const hasVel = Math.abs(e.velocityX) > SWIPE_VELOCITY;
            const swipedLeft = e.translationX < 0;
            const swipedRight = e.translationX > 0;

            if (
                isHorizontal &&
                (hasDist || hasVel) &&
                !isSwipeProcessing.value
            ) {
                // Read current values from shared values (not stale JS closure)
                const idx = indexSV.value;
                const len = countSV.value;
                const canGoNext = swipedLeft && idx < len - 1;
                const canGoPrev = swipedRight && idx > 0;

                if (canGoNext || canGoPrev) {
                    isSwipeProcessing.value = true;
                    const targetX = canGoNext
                        ? -SCREEN_WIDTH
                        : SCREEN_WIDTH;
                    const newIdx = canGoNext ? idx + 1 : idx - 1;
                    stripOffset.value = withTiming(
                        targetX,
                        {duration: SNAP_DURATION},
                        finished => {
                            if (finished) {
                                runOnJS(commitIndexChange)(newIdx);
                            } else {
                                // Animation cancelled — reset guard
                                isSwipeProcessing.value = false;
                            }
                        }
                    );
                } else {
                    stripOffset.value = withTiming(0, {duration: 150});
                }
            } else {
                stripOffset.value = withTiming(0, {duration: 150});
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(e => {
            if (scale.value > ZOOM_THRESHOLD) {
                scale.value = withTiming(1, {duration: 200});
                savedScale.value = 1;
                zoomX.value = withTiming(0, {duration: 200});
                zoomY.value = withTiming(0, {duration: 200});
                savedZoomX.value = 0;
                savedZoomY.value = 0;
                runOnJS(notifyZoomReset)();
            } else {
                const targetScale = DOUBLE_TAP_SCALE;
                const originX = e.x - SCREEN_WIDTH / 2;
                const originY = e.y - SCREEN_HEIGHT / 2;
                const newX = -originX * (targetScale - 1);
                const newY = -originY * (targetScale - 1);
                const clamped = clampTranslation(newX, newY, targetScale);
                scale.value = withTiming(targetScale, {duration: 250});
                savedScale.value = targetScale;
                zoomX.value = withTiming(clamped.x, {duration: 250});
                zoomY.value = withTiming(clamped.y, {duration: 250});
                savedZoomX.value = clamped.x;
                savedZoomY.value = clamped.y;
            }
        });

    const singleTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .requireExternalGestureToFail(doubleTapGesture)
        .onEnd(() => {
            runOnJS(notifyToggleFocus)();
        });

    const composed = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture),
        singleTapGesture
    );

    // --- Animated styles ---

    const stripStyle = useAnimatedStyle(() => ({
        transform: [{translateX: stripOffset.value}]
    }));

    const zoomStyle = useAnimatedStyle(() => ({
        transform: [
            {translateX: zoomX.value},
            {translateY: zoomY.value},
            {scale: scale.value}
        ]
    }));

    // Reset on index or center image change — handles both swipe and in-place replacement
    useEffect(() => {
        cancelAnimation(stripOffset);
        cancelAnimation(zoomX);
        cancelAnimation(zoomY);
        cancelAnimation(scale);
        scale.value = 1;
        savedScale.value = 1;
        zoomX.value = 0;
        zoomY.value = 0;
        savedZoomX.value = 0;
        savedZoomY.value = 0;
        stripOffset.value = 0;
        isSwipeProcessing.value = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, slotUris[1]]);

    // Cancel animations on unmount
    useEffect(() => {
        return () => {
            cancelAnimation(stripOffset);
            cancelAnimation(scale);
            cancelAnimation(zoomX);
            cancelAnimation(zoomY);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!images || images.length === 0 || !images[currentIndex]) return null;

    return (
        <View style={styles.container}>
            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.strip, stripStyle]}>
                    {/* Prev slot */}
                    <Slide
                        key="prev"
                        uri={slotUris[0]}
                        offsetX={-SCREEN_WIDTH}
                        screenWidth={SCREEN_WIDTH}
                        screenHeight={SCREEN_HEIGHT}
                    />
                    {/* Center slot — receives zoom */}
                    <Animated.View
                        key="center"
                        style={[
                            styles.slide,
                            {left: 0, width: SCREEN_WIDTH},
                            zoomStyle
                        ]}>
                        {slotUris[1] && (
                            <SlideImage
                                uri={slotUris[1]}
                                screenWidth={SCREEN_WIDTH}
                                screenHeight={SCREEN_HEIGHT}
                            />
                        )}
                    </Animated.View>
                    {/* Next slot */}
                    <Slide
                        key="next"
                        uri={slotUris[2]}
                        offsetX={SCREEN_WIDTH}
                        screenWidth={SCREEN_WIDTH}
                        screenHeight={SCREEN_HEIGHT}
                    />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden'
    },
    strip: {
        flex: 1
    },
    slideLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -18,
        marginLeft: -18,
        zIndex: 1
    },
    slide: {
        position: 'absolute',
        top: 0,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default React.memo(ImageViewer);
