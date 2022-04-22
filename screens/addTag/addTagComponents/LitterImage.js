import React, { PureComponent, createRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Keyboard,
    ScrollView,
    Pressable,
    Text,
    View,
    Animated,
    Easing,
    StyleSheet
} from 'react-native';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import GestureRecognizer, {
    swipeDirections
} from 'react-native-swipe-gestures';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
class LitterImage extends PureComponent {
    // ScrollView Image Props
    scale = new Animated.Value(1);
    focalX = new Animated.Value(0);
    focalY = new Animated.Value(0);

    constructor(props) {
        super(props);

        this.state = {
            imageLoaded: false
        };
    }

    _imageLoaded() {
        this.setState({ imageLoaded: true });
    }

    onPinchGestureEvent = Animated.event(
        [
            {
                nativeEvent: {
                    scale: this.scale,
                    focalX: this.focalX,
                    focalY: this.focalY
                }
            }
            // { nativeEvent: { contentOffset: { x: this.x } } }
        ],
        { useNativeDriver: true }
    );

    onPinchHandlerStateChange = event => {
        // console.log(event.nativeEvent);
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.spring(this.scale, {
                toValue: 1,
                useNativeDriver: true
            }).start();
        }
    };

    /**
     * Render the Image inside LitterPicker.Swiper
     *
     * This renders twice. Once when Swiper is created (imageLoaded false)
     *
     * and again when imageLoaded is true
     */
    render() {
        return (
            <GestureRecognizer
                onSwipeDown={state => {
                    this.props.navigation.navigate('HOME');
                }}>
                <PinchGestureHandler
                    onGestureEvent={this.onPinchGestureEvent}
                    onHandlerStateChange={this.onPinchHandlerStateChange}>
                    <AnimatedPressable
                        onPress={() => {
                            this.props.toggleFn();
                        }}
                        style={{ backgroundColor: 'black' }}>
                        <Animated.Image
                            resizeMode="contain"
                            source={{ uri: this.props.photoSelected.uri }}
                            style={[
                                styles.image,
                                {
                                    transform: [
                                        // {
                                        //     translateX: this.focalX
                                        // },
                                        // {
                                        //     translateY: this.focalY
                                        // },
                                        // { translateX: SCREEN_WIDTH / 2 },
                                        // { translateY: SCREEN_HEIGHT / 2 },
                                        { scale: this.scale }
                                    ]
                                }
                            ]}
                            onLoad={this._imageLoaded.bind(this)}
                        />
                        {/* <Animated.View
                        style={[
                            {
                                ...StyleSheet.absoluteFill,
                                width: 20,
                                height: 20,
                                backgroundColor: 'red',
                                borderRadius: 100,
                                transform: [
                                    {
                                        translateX: this.focalX
                                    },
                                    {
                                        translateY: this.focalY
                                    }
                                ]
                            }
                        ]}
                    /> */}

                        <ActivityIndicator
                            style={styles.activityIndicator}
                            animating={!this.state.imageLoaded}
                        />
                    </AnimatedPressable>
                </PinchGestureHandler>
            </GestureRecognizer>
        );
    }
}

const styles = {
    activityIndicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    }
};

const mapStateToProps = state => {
    return {
        category: state.litter.category,
        item: state.litter.item,
        items: state.litter.items,
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterImage);
