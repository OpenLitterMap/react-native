import React, { PureComponent } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { TransText } from "react-native-translation";

import { Icon } from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';

import { connect } from 'react-redux';
import * as actions from '../../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LeftPageImages extends PureComponent
{
    /**
     * Camera photo data
     *
     * - id
     * - date
     * - filename
     * - lat
     * - lon
     * - presence
     * - selected
     * - tags
     * - type
     * - url
     */

    /**
     * Gallery photo data
     *
     * id
     * filename
     * height
     * width
     * uri
     * lat
     * lon
     * pickedup
     * selected
     * tags
     * timestamp
     * type
     */

    /**
     * A photo taken from the Camera was pressed
     *
     * if this.props.isSelected is true, we want to select photos to delete
     *
     * otherwise, select an image for tagging
     */
    cameraPhotoPressed (index)
    {
        console.log('cameraPhotoPressed', index);

        const image = this.props.photos[index];

        if (this.props.isSelecting)
        {
            (image.selected)
                ? this.props.decrementSelected()
                : this.props.incrementSelected();

            this.props.toggleSelectedPhoto(index);
        }
        else
        {
            // shared_reducer - Open LitterPicker modal
            this.props.toggleLitter();

            // litter_reducer
            this.props.photoSelectedForTagging({
                swiperIndex: index,
                type: 'camera',
                image
            });
        }
    }

    /**
     * A Gallery Item has been pressed
     *
     * if this.props.isSelected is true, we want to select photos to delete
     *
     * otherwise, select an image for tagging
     */
    galleryPhotoPressed (index)
    {
        console.log('galleryPhotoPressed', index);

        const image = this.props.gallery[index];

        if (this.props.isSelecting)
        {
            (image.selected)
                ? this.props.decrementSelected()
                : this.props.incrementSelected();

            this.props.toggleSelectedGallery(index);
        }
        else
        {
            // shared_reducer - Open LitterPicker modal
            this.props.toggleLitter();

            // litter_reducer
            // When setting swiperIndex, we need to increment the gallery index by photos.length,
            // as camera_photos appear first, followed by gallery_photos, followed by web_photos.
            this.props.photoSelectedForTagging({
                swiperIndex: this.props.photos.length + index,
                type: 'gallery',
                image
            });
        }
    }

    /**
     * Render photos taken with the OLM camera
     */
    renderCameraPhoto = ({item, index}) => {
        // console.log('renderCameraPhoto', item, index);

        let width;
        let mgn = 0;

        // middle image
        if (index % 3 === 1)
        {
            width = SCREEN_WIDTH / 3.1;
            mgn = SCREEN_WIDTH * 0.005;
        }
        else // left & right images
        {
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback
                onPress={this.cameraPhotoPressed.bind(this, index)}
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
                    {
                        item.selected && (
                            <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                                <Icon name="check-circle" size={SCREEN_HEIGHT * 0.03} color="#00aced" />
                            </View>
                        )
                    }
                    {
                        item.tags && (
                            <View style={{ position: 'absolute', left: 5, bottom: 0 }}>
                                <Icon name="attachment" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                            </View>
                        )
                    }
                </View>
            </TouchableWithoutFeedback>
        );
    };

    /**
     * Render photos selected from the users geotagged album
     */
    renderGalleryPhoto = ({item, index}) => {
        // console.log('renderGalleryPhoto', item);

        let width;
        let mgn = 0;

        // middle image
        if (index % 3 === 1)
        {
            width = SCREEN_WIDTH / 3.1;
            mgn = 2;
        }
        // left & right image
        else
        {
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback onPress={this.galleryPhotoPressed.bind(this, index)}>
                <View>
                    <Image
                        style={{
                            height: 135,
                            width: width,
                            marginLeft: mgn,
                            marginRight: mgn
                        }}
                        source={{ uri: item.uri }}
                        resizeMode="cover"
                    />

                    {
                        item.selected && (
                            <View style={{ position: 'absolute', right: 5, bottom: 5 }}>
                                <Icon name="check-circle" size={SCREEN_HEIGHT * 0.03} color="#00aced" />
                            </View>
                        )
                    }

                    {
                        item.tags && (
                            <View style={{ position: 'absolute', left: 5, bottom: 0 }}>
                                <Icon name="attachment" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                            </View>
                        )
                    }
                </View>
            </TouchableWithoutFeedback>
        );
    };

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

    _marginWhenPhotos ()
    {
        if (this.props.photos.length > 0)
        {
            return styles.smallTopMargin;
        }
    }

    /**
     * Load the next image due to tag from Web
     *
     * Web uploads were uploaded from the web-app and need to be tagged here
     */
    _webImagePressed ()
    {
        if (! this.props.isSelecting)
        {
            // shared.js
            this.props.toggleLitter();

            // litter.js
            let image = this.props.webPhotos[0];
            // todo - load this litter object by default
            // todo - change this name to tags
            image.tags = {};

            this.props.itemSelected(image);

        }
    }

    /**
     * Style of webText tag
     */
    _webTextStyle ()
    {
        if (Platform.OS === 'android') return styles.webTextSmall;

        // if "iPhone 10+", return 17% card height
        const x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.webText;

        if (x === "8" || x === "SE")
        {
            return styles.webTextiPhone8;
        }

        return styles.webTextSmall;
    }

    /**
     * Render the Images that appear on the LeftPage
     *
     * Top: Web
     * - Web images were uploaded to openlittermap.com./upload and can be tagged from the app
     *
     * Middle: Gallery
     * - Gallery are selected from the geotagged photos album here on the app
     *
     * Bottom: Camera
     * - Camera photos are taken with the camera in the app
     *
     * @returns {JSX.Element}
     */
    render ()
    {
        // console.log('LeftPageImages.render');

        if (this.props.photos.length === 0 && this.props.gallery.length === 0 && this.props.webImagesCount === 0)
        {
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 0.75 }}>
                    <TransText
                        style={{ fontSize: SCREEN_HEIGHT * 0.02 }}
                        dictionary={`${this.props.lang}.leftpage.get-started`}
                    />
                </View>
            );
        }

        // Web photos have been uploaded to the web-app
        // Photos are taken this camera
        // Gallery from albums
        return (

            <View style={this._marginWhenPhotos()}>
                {
                    this.props.webImagesCount > 0 &&
                    (
                        <View style={styles.webImageContainer}>

                            <TouchableWithoutFeedback onPress={this._webImagePressed.bind(this)}>
                                <Image source={{ uri: this.props.webPhotos[0].filename }} style={styles.webImage} />
                            </TouchableWithoutFeedback>

                            <View style={styles.webTextContainer}>
                                <View style={styles.webInnerContainer}>
                                    <Icon name="cloud" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                                    <Text style={this._webTextStyle()}>{this.props.webImagesCount}</Text>
                                </View>
                            </View>
                        </View>
                    )
                }

                {
                    this.props.photos && (
                        <FlatList
                            data={this.props.photos}
                            extraData={this.props.uniqueValue}
                            keyExtractor={(item, index) => item + index}
                            numColumns={3}
                            renderItem={this.renderCameraPhoto}
                            ItemSeparatorComponent={this.renderSeparator}
                            keyboardShouldPersistTaps="handled"
                        />
                    )
                }

                { /* Empty space between camera & gallery photos */}
                <View style={{ height: SCREEN_HEIGHT * 0.003 }} />

                {
                    this.props.gallery && (
                        <FlatList
                            data={this.props.gallery}
                            extraData={this.props.uniqueValue}
                            keyExtractor={(item, index) => item + index}
                            numColumns={3}
                            renderItem={this.renderGalleryPhoto}
                            ItemSeparatorComponent={this.renderSeparator}
                            keyboardShouldPersistTaps="handled"
                        />
                    )
                }
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
        bottom: SCREEN_HEIGHT * 0.025,
        alignSelf: 'center'
    },
    webLogoContainer: {
        position: 'absolute',
        left: SCREEN_WIDTH * 0.03,
        bottom: SCREEN_HEIGHT * 0.01,
    }
}

export default connect(null, actions)(LeftPageImages);
