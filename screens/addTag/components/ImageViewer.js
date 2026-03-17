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

    // ActivityIndicator always mounted — hidden via opacity instead of conditional
    // mount/unmount. Under Fabric, {loading && <ActivityIndicator>} causes
    // "Attempt to mount already mounted component view" when loading state toggles
    // rapidly during swipe transitions.
    return (
        <>
            <ActivityIndicator
                style={[styles.slideLoader, {opacity: loading ? 1 : 0}]}
                color="rgba(255,255,255,0.5)"
                size="large"
            />
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

/**
 * Image viewer with pinch-to-zoom, double-tap zoom, and horizontal swipe.
 * No single-tap gesture — this is a tag editor first, photo viewer second.
 */
const ImageViewer = ({
    images,
    currentIndex: rawCurrentIndex,
    onIndexChange
}) => {
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();

    // Clamp index locally to prevent out-of-bounds access when array shrinks
    const currentIndex = images?.length
        ? Math.max(0, Math.min(rawCurrentIndex, images.length - 1))
        : 0;

    // --- Shared values for worklet-safe access ---
    const indexSV = useSharedValue(currentIndex);
    const countSV = useSharedValue(images?.length ?? 0);

    useEffect(() => {
        indexSV.value = currentIndex;
    }, [currentIndex, indexSV]);

    useEffect(() => {
        countSV.value = images?.length ?? 0;
    }, [images?.length, countSV]);

    // Use ref for callback so worklet closure is never stale
    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

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

    // Resolve URI for a given index
    const getUri = (idx) => {
        if (idx < 0 || idx >= images.length) return null;
        const img = images[idx];
        if (!img) return null;
        return resolveUri(img.uri || img.filename);
    };

    // Compute the 3 visible URIs
    const prevSlotUris = useRef([null, null, null]);
    const slotUris = useMemo(() => {
        const next = [
            getUri(currentIndex - 1),
            getUri(currentIndex),
            getUri(currentIndex + 1)
        ];
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

    // Prefetch next 2 images for smooth swiping
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

    // Stable JS-thread callback for runOnJS.
    // Parent owns the clamp — no shared value reads on JS thread.
    const commitIndexChange = useCallback(
        newIndex => {
            if (__DEV__) console.log('[Viewer] swipe commit →', newIndex);
            onIndexChangeRef.current?.(newIndex);
            isSwipeProcessing.value = false;
        },
        [isSwipeProcessing]
    );

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
            }
        });

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        // Require 15px of movement before activating. Without this, taps on
        // overlay elements (suggestion chips, search results) pass through
        // pointerEvents="box-none" to the native gesture layer and get
        // interpreted as micro-swipes, triggering phantom index changes.
        .minDistance(15)
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

    // No singleTapGesture — this screen is a tag editor, not an immersive viewer.
    // Double-tap, pinch, and pan are the only gestures.
    const composed = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
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

    // Reset on index or center image change
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
