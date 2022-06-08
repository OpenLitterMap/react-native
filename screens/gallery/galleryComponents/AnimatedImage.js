import {
    View,
    Pressable,
    Animated,
    Dimensions,
    Easing,
    StyleSheet
} from 'react-native';
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../components';

const { width } = Dimensions.get('window');

class AnimatedImage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            borderRadiusAnimation: new Animated.Value(0),
            sizeAnimation: new Animated.Value(1)
        };
    }

    /**
     * animate borderRadius to 20
     * animate scale to 80% / 0.8
     */
    selectImageAnimation() {
        Animated.timing(this.state.borderRadiusAnimation, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
        Animated.timing(this.state.sizeAnimation, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true
        }).start();
    }
    unselectImageAnimation() {
        Animated.timing(this.state.borderRadiusAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
        Animated.timing(this.state.sizeAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    }

    /**
     * only press image if its geoTagged
     *
     * run animation and call fn this.props.onPress() which will mark the image as selected
     */
    onImagePress = () => {
        if (this.props.isImageGeotagged) {
            this.props.selected
                ? this.unselectImageAnimation()
                : this.selectImageAnimation();
            this.props.onPress();
        }
    };

    render() {
        const { image, isImageGeotagged, selected } = this.props;
        return (
            <Pressable key={image.uri} onPress={this.onImagePress}>
                <View
                    style={{
                        width: width / 3 - 2,
                        height: width / 3 - 2,
                        margin: 1,
                        backgroundColor: Colors.accentLight
                    }}>
                    <Animated.Image
                        source={{ uri: image.uri }}
                        style={[
                            {
                                width: '100%',
                                height: '100%',
                                borderRadius: this.state.borderRadiusAnimation,
                                transform: [
                                    {
                                        scale: this.state.sizeAnimation
                                    }
                                ]
                            }
                        ]}
                    />
                </View>

                {selected && (
                    <View
                        style={[
                            styles.selectedIcon,
                            selected && styles.iconBorderStyle
                        ]}>
                        <Icon
                            name="ios-checkmark-outline"
                            size={20}
                            color="white"
                        />
                    </View>
                )}
                {isImageGeotagged && (
                    <View
                        style={[
                            styles.geotaggedIcon,
                            selected && styles.iconBorderStyle
                        ]}>
                        <Icon
                            name="ios-location-outline"
                            size={16}
                            color="white"
                        />
                    </View>
                )}
            </Pressable>
        );
    }
}

export default AnimatedImage;

const styles = StyleSheet.create({
    geotaggedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#0984e3',
        right: 5,
        top: 5,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectedIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: '#0984e3',
        left: 5,
        top: 5,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconBorderStyle: {
        borderWidth: 1,
        borderColor: Colors.accentLight
    }
});
