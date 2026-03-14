import React, { useCallback } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { URL, IS_PRODUCTION } from '../../../actions/types';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;
const DOUBLE_TAP_SCALE = 2.0;
const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 400;
const ZOOM_THRESHOLD = 1.02;

const ImageViewer = ({ images, currentIndex, onIndexChange, onToggleFocus, onZoomChange }) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    // Separate swipe offset so it doesn't interfere with zoom pan
    const swipeX = useSharedValue(0);

    const clampTranslation = (tx, ty, s) => {
        'worklet';
        const maxX = Math.max(0, (SCREEN_WIDTH * s - SCREEN_WIDTH) / 2);
        const maxY = Math.max(0, (SCREEN_HEIGHT * s - SCREEN_HEIGHT) / 2);
        return {
            x: Math.min(maxX, Math.max(-maxX, tx)),
            y: Math.min(maxY, Math.max(-maxY, ty)),
        };
    };

    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) {
            onIndexChange(currentIndex + 1);
        }
    }, [currentIndex, images.length, onIndexChange]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
        }
    }, [currentIndex, onIndexChange]);

    const notifyZoomReset = useCallback(() => {
        if (onZoomChange) onZoomChange(false);
    }, [onZoomChange]);

    // Pinch zoom
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate((e) => {
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
            scale.value = newScale;

            if (savedScale.value > 0) {
                const scaleDiff = newScale / savedScale.value;
                const newX = savedTranslateX.value + (1 - scaleDiff) * (e.focalX - SCREEN_WIDTH / 2);
                const newY = savedTranslateY.value + (1 - scaleDiff) * (e.focalY - SCREEN_HEIGHT / 2);
                const clamped = clampTranslation(newX, newY, newScale);
                translateX.value = clamped.x;
                translateY.value = clamped.y;
            }
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;

            if (scale.value < MIN_SCALE + 0.05) {
                // Zoom back to 1x
                scale.value = withTiming(1, { duration: 200 });
                savedScale.value = 1;
                translateX.value = withTiming(0, { duration: 200 });
                translateY.value = withTiming(0, { duration: 200 });
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                // Notify parent to show overlays
                runOnJS(notifyZoomReset)();
            }
        });

    // Pan — pans zoomed image OR swipes between images at 1x
    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            swipeX.value = 0;
        })
        .onUpdate((e) => {
            if (scale.value > ZOOM_THRESHOLD) {
                // Panning zoomed image
                const newX = savedTranslateX.value + e.translationX;
                const newY = savedTranslateY.value + e.translationY;
                const clamped = clampTranslation(newX, newY, scale.value);
                translateX.value = clamped.x;
                translateY.value = clamped.y;
            } else {
                // At 1x: image follows finger horizontally for swipe feedback
                swipeX.value = e.translationX;
            }
        })
        .onEnd((e) => {
            if (scale.value <= ZOOM_THRESHOLD) {
                // Swipe detection at 1x zoom
                const isHorizontalSwipe = Math.abs(e.translationX) > Math.abs(e.translationY) * 1.2;
                const hasSufficientDistance = Math.abs(e.translationX) > SWIPE_THRESHOLD;
                const hasSufficientVelocity = Math.abs(e.velocityX) > SWIPE_VELOCITY;

                if (isHorizontalSwipe && (hasSufficientDistance || hasSufficientVelocity)) {
                    swipeX.value = 0;
                    if (e.translationX < 0) {
                        runOnJS(goNext)();
                    } else {
                        runOnJS(goPrev)();
                    }
                } else {
                    // Snap back
                    swipeX.value = withTiming(0, { duration: 150 });
                }
            } else {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            }
        });

    // Double tap — toggle between 1x and 2x
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((e) => {
            if (scale.value > ZOOM_THRESHOLD) {
                scale.value = withTiming(1, { duration: 200 });
                savedScale.value = 1;
                translateX.value = withTiming(0, { duration: 200 });
                translateY.value = withTiming(0, { duration: 200 });
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                runOnJS(notifyZoomReset)();
            } else {
                const targetScale = DOUBLE_TAP_SCALE;
                const originX = e.x - SCREEN_WIDTH / 2;
                const originY = e.y - SCREEN_HEIGHT / 2;
                const newX = -originX * (targetScale - 1);
                const newY = -originY * (targetScale - 1);
                const clamped = clampTranslation(newX, newY, targetScale);

                scale.value = withTiming(targetScale, { duration: 250 });
                savedScale.value = targetScale;
                translateX.value = withTiming(clamped.x, { duration: 250 });
                translateY.value = withTiming(clamped.y, { duration: 250 });
                savedTranslateX.value = clamped.x;
                savedTranslateY.value = clamped.y;
            }
        });

    // Single tap — toggle focus mode
    const singleTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .requireExternalGestureToFail(doubleTapGesture)
        .onEnd(() => {
            if (onToggleFocus) {
                runOnJS(onToggleFocus)('tap');
            }
        });

    // Compose: pinch runs simultaneously with pan; taps are exclusive with pan
    const composed = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture),
        singleTapGesture,
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value + swipeX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    // Reset zoom when image changes
    React.useEffect(() => {
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        swipeX.value = 0;
    }, [currentIndex]);

    const currentImage = images[currentIndex];
    if (!currentImage) return null;

    let imageUri = currentImage.uri || currentImage.filename;

    // Local dev: Minio stores URLs with 127.0.0.1 which the phone can't reach.
    // Rewrite to the LAN host extracted from the API base URL.
    if (!IS_PRODUCTION && imageUri?.includes('127.0.0.1')) {
        const match = URL.match(/:\/\/([^:/]+)/);
        if (match) {
            imageUri = imageUri.replace('127.0.0.1', match[1]);
        }
    }

    return (
        <View style={styles.container}>
            <GestureDetector gesture={composed}>
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        resizeMode="contain"
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
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
});

export default React.memo(ImageViewer);
