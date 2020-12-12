import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions, FlatList,
    Image,
    ScrollView,
    Text,
    View
} from 'react-native';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LitterImage extends PureComponent {

    // ScrollView Image Props
    static defaultProps = {
        doAnimateZoomReset: false,
        maximumZoomScale: 2,
        minimumZoomScale: 1,
        zoomHeight: SCREEN_HEIGHT,
        zoomWidth: SCREEN_WIDTH
    };

    constructor (props) {
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

    _imageLoaded ()
    {
        this.setState({ imageLoaded: true });
    }

    render ()
    {
        console.log('LitterImage.render');
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
                        source={{ uri: this.props.photoSelected.uri }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }}
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
    emptyContainer: {
        alignItems: 'center',
        backgroundColor: '#3498db',
        flex: 0.8,
        justifyContent: 'center',
        paddingLeft: SCREEN_WIDTH * 0.1,
        paddingRight: SCREEN_WIDTH * 0.1
    }
}

export default connect(null, actions)(LitterImage);
