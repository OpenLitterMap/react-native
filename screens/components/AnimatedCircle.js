import * as React from 'react';
import { Easing, TextInput, Animated, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Svg, { G, Circle } from 'react-native-svg';
import { Body, Caption } from './typography';
import { Colors } from './theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedCircle = ({
    percentage = 0,
    startPercentage = 0,
    radius = 150,
    strokeWidth = 10,
    duration = 500,
    color = Colors.accent,
    delay = 0,
    textColor,
    value = 0,
    startValue = 0,
    valueSuffix,
    valueStyles,
    max = 100,
    tagline,
    nextTarget,
    taglineStyles,
    isValueDisplayed = true
}) => {
    // console.log({ startPercentage });
    const animated = React.useRef(new Animated.Value(startPercentage)).current;
    const textAnimated = React.useRef(new Animated.Value(startValue)).current;
    const circleRef = React.useRef();
    const inputRef = React.useRef();
    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    // animation fn for svg circle
    const animation = toValue => {
        return Animated.timing(animated, {
            delay: delay,
            toValue,
            duration: startPercentage === percentage ? 0 : duration,
            useNativeDriver: true
            // easing: Easing.out(Easing.ease)
        }).start();
    };
    // animation fn for text value
    const textAnimation = toValue => {
        return Animated.timing(textAnimated, {
            delay: delay,
            toValue,
            duration: startValue === value ? 0 : duration,
            useNativeDriver: true
            // easing: Easing.out(Easing.ease)
        }).start();
    };

    React.useEffect(() => {
        animation(percentage);
        textAnimation(value);

        textAnimated.addListener(
            v => {
                if (inputRef?.current) {
                    const suffix =
                        valueSuffix !== undefined ? `${valueSuffix}` : '';
                    // if value(props) is decimal then return value with decimal
                    // else return v.value without decimal
                    // decimal used for stats page

                    const text =
                        value === Math.floor(value)
                            ? `${Math.floor(v.value)}${suffix}`
                            : `${v.value.toFixed(1)}${suffix}`;

                    inputRef.current.setNativeProps({
                        text
                    });
                }
            },
            [value]
        );

        animated.addListener(
            v => {
                const maxPerc = (100 * v.value) / max;
                const strokeDashoffset =
                    circumference - (circumference * maxPerc) / 100;

                // console.log(strokeDashoffset);
                if (circleRef?.current) {
                    circleRef.current.setNativeProps({
                        strokeDashoffset
                    });
                }
            },
            [max, percentage]
        );

        return () => {
            animated.removeAllListeners();
            textAnimated.removeAllListeners();
        };
    });

    return (
        <View
            style={{
                justifyContent: 'center',
                alignItems: 'center'
            }}>
            <Svg
                height={radius * 2}
                width={radius * 2}
                viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
                <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
                    <Circle
                        ref={circleRef}
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDashoffset={circumference}
                        strokeDasharray={circumference}
                    />
                    <Circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                        strokeOpacity=".1"
                    />
                </G>
            </Svg>
            {isValueDisplayed && (
                <View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            alignItems: 'center',
                            justifyContent: 'center'
                        }
                    ]}>
                    <AnimatedTextInput
                        ref={inputRef}
                        underlineColorAndroid="transparent"
                        editable={false}
                        defaultValue="0"
                        style={[
                            { color: textColor ?? color },
                            styles.value,
                            valueStyles
                        ]}
                    />

                    <Body
                        family="semiBold"
                        style={[
                            { color: textColor ?? color },
                            styles.tagline,
                            taglineStyles
                        ]}
                        dictionary={tagline}
                        values={{ count: nextTarget }}>
                        {tagline}
                    </Body>
                </View>
            )}
        </View>
    );
};

AnimatedCircle.proptypes = {
    percentage: PropTypes.number,
    startPercentage: PropTypes.number,
    radius: PropTypes.number,
    strokeWidth: PropTypes.number,
    duration: PropTypes.number,
    color: PropTypes.string,
    delay: PropTypes.number,
    textColor: PropTypes.string,
    value: PropTypes.number,
    startValue: PropTypes.number,
    valueSuffix: PropTypes.string,
    valueStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    tagline: PropTypes.string,
    taglineStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    nextTarget: PropTypes.string,
    isValueDisplayed: PropTypes.bool
};

const styles = StyleSheet.create({
    value: {
        textAlign: 'center',
        fontSize: 62,
        fontFamily: 'Poppins-Medium',
        textAlignVertical: 'center'
    },
    tagline: {
        textAlign: 'center',
        marginTop: -16
    }
});

export default AnimatedCircle;
