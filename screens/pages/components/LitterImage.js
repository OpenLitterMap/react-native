import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    View
} from 'react-native';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LitterImage extends PureComponent
{
    // ScrollView Image Props
    static defaultProps = {
        doAnimateZoomReset: false,
        maximumZoomScale: 2,
        minimumZoomScale: 1,
        zoomHeight: SCREEN_HEIGHT,
        zoomWidth: SCREEN_WIDTH
    };

    constructor (props)
    {
        super(props);

        this.state = {
            imageLoaded: false
        }
    }

    // ScrollView Image - Reset Zoom
    handleResetZoomScale = event => {
        this.scrollResponderRef.scrollResponderZoomTo({
            x: 0,
            y: 0,
            width: this.props.zoomWidth,
            height: this.props.zoomHeight,
            animated: true
        });
    };

    // The ScrollView has a scrollResponder which allows us to access
    // more methods to control the ScrollView component
    setZoomRef = node => {
        if (node) {
            this.zoomRef = node;
            this.scrollResponderRef = this.zoomRef.getScrollResponder();
        }
    };

    /**
     * If web
     *   return filename
     *
     * Else
     *   return uri
     */
    _getFilenameOrUri ()
    {
        return this.props.photoSelected.type === 'web'
            ? this.props.photoSelected.filename
            : this.props.photoSelected.uri;
    }

    _imageLoaded ()
    {
        this.setState({ imageLoaded: true });
    }

    /**
     * Render the Image inside LitterPicker.Swiper
     *
     * This renders twice. Once when Swiper is created (imageLoaded false)
     *
     * and again when imageLoaded is true
     */
    render ()
    {
        console.log('LitterImage', this.props.photoSelected);
        return (
            <View>
                <ScrollView
                    contentContainerStyle={{
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    maximumZoomScale={this.props.maximumZoomScale}
                    minimumZoomScale={this.props.minimumZoomScale}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    ref={this.setZoomRef}
                    scrollEnabled={true}
                    style={{ overflow: 'hidden' }}
                >
                    <Image
                        resizeMode="cover"
                        source={{ uri: this._getFilenameOrUri() }}
                        style={styles.image}
                        onLoad={this._imageLoaded.bind(this)}
                    />

                    <ActivityIndicator
                        style={styles.activityIndicator}
                        animating={! this.state.imageLoaded}
                    />
                </ScrollView>
            </View>
        );
    }
}

const styles = {
    activityIndicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    box: {
        width: SCREEN_WIDTH,
        height: 500,
        position: 'absolute',
        zIndex: 99,
        top: SCREEN_HEIGHT * 0.15,
        color: 'black',
        borderWidth: 10
    },
    emptyContainer: {
        alignItems: 'center',
        backgroundColor: '#3498db',
        flex: 0.8,
        justifyContent: 'center',
        paddingLeft: SCREEN_WIDTH * 0.1,
        paddingRight: SCREEN_WIDTH * 0.1
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8
    }
}

export default connect(null, actions)(LitterImage);
