import React, {useRef} from 'react';
import {Animated, Dimensions, Image, StyleSheet, View} from 'react-native';
import {Body, Colors, Title} from '../../components';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const Slides = ({data, activeIndex, onScroll, showDots = true}) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
        [{nativeEvent: {contentOffset: {x: scrollX}}}],
        {useNativeDriver: false, listener: onScroll}
    );

    const renderDots = () => {
        return data.map((_, i) => {
            const inputRange = [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH
            ];

            const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp'
            });

            const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp'
            });

            return (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            width: dotWidth,
                            opacity: dotOpacity,
                            backgroundColor: Colors.accent
                        }
                    ]}
                />
            );
        });
    };

    const renderSlides = () => {
        return data.map((slide, i) => {
            const inputRange = [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH
            ];

            const imageTranslateX = scrollX.interpolate({
                inputRange,
                outputRange: [40, 0, -40],
                extrapolate: 'clamp'
            });

            const contentOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0, 1, 0],
                extrapolate: 'clamp'
            });

            const contentTranslateY = scrollX.interpolate({
                inputRange,
                outputRange: [20, 0, 20],
                extrapolate: 'clamp'
            });

            return (
                <View key={slide.id} style={styles.slide}>
                    <Animated.View
                        style={[
                            styles.imageContainer,
                            {transform: [{translateX: imageTranslateX}]}
                        ]}>
                        <Image
                            source={slide.image}
                            style={styles.slideImage}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.textContainer,
                            {
                                opacity: contentOpacity,
                                transform: [{translateY: contentTranslateY}]
                            }
                        ]}>
                        <Title color="accent" style={styles.slideTitle}>
                            {slide.titleText}
                        </Title>
                        <Body
                            color="muted"
                            style={styles.slideBody}
                            dictionary={slide.text}
                        />
                    </Animated.View>
                </View>
            );
        });
    };

    return (
        <View>
            <Animated.ScrollView
                horizontal
                pagingEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                bounces={false}>
                {renderSlides()}
            </Animated.ScrollView>
            {showDots && <View style={styles.dotContainer}>{renderDots()}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    slide: {
        width: SCREEN_WIDTH,
        alignItems: 'center',
        paddingHorizontal: 32
    },
    imageContainer: {
        marginBottom: 0
    },
    slideImage: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
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
