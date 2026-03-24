import * as React from 'react';
import {StyleSheet, TextStyle, View} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    useAnimatedReaction,
    withTiming,
    withDelay,
    runOnJS
} from 'react-native-reanimated';
import Svg, {Circle, G} from 'react-native-svg';
import {Body} from './typography';
import {Colors} from './theme';

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

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
    const animated = useSharedValue(startPercentage);
    const textAnimated = useSharedValue(startValue);
    const [displayText, setDisplayText] = React.useState(
        formatDisplayText(startValue, value, valueSuffix)
    );
    const circumference = 2 * Math.PI * radius;
    const halfCircle = radius + strokeWidth;

    // Derive strokeDashoffset from animated value via animatedProps
    const circleAnimatedProps = useAnimatedProps(() => {
        const clampedValue = Math.min(Math.max(animated.value, 0), max);
        const offset = circumference - (clampedValue / max) * circumference;
        return {
            strokeDashoffset: offset
        };
    });

    // Update display text reactively
    useAnimatedReaction(
        () => textAnimated.value,
        (currentValue) => {
            runOnJS(setDisplayText)(formatDisplayText(currentValue, value, valueSuffix));
        }
    );

    React.useEffect(() => {
        const circleTimingConfig = {
            duration: startPercentage === percentage ? 0 : duration
        };
        animated.value = delay > 0
            ? withDelay(delay, withTiming(percentage, circleTimingConfig))
            : withTiming(percentage, circleTimingConfig);

        const textTimingConfig = {
            duration: startValue === value ? 0 : duration
        };
        textAnimated.value = delay > 0
            ? withDelay(delay, withTiming(value, textTimingConfig))
            : withTiming(value, textTimingConfig);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [percentage, value, duration, delay, max]);

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
                    <AnimatedSvgCircle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        animatedProps={circleAnimatedProps}
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
                            {
                                color: textColor ?? color,
                                marginBottom: 10,
                                fontWeight: '600'
                            },
                            styles.value,
                            valueStyles
                        ]}>
                        {displayText}
                    </Body>

                    <Body
                        family="semiBold"
                        style={[
                            {color: textColor ?? color},
                            styles.tagline,
                            taglineStyles
                        ]}
                        dictionary={tagline}
                        values={{count: nextTarget}}>
                        {tagline}
                    </Body>
                </View>
            )}
        </View>
    );
};

function formatDisplayText(
    currentValue: number,
    targetValue: number,
    suffix?: string
): string {
    const s = suffix !== undefined ? `${suffix}` : '';
    return targetValue === Math.floor(targetValue)
        ? `${Math.floor(currentValue)}${s}`
        : `${currentValue.toFixed(1)}${s}`;
}

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
