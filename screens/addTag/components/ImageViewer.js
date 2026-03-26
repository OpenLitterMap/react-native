import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Image, Keyboard, StyleSheet, useWindowDimensions, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import resolveUri from '../../../utils/resolveUri';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    cancelAnimation
} from 'react-native-reanimated';

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;
const DOUBLE_TAP_SCALE = 2.0;
const SWIPE_THRESHOLD_RATIO = 0.18;
const SWIPE_VELOCITY = 500;
const ZOOM_THRESHOLD = 1.02;
const EDGE_RESISTANCE = 0.28;
const SPRING_CONFIG = {
    damping: 24,
    stiffness: 240,
    mass: 0.9,
    overshootClamping: true
};

const SlideImage = React.memo(({uri, screenWidth, screenHeight, cachedUris}) => {
    const [loading, setLoading] = useState(() => !cachedUris.current.has(uri));

    useEffect(() => {
        setLoading(!cachedUris.current.has(uri));
    }, [uri, cachedUris]);

    const handleLoad = useCallback(() => {
        cachedUris.current.add(uri);
        setLoading(false);
    }, [uri, cachedUris]);

    return (
        <>
            <ActivityIndicator
                style={[styles.slideLoader, {opacity: loading ? 1 : 0}]}
                color="rgba(255,255,255,0.5)"
                size="large"
            />
            <Image
                source={{uri}}
                style={{
                    width: screenWidth,
                    height: screenHeight
                }}
                fadeDuration={0}
                resizeMode="contain"
                onLoad={handleLoad}
                onError={handleLoad}
            />
        </>
    );
});

const Slide = React.memo(({
    uri,
    offsetX,
    screenWidth,
    screenHeight,
    cachedUris,
    animatedStyle
}) => (
    <Animated.View
        style={[
            styles.slide,
            {left: offsetX, width: screenWidth},
            animatedStyle
        ]}>
        {uri && (
            <SlideImage
                uri={uri}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                cachedUris={cachedUris}
            />
        )}
    </Animated.View>
));

const ImageViewer = ({
    images,
    currentIndex: rawCurrentIndex,
    onIndexChange,
    onSingleTap
}) => {
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();

    const currentIndex = images?.length
        ? Math.max(0, Math.min(rawCurrentIndex, images.length - 1))
        : 0;

    const indexSV = useSharedValue(currentIndex);
    const countSV = useSharedValue(images?.length ?? 0);
    const cameraX = useSharedValue(currentIndex * SCREEN_WIDTH);
    const panStartCameraX = useSharedValue(currentIndex * SCREEN_WIDTH);
    const isSwipeProcessing = useSharedValue(false);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const zoomX = useSharedValue(0);
    const zoomY = useSharedValue(0);
    const savedZoomX = useSharedValue(0);
    const savedZoomY = useSharedValue(0);

    useEffect(() => {
        indexSV.value = currentIndex;
    }, [currentIndex, indexSV]);

    useEffect(() => {
        countSV.value = images?.length ?? 0;
    }, [images?.length, countSV]);

    const cachedUris = useRef(new Set());
    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    const clampTranslation = (tx, ty, s) => {
        'worklet';
        const maxX = Math.max(0, (SCREEN_WIDTH * s - SCREEN_WIDTH) / 2);
        const maxY = Math.max(0, (SCREEN_HEIGHT * s - SCREEN_HEIGHT) / 2);
        return {
            x: Math.min(maxX, Math.max(-maxX, tx)),
            y: Math.min(maxY, Math.max(-maxY, ty))
        };
    };

    const getUri = useCallback(idx => {
        if (!images || idx < 0 || idx >= images.length) return null;
        const img = images[idx];
        if (!img) return null;
        return resolveUri(img.uri || img.filename);
    }, [images]);

    const visibleIndices = useMemo(
        () => [
            currentIndex - 2,
            currentIndex - 1,
            currentIndex,
            currentIndex + 1,
            currentIndex + 2
        ].filter(idx => idx >= 0 && idx < (images?.length ?? 0)),
        [currentIndex, images?.length]
    );

    const prefetchTargets = useMemo(
        () => [
            getUri(currentIndex - 1),
            getUri(currentIndex),
            getUri(currentIndex + 1),
            getUri(currentIndex - 2),
            getUri(currentIndex + 2),
            getUri(currentIndex + 3)
        ].filter(Boolean),
        [currentIndex, getUri]
    );

    useEffect(() => {
        prefetchTargets
            .filter(uri => !cachedUris.current.has(uri))
            .forEach(uri => {
                Image.prefetch(uri)
                    .then(() => cachedUris.current.add(uri))
                    .catch(() => {});
            });
    }, [prefetchTargets]);

    const commitIndexChange = useCallback(
        newIndex => {
            onIndexChangeRef.current?.(newIndex);
            isSwipeProcessing.value = false;
        },
        [isSwipeProcessing]
    );

    const dismissKeyboard = useCallback(() => {
        Keyboard.dismiss();
        onSingleTap?.();
    }, [onSingleTap]);

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
                scale.value = withTiming(1, {duration: 180});
                savedScale.value = 1;
                zoomX.value = withTiming(0, {duration: 180});
                zoomY.value = withTiming(0, {duration: 180});
                savedZoomX.value = 0;
                savedZoomY.value = 0;
            }
        });

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(1)
        .activeOffsetX([-8, 8])
        .failOffsetY([-16, 16])
        .onStart(() => {
            cancelAnimation(cameraX);
            cancelAnimation(zoomX);
            cancelAnimation(zoomY);
            panStartCameraX.value = cameraX.value;
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
                return;
            }

            const len = countSV.value;
            const minCameraX = 0;
            const maxCameraX = Math.max(0, (len - 1) * SCREEN_WIDTH);
            let nextCameraX = panStartCameraX.value - e.translationX;

            if (nextCameraX < minCameraX) {
                nextCameraX = minCameraX + (nextCameraX - minCameraX) * EDGE_RESISTANCE;
            } else if (nextCameraX > maxCameraX) {
                nextCameraX = maxCameraX + (nextCameraX - maxCameraX) * EDGE_RESISTANCE;
            }

            cameraX.value = nextCameraX;
        })
        .onEnd(e => {
            if (scale.value > ZOOM_THRESHOLD) {
                savedZoomX.value = zoomX.value;
                savedZoomY.value = zoomY.value;
                return;
            }

            const idx = indexSV.value;
            const len = countSV.value;
            const threshold = SCREEN_WIDTH * SWIPE_THRESHOLD_RATIO;
            const canGoPrev = idx > 0;
            const canGoNext = idx < len - 1;
            const translationX = (idx * SCREEN_WIDTH) - cameraX.value;
            const shouldGoPrev =
                canGoPrev &&
                (translationX > threshold || e.velocityX > SWIPE_VELOCITY);
            const shouldGoNext =
                canGoNext &&
                (translationX < -threshold || e.velocityX < -SWIPE_VELOCITY);

            if ((shouldGoPrev || shouldGoNext) && !isSwipeProcessing.value) {
                isSwipeProcessing.value = true;
                const newIndex = shouldGoNext ? idx + 1 : idx - 1;
                const targetCameraX = newIndex * SCREEN_WIDTH;
                cameraX.value = withSpring(
                    targetCameraX,
                    {
                        ...SPRING_CONFIG,
                        velocity: (-e.velocityX) / 1000
                    },
                    finished => {
                        if (finished) {
                            runOnJS(commitIndexChange)(newIndex);
                        } else {
                            isSwipeProcessing.value = false;
                        }
                    }
                );
                return;
            }

            cameraX.value = withSpring(idx * SCREEN_WIDTH, {
                ...SPRING_CONFIG,
                velocity: (-e.velocityX) / 1000
            });
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(220)
        .onEnd(e => {
            if (scale.value > ZOOM_THRESHOLD) {
                scale.value = withTiming(1, {duration: 180});
                savedScale.value = 1;
                zoomX.value = withTiming(0, {duration: 180});
                zoomY.value = withTiming(0, {duration: 180});
                savedZoomX.value = 0;
                savedZoomY.value = 0;
                return;
            }

            const targetScale = DOUBLE_TAP_SCALE;
            const originX = e.x - SCREEN_WIDTH / 2;
            const originY = e.y - SCREEN_HEIGHT / 2;
            const newX = -originX * (targetScale - 1);
            const newY = -originY * (targetScale - 1);
            const clamped = clampTranslation(newX, newY, targetScale);
            scale.value = withTiming(targetScale, {duration: 220});
            savedScale.value = targetScale;
            zoomX.value = withTiming(clamped.x, {duration: 220});
            zoomY.value = withTiming(clamped.y, {duration: 220});
            savedZoomX.value = clamped.x;
            savedZoomY.value = clamped.y;
        });

    const singleTapGesture = Gesture.Tap()
        .maxDuration(220)
        .maxDeltaX(12)
        .maxDeltaY(12)
        .onEnd((_event, success) => {
            if (success) {
                runOnJS(dismissKeyboard)();
            }
        });

    const composed = Gesture.Exclusive(
        doubleTapGesture,
        singleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const stripStyle = useAnimatedStyle(() => ({
        transform: [{translateX: -cameraX.value}]
    }));

    const currentSlideStyle = useAnimatedStyle(() => ({
        transform: [
            {translateX: zoomX.value},
            {translateY: zoomY.value},
            {scale: scale.value}
        ]
    }));

    useLayoutEffect(() => {
        const targetCameraX = currentIndex * SCREEN_WIDTH;

        cancelAnimation(cameraX);
        cancelAnimation(zoomX);
        cancelAnimation(zoomY);
        cancelAnimation(scale);

        if (Math.abs(cameraX.value - targetCameraX) > 1) {
            cameraX.value = targetCameraX;
        }
        scale.value = 1;
        savedScale.value = 1;
        zoomX.value = 0;
        zoomY.value = 0;
        savedZoomX.value = 0;
        savedZoomY.value = 0;
        isSwipeProcessing.value = false;
    }, [
        SCREEN_WIDTH,
        currentIndex,
        cameraX,
        scale,
        savedScale,
        zoomX,
        zoomY,
        savedZoomX,
        savedZoomY,
        isSwipeProcessing
    ]);

    useEffect(() => {
        return () => {
            cancelAnimation(cameraX);
            cancelAnimation(scale);
            cancelAnimation(zoomX);
            cancelAnimation(zoomY);
        };
    }, [cameraX, scale, zoomX, zoomY]);

    if (!images || images.length === 0 || !images[currentIndex]) return null;

    return (
        <View style={styles.container}>
            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.strip, stripStyle]}>
                    {visibleIndices.map(idx => (
                        <Slide
                            key={idx}
                            uri={getUri(idx)}
                            offsetX={idx * SCREEN_WIDTH}
                            screenWidth={SCREEN_WIDTH}
                            screenHeight={SCREEN_HEIGHT}
                            cachedUris={cachedUris}
                            animatedStyle={idx === currentIndex ? currentSlideStyle : undefined}
                        />
                    ))}
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
