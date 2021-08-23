import * as React from 'react';
import { Easing, TextInput, Animated, View, StyleSheet } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const AnimatedText = () => {
    const delay = 500;
    const value = 10000;
    const duration = 1000;
    const textAnimated = React.useRef(new Animated.Value(0)).current;
    const inputRef = React.useRef();

    const textAnimation = toValue => {
        return Animated.timing(textAnimated, {
            delay: delay,
            toValue,
            duration,
            useNativeDriver: true
            // easing: Easing.out(Easing.ease)
        }).start();
    };

    React.useEffect(() => {
        textAnimation(value);

        textAnimated.addListener(
            v => {
                if (inputRef?.current) {
                    // if value(props) is decimal then return value with decimal
                    // else return v.value without decimal
                    // decimal used for stats page

                    const text =
                        value === Math.floor(value)
                            ? `${Math.floor(v.value)}`
                            : `${v.value.toFixed(1)}`;

                    inputRef.current.setNativeProps({
                        text
                    });
                }
            },
            [value]
        );

        return () => {
            textAnimated.removeAllListeners();
        };
    });

    return (
        <AnimatedTextInput
            ref={inputRef}
            underlineColorAndroid="transparent"
            editable={false}
            defaultValue="0"
            style={{ fontSize: 20, color: 'red' }}
        />
    );
};

export default AnimatedText;
