import * as React from 'react';
import { Animated, StyleSheet, TextInput, TextStyle, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Body } from './typography';
import { Colors } from './theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCircleProps {
    percentage?: number;
    startPercentage?: number;
    radius?: number;
    strokeWidth?: number;
    duration?: number;
    color?: string;
    delay?: number;
    textColor?: string;
    value?: number;
    startValue?: number;
    valueSuffix?: string;
    valueStyles?: TextStyle | TextStyle[];
    max?: number;
    tagline?: string;
    taglineStyles?: TextStyle | TextStyle[];
    nextTarget?: string;
    isValueDisplayed?: boolean;
}

const AnimatedCircle: React.FC<AnimatedCircleProps> = ({
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
    const animated = React.useRef(new Animated.Value(startPercentage)).current;
    const textAnimated = React.useRef(new Animated.Value(startValue)).current;
    const circleRef = React.useRef<any>();
    const inputRef = React.useRef<any>();
    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    React.useEffect(() => {
        // Register listeners before starting animations
        const circleListener = animated.addListener(v => {
            const maxPercent = (100 * v.value) / max;
            const strokeDashoffset =
                circumference - (circumference * maxPercent) / 100;

            if (circleRef?.current) {
                circleRef.current.setNativeProps({
                    strokeDashoffset
                });
            }
        });

        const textListener = textAnimated.addListener(v => {
            if (inputRef?.current) {
                const suffix = valueSuffix !== undefined ? `${valueSuffix}` : '';
                const text =
                    value === Math.floor(value)
                        ? `${Math.floor(v.value)}${suffix}`
                        : `${v.value.toFixed(1)}${suffix}`;

                inputRef.current.setNativeProps({ text });
            }
        });

        // Start animations after listeners are attached
        Animated.timing(animated, {
            delay,
            toValue: percentage,
            duration: startPercentage === percentage ? 0 : duration,
            useNativeDriver: true
        }).start();

        Animated.timing(textAnimated, {
            delay,
            toValue: value,
            duration: startValue === value ? 0 : duration,
            useNativeDriver: true
        }).start();

        return () => {
            animated.removeListener(circleListener);
            textAnimated.removeListener(textListener);
        };
    }, [percentage, value, duration, delay, max]);

    return (
        <View
            style={{
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Svg
                height={radius * 2}
                width={radius * 2}
                viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}
            >
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
                            {
                                color: textColor ?? color,
                                marginBottom: 10,
                                fontWeight: '600'
                            },
                            styles.value,
                            valueStyles
                        ]}
                    />

                    <Body
                        family="semiBold"
                        style={[
                            {color: textColor ?? color},
                            styles.tagline,
                            taglineStyles
                        ]}
                        dictionary={tagline}
                        values={{ count: nextTarget }}
                    >
                        {tagline}
                    </Body>
                </View>
            )}
        </View>
    );
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
