import * as React from 'react';
import { Easing, Animated, View, StyleSheet } from 'react-native';
import { CountUp } from 'use-count-up';
import PropTypes from 'prop-types';
import Svg, { G, Circle } from 'react-native-svg';
import { Body, Caption } from './typography';
import { Colors } from './theme';

const AnimatedCircle = ({
    startPercentage = 0,
    percentage = 0,
    radius = 150,
    strokeWidth = 10,
    duration = 500,
    color = Colors.accent,
    delay = 0,
    textColor,
    value = 0,
    valueSuffix,
    valueStyles,
    max = 100,
    tagline,
    nextTarget,
    taglineStyles,
    isValueDisplayed = true
}) => {
    const animated = React.useRef(new Animated.Value(startPercentage)).current;
    const circleRef = React.useRef();
    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    // animation fn for svg circle
    const animation = toValue => {
        return Animated.timing(animated, {
            delay: delay,
            toValue,
            duration:
                toValue === 0 || toValue === startPercentage ? 0 : duration,
            useNativeDriver: true
            // easing: Easing.out(Easing.ease)
        }).start();
    };

    React.useEffect(() => {
        animation(percentage);

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
                // console.log(circleRef.current);
            },
            [max, percentage]
        );

        return () => {
            animated.removeAllListeners();
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
                        strokeDashoffset={startPercentage}
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
                    <Body
                        style={[
                            { color: textColor ?? color },
                            styles.value,
                            valueStyles
                        ]}>
                        <CountUp
                            suffix={valueSuffix && valueSuffix}
                            decimalPlaces={1}
                            isCounting={
                                startPercentage === percentage ? false : true
                            }
                            start={startPercentage}
                            end={percentage ? percentage : startPercentage}
                            duration={5}
                            shouldUseToLocaleString
                        />
                    </Body>

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
    startPercentage: PropTypes.number,
    percentage: PropTypes.number,
    radius: PropTypes.number,
    strokeWidth: PropTypes.number,
    duration: PropTypes.number,
    color: PropTypes.string,
    delay: PropTypes.number,
    textColor: PropTypes.string,
    value: PropTypes.number,
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
