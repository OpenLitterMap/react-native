import React from 'react';
import {Image, ScrollView, StyleSheet, useWindowDimensions, View} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    runOnJS
} from 'react-native-reanimated';
import {Body, Colors, Title} from '../../components';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const AnimatedDot = ({index, scrollX, screenWidth}) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth
        ];
        return {
            width: interpolate(
                scrollX.value,
                inputRange,
                [8, 24, 8],
                Extrapolation.CLAMP
            ),
            opacity: interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                Extrapolation.CLAMP
            )
        };
    });

    return (
        <Animated.View
            style={[
                styles.dot,
                {backgroundColor: Colors.accent},
                animatedStyle
            ]}
        />
    );
};

const AnimatedSlide = ({slide, index, scrollX, screenWidth}) => {
    const imageAnimatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth
        ];
        return {
            transform: [
                {
                    translateX: interpolate(
                        scrollX.value,
                        inputRange,
                        [40, 0, -40],
                        Extrapolation.CLAMP
                    )
                }
            ]
        };
    });

    const contentAnimatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth
        ];
        return {
            opacity: interpolate(
                scrollX.value,
                inputRange,
                [0, 1, 0],
                Extrapolation.CLAMP
            ),
            transform: [
                {
                    translateY: interpolate(
                        scrollX.value,
                        inputRange,
                        [20, 0, 20],
                        Extrapolation.CLAMP
                    )
                }
            ]
        };
    });

    return (
        <View style={[styles.slide, {width: screenWidth}]}>
            <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
                <Image
                    source={slide.image}
                    style={[
                        styles.slideImage,
                        {
                            width: screenWidth * 0.6,
                            height: screenWidth * 0.6
                        }
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>

            <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
                <Title
                    color="accent"
                    style={styles.slideTitle}
                    dictionary={slide.titleText}
                />
                <Body
                    color="muted"
                    style={styles.slideBody}
                    dictionary={slide.text}
                />
            </Animated.View>
        </View>
    );
};

const Slides = ({data, activeIndex, onScroll, showDots = true}) => {
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    const scrollX = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
            if (onScroll) {
                runOnJS(onScroll)({nativeEvent: event});
            }
        }
    });

    return (
        <View>
            <AnimatedScrollView
                horizontal
                pagingEnabled
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                bounces={false}>
                {data.map((slide, i) => (
                    <AnimatedSlide
                        key={slide.id}
                        slide={slide}
                        index={i}
                        scrollX={scrollX}
                        screenWidth={SCREEN_WIDTH}
                    />
                ))}
            </AnimatedScrollView>
            {showDots && (
                <View style={styles.dotContainer}>
                    {data.map((_, i) => (
                        <AnimatedDot
                            key={i}
                            index={i}
                            scrollX={scrollX}
                            screenWidth={SCREEN_WIDTH}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    slide: {
        alignItems: 'center',
        paddingHorizontal: 32
    },
    imageContainer: {
        marginBottom: 0
    },
    slideImage: {
        maxHeight: 260
    },
    textContainer: {
        alignItems: 'center'
    },
    slideTitle: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 4
    },
    slideBody: {
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 4,
        gap: 6
    },
    dot: {
        height: 8,
        borderRadius: 4
    }
});

export default Slides;
