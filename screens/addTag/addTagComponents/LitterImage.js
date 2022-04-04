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
    Easing
} from 'react-native';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import GestureRecognizer, {
    swipeDirections
} from 'react-native-swipe-gestures';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LitterImage extends PureComponent {
    // ScrollView Image Props

    constructor(props) {
        super(props);

        this.state = {
            imageLoaded: false
        };
    }

    _imageLoaded() {
        this.setState({ imageLoaded: true });
    }

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
                    this.props.toggleLitter();
                }}>
                <Pressable
                    onPress={() => {
                        this.props.toggleFn();
                    }}
                    style={{ backgroundColor: 'black' }}>
                    <Image
                        resizeMode="contain"
                        source={{ uri: this.props.photoSelected.uri }}
                        style={styles.image}
                        onLoad={this._imageLoaded.bind(this)}
                    />

                    <ActivityIndicator
                        style={styles.activityIndicator}
                        animating={!this.state.imageLoaded}
                    />
                </Pressable>
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
