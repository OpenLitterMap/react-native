import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ImageSourcePropType,
    Pressable,
    StyleSheet
} from 'react-native';
import * as actions from '../../../actions';
import {connect} from 'react-redux';
import GestureRecognizer from 'react-native-swipe-gestures';
import {PinchGestureHandler, State} from 'react-native-gesture-handler';
import {NavigationProp} from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LitterImageProps {
    photoSelected: {
        uri: string;
    };
    navigation: NavigationProp<any>;
    onLongPressStart: () => void;
    onLongPressEnd: () => void;
    category: string;
    item: string;
    items: string[];
    q: number;
    quantityChanged: boolean;
}

interface LitterImageState {
    imageLoaded: boolean;
    isLongPress: boolean;
}

class LitterImage extends PureComponent<LitterImageProps, LitterImageState> {
    scale: Animated.Value;
    focalX: Animated.Value;
    focalY: Animated.Value;
    onPinchGestureEvent: (...args: any[]) => void;

    constructor(props: LitterImageProps) {
        super(props);

        this.state = {
            imageLoaded: false,
            isLongPress: false
        };

        this.scale = new Animated.Value(1);
        this.focalX = new Animated.Value(0);
        this.focalY = new Animated.Value(0);
        this.onPinchGestureEvent = Animated.event(
            [
                {
                    nativeEvent: {
                        scale: this.scale,
                        focalX: this.focalX,
                        focalY: this.focalY
                    }
                }
            ],
            {useNativeDriver: true}
        );
    }

    _imageLoaded = () => {
        this.setState({imageLoaded: true});
    };

    onPinchHandlerStateChange = (event: any) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.spring(this.scale, {
                toValue: 1,
                useNativeDriver: true
            }).start();
        }
    };

    render() {
        const {photoSelected, onLongPressStart, onLongPressEnd, navigation} =
            this.props;

        return (
            <GestureRecognizer
                onSwipeDown={state => {
                    console.log('swipe down', state);
                    navigation.navigate('HOME');
                }}>
                <PinchGestureHandler
                    onGestureEvent={this.onPinchGestureEvent}
                    onHandlerStateChange={this.onPinchHandlerStateChange}>
                    <AnimatedPressable
                        onPress={() => {
                            this.setState({isLongPress: false});
                        }}
                        onLongPress={() => {
                            this.setState({isLongPress: true});
                            onLongPressStart();
                        }}
                        onPressOut={() => {
                            this.state.isLongPress && onLongPressEnd();
                        }}
                        style={{backgroundColor: 'black'}}>
                        <Animated.Image
                            resizeMode="contain"
                            source={
                                {uri: photoSelected.uri} as ImageSourcePropType
                            }
                            style={[
                                styles.image,
                                {
                                    transform: [{scale: this.scale}]
                                }
                            ]}
                            onLoad={this._imageLoaded}
                        />

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

const styles = StyleSheet.create({
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
});

const mapStateToProps = (state: any) => {
    return {
        category: state.litter.category,
        item: state.litter.item,
        items: state.litter.items,
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged
    };
};

export default connect(mapStateToProps, actions)(LitterImage);
