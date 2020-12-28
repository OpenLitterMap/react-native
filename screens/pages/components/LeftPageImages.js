import React, { PureComponent } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { Icon } from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';

import { connect } from 'react-redux';
import * as actions from '../../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LeftPageImages extends PureComponent {

    /**
     * Toggle selected for each image
     * Note, session has nested item
     */
    sessionItemPressed (index)
    {
        // console.log('Session item pressed', index);
        // If Select Button is pressed, select images to delete
        if (this.props.isSelecting)
        {
            if (this.props.photos[index].selected)
            {
                this.props.sessionIndexRemoveForDelete(index);
                this.props.decrementSelected();
            } else {
                this.props.sessionIndexSelectedForDelete(index);
                this.props.incrementSelected();
            }
        } else {
            // shared_reducer
            this.props.toggleLitter();
            // litter_reducer
            let item = this.props.photos[index];
            item.index = index;
            this.props.itemSelected(this.props.photos[index]);
        }
    }

    /**
     * Render gallery item
     * photos selected from the users device
     */
    renderGalleryItem = item => {

        let width = null;
        let mgn = 0;

        if (item.index % 3 === 1)
        {
            width = SCREEN_WIDTH / 3.1;
            mgn = 2;
        }

        else
        {
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback onPress={this.galleryItemPressed.bind(this, item)}>
                <View>
                    <Image
                        style={{
                            height: 135,
                            width: width,
                            marginLeft: mgn,
                            marginRight: mgn
                        }}
                        source={{ uri: item.item.image.uri }}
                        resizeMode="cover"
                    />
                    {item.item.selected && (
                        <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                            <Icon name="check-circle" size={SCREEN_HEIGHT * 0.03} color="#00aced" />
                        </View>
                    )}
                    {item.item.litter && (
                        <View style={{ position: 'absolute', left: 5, bottom: 0 }}>
                            <Icon name="attachment" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    /**
     * A Gallery Item has been pressed
     */
    galleryItemPressed (item)
    {
        // console.log('Gallery item pressed', item.item);

        if (item.item.hasOwnProperty('litter')) {
            console.log(item.item.litter);
        }

        // If we are selecting (for delete), highlight / deselect the image
        if (this.props.isSelecting)
        {
            if (item.item.selected)
            {
                // remove ['selected'] from the item
                this.props.galleryIndexRemoveForDelete(item.index);
                this.props.decrementSelected();
            } else {
                // add ['selected'] to the item
                this.props.galleryIndexSelectedForDelete(item.index);
                this.props.incrementSelected();
            }
        } else {
            // Select the image for tagging

            // shared_reducer -> Open LitterPicker (modal)
            this.props.toggleLitter();

            let litter = {};
            if (item.item.litter) litter = Object.assign({}, item.item.litter);

            // litter_reducer
            this.props.itemSelected({
                index: item.index,
                lat: item.item.location.latitude,
                lon: item.item.location.longitude,
                uri: item.item.image.uri,
                filename: item.item.image.filename,
                timestamp: item.item.timestamp,
                type: 'gallery',
                litter // data if exists
            });
        }
    }

    /**
     * todo - fix this ?
     */
    renderSeparator = () => {
        return (
            <View
                style={{
                    height: 2,
                    width: '100%'
                }}
            />
        );
    };

    /**
     * Render session item
     * photos taken by the camera this session
     */
    renderSessionItem = ({item, index}) => {
        // console.log('Render session item', item, index);

        let width = null;
        let mgn = 0;

        if (item.index % 3 == 1) {
            width = SCREEN_WIDTH / 3.1;
            mgn = SCREEN_WIDTH * 0.005;
        } else { // 0, 2
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback
                onPress={this.sessionItemPressed.bind(this, index)}
            >
                <View>
                    <Image
                        style={{
                            height: 135,
                            width: width,
                            marginLeft: mgn,
                            marginRight: mgn,
                            paddingBottom: SCREEN_HEIGHT * 0.01
                        }}
                        source={{ uri: item.uri }}
                        resizeMode="cover"
                    />
                    {item.selected && (
                        <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                            <Icon name="check-circle" size={SCREEN_HEIGHT * 0.03} color="#00aced" />
                        </View>
                    )}
                    {item.litter && (
                        <View style={{ position: 'absolute', left: 5, bottom: 0 }}>
                            <Icon name="attachment" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    _marginWhenPhotos () {
        if (this.props.photos.length > 0) {
            return styles.smallTopMargin;
        }
    }

    /**
     * One of the images uploaded to web-app has been clicked
     */
    _webImagePressed ()
    {
        console.log('_webImagePressed', this.props.webImages[0]);

        if (! this.props.isSelecting) {
            this.props.toggleLitter();
            // litter_reducer
            let item = this.props.webImages[0];
            item.uri = this.props.webImages[0].filename;
            item.type = 'web';
            // shared_actions
            this.props.itemSelected(this.props.webImages[0]);
        }
    }

    /**
     * Style of webText tag
     */
    _webTextStyle ()
    {
        if (Platform.OS === 'android') return styles.webTextSmall;

        // if "iPhone 10+", return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.webText;

        if (x === "8")
        {
            return styles.webTextiPhone8;
        }

        return styles.webTextSmall;
    }

    render ()
    {
        // console.log("LeftPageImages rendered (session) (gallery)", this.props.photos.length, this.props.gallery.length);

        if (this.props.photos.length === 0 && this.props.gallery.length === 0 && this.props.webImages.length === 0)
        {
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 0.75 }}>
                    <Text style={{ fontSize: SCREEN_HEIGHT * 0.02 }}>Take or Select some photos to get started!</Text>
                </View>
            );
        }

        // Web photos have been uploaded to the web-app
        // Photos are taken this session
        // Gallery from albums
        return (
            <View style={this._marginWhenPhotos()}>

                {this.props.webImages.length > 0 && (
                    <View style={styles.webImageContainer}>
                        <TouchableWithoutFeedback
                            onPress={this._webImagePressed.bind(this)}
                        >
                            <Image source={{
                                uri: this.props.webImages[0].filename
                            }}
                                   style={styles.webImage}
                            />
                        </TouchableWithoutFeedback>
                        <View style={styles.webTextContainer}>
                            <View style={styles.webInnerContainer}>
                                <Icon name="cloud" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                                <Text style={this._webTextStyle()}>{this.props.webImages.length}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {this.props.photos && (
                    <FlatList
                        data={this.props.photos}
                        extraData={this.props.uniqueValue}
                        keyExtractor={(item, index) => item + index}
                        numColumns={3}
                        renderItem={this.renderSessionItem}
                        ItemSeparatorComponent={this.renderSeparator}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                { /* Empty space between session & gallery photos */}
                <View style={{ height: SCREEN_HEIGHT * 0.003 }} />

                {this.props.gallery && (
                    <FlatList
                        data={this.props.gallery}
                        extraData={this.props.uniqueValue}
                        keyExtractor={(item, index) => item + index}
                        numColumns={3}
                        renderItem={this.renderGalleryItem}
                        ItemSeparatorComponent={this.renderSeparator}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        );
    }
}

const styles = {
    galleryHeader: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#95a5a6',
    },
    imageContainer: {
        marginBottom: 100,
        paddingLeft: SCREEN_WIDTH * 0.01,
        paddingRight: SCREEN_WIDTH * 0.01,
        paddingTop: SCREEN_WIDTH * 0.01
    },
    smallTopMargin: {
        marginTop: SCREEN_HEIGHT * 0.003
    },
    webImage: {
        width: SCREEN_WIDTH / 3,
        height: 135,
    },
    webImageContainer: {
        position: 'relative',
        // backgroundColor: 'white'
    },
    webTextContainer: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.01,
        right: SCREEN_WIDTH * 0.7,
        height: SCREEN_HEIGHT * 0.03,
        width: SCREEN_HEIGHT * 0.03,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'white'
    },
    webInnerContainer: {
        position: 'relative',
        height: SCREEN_HEIGHT * 0.035,
        width: SCREEN_HEIGHT * 0.05,
        // backgroundColor: 'red'
    },
    webText: {
        fontWeight: '500',
        left: 0,
        // fontSize: SCREEN_HEIGHT * 0.02,
        bottom: SCREEN_HEIGHT * 0.024,
        // bottom: SCREEN_HEIGHT * 0.0325,
        alignSelf: 'center'
    },
    webTextiPhone8: {
        fontWeight: '500',
        left: 0,
        fontSize: SCREEN_HEIGHT * 0.02,
        bottom: SCREEN_HEIGHT * 0.0265,
        alignSelf: 'center'
    },
    webTextSmall: {
        fontWeight: '500',
        left: 0,
        fontSize: SCREEN_HEIGHT * 0.02,
        bottom: SCREEN_HEIGHT * 0.0325,
        alignSelf: 'center'
    },
    webLogoContainer: {
        position: 'absolute',
        left: SCREEN_WIDTH * 0.03,
        bottom: SCREEN_HEIGHT * 0.01,
    }
}

export default connect(null, actions)(LeftPageImages);
