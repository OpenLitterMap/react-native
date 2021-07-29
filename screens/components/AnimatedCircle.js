import * as React from 'react';
import {
    Easing,
    TextInput,
    Animated,
    Text,
    View,
    StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import Svg, { G, Circle } from 'react-native-svg';
import { Body } from './typography';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedCircle = ({
    percentage = 0,
    radius = 150,
    strokeWidth = 10,
    duration = 500,
    color = '#396AFC',
    delay = 0,
    textColor = '#396AFC',
    value = 10,
    max = 100
}) => {
    const animated = React.useRef(new Animated.Value(0)).current;
    const textAnimated = React.useRef(new Animated.Value(0)).current;
    const circleRef = React.useRef();
    const inputRef = React.useRef();
    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    const animation = toValue => {
        return Animated.timing(animated, {
            delay: delay,
            toValue,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start();
    };

    const textAnimation = toValue => {
        return Animated.timing(textAnimated, {
            delay: delay,
            toValue,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start();
    };

    React.useEffect(() => {
        animation(percentage);
        textAnimation(value);

        textAnimated.addListener(
            v => {
                if (inputRef?.current) {
                    inputRef.current.setNativeProps({
                        text: `${Math.round(v.value)}`
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
                    style={[{ color: textColor ?? color }, styles.text]}
                />
                <Body color="accent" style={{ textAlign: 'center' }}>
                    Level
                </Body>
            </View>
        </View>
    );
};

AnimatedCircle.proptypes = {
    percentage: PropTypes.number,
    radius: PropTypes.number,
    strokeWidth: PropTypes.number,
    duration: PropTypes.number,
    color: PropTypes.string,
    delay: PropTypes.number,
    textColor: PropTypes.string,
    value: PropTypes.number
};

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
        fontSize: 62,
        fontFamily: 'Poppins-Medium',
        textAlignVertical: 'center'
    }
});

export default AnimatedCircle;
