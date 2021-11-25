import React, { Component } from 'react';
import { Pressable, StyleSheet, Animated, View, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
class TagsActionButton extends Component {
    state = {
        animation: new Animated.Value(0),
        diagonalAnimation: new Animated.Value(0),
        mainButtonAnimation: new Animated.Value(0),
        isClosed: true
        // rotationAnimation: new Animated.Value()
    };

    startAnimation = () => {
        Animated.timing(this.state.animation, {
            toValue: -150,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.mainButtonAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.diagonalAnimation, {
            toValue: -100,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(() => this.setState({ isClosed: false }));
    };

    returnAnimation = () => {
        Animated.timing(this.state.animation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.mainButtonAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.diagonalAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(() => this.setState({ isClosed: true }));
    };
    render() {
        const animatedStyle = {
            transform: [{ translateY: this.state.animation }]
        };
        const diagonalAnimatedStyle = {
            transform: [
                {
                    translateY: this.state.diagonalAnimation,
                    translateX: this.state.diagonalAnimation
                }
            ]
        };

        const animatedXStyle = {
            transform: [{ translateX: this.state.animation }]
        };

        const interpolate = this.state.mainButtonAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '-45deg']
        });

        const animatedMainButton = {
            // opacity: this.state.mainButtonAnimation,
            transform: [
                {
                    rotate: interpolate
                }
            ]
        };
        return (
            <View>
                <View style={[styles.container]}>
                    <Animated.View style={[styles.smallButton, animatedStyle]}>
                        <Icon
                            name="ios-trash-outline"
                            color={Colors.white}
                            size={28}
                        />
                    </Animated.View>
                    <Animated.View
                        style={[styles.smallButton, diagonalAnimatedStyle]}>
                        <Icon
                            name="ios-pricetags-outline"
                            color={Colors.white}
                            size={28}
                        />
                    </Animated.View>
                    <Animated.View style={[styles.smallButton, animatedXStyle]}>
                        <Icon
                            name="ios-cloud-upload-outline"
                            color={Colors.white}
                            size={28}
                        />
                    </Animated.View>

                    <AnimatedPressable
                        style={[styles.mainButton, animatedMainButton]}
                        onPress={() =>
                            this.state.isClosed
                                ? this.startAnimation()
                                : this.returnAnimation()
                        }>
                        <Icon name="ios-add" color={Colors.white} size={42} />
                    </AnimatedPressable>
                </View>
            </View>
        );
    }
}

export default TagsActionButton;

const styles = StyleSheet.create({
    container: {
        zIndex: 2,
        position: 'absolute',
        bottom: 50,
        right: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    mainButton: {
        backgroundColor: '#1976D2',
        width: 80,
        height: 80,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    smallButton: {
        backgroundColor: '#1976D2',
        width: 60,
        height: 60,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute'
    }
});
