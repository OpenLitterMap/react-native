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

import { Icon } from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';

import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Body, SubTitle } from '../../components';
import { isGeotagged } from '../../../utils/isGeotagged';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

class UploadImagesGrid extends PureComponent {
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
     * - id
     * - filename
     * - height
     * - width
     * - uri
     * - lat
     * - lon
     * - pickedup
     * - selected
     * - tags
     * - timestamp
     * - type
     */

    /**
     * Web photo data
     *
     * todo
     */

    /**
     * A photo uploaded to web needs to be tagged
     *
     * Can only be pressed when the user is not selecting images to delete
     *
     * Load the first web image
     */
    _webImagePressed() {
        if (!this.props.isSelecting) {
            // shared.js
            this.props.toggleLitter();

            // get the index of web_photos[0];
            // The order of the photos is camera_photos -> gallery_photos -> web_photos
            const globalIndex =
                this.props.photos.length + this.props.gallery.length;

            // litter.js
            this.props.swiperIndexChanged(globalIndex);
        } else {
            console.log('PRESSED');
        }
    }

    /**
     * A photo taken by the Camera was pressed
     *
     * if this.props.isSelected is true, we want to select photos to delete
     *
     * otherwise, open an image for tagging
     */
    cameraPhotoPressed(index) {
        const image = this.props.photos[index];

        if (this.props.isSelecting) {
            image.selected
                ? this.props.decrementSelected()
                : this.props.incrementSelected();

            this.props.toggleSelectedPhoto(index);
        } else {
            // shared_reducer - Open LitterPicker modal
            this.props.toggleLitter();

            // litter.js
            this.props.swiperIndexChanged(index);
        }
    }

    /**
     * A Gallery Item has been pressed
     *
     * if this.props.isSelected is true, we want to select photos to delete
     *
     * otherwise, select an image for tagging
     */
    galleryPhotoPressed(index) {
        const image = this.props.gallery[index];

        if (this.props.isSelecting) {
            image.selected
                ? this.props.decrementSelected()
                : this.props.incrementSelected();

            this.props.toggleSelectedGallery(index);
        } else {
            // shared_reducer - Open LitterPicker modal
            this.props.toggleLitter();

            const globalIndex = this.props.photos.length + index;

            // litter.js
            this.props.swiperIndexChanged(globalIndex);
        }
    }

    /**
     * Render photos taken with the OLM camera
     */
    renderCameraPhoto = ({ item, index }) => {
        const itemIsGeotagged = isGeotagged(item);

        let width;
        let mgn = 0;

        // middle image
        if (index % 3 === 1) {
            width = SCREEN_WIDTH / 3.1;
            mgn = SCREEN_WIDTH * 0.005;
        } // left & right images
        else {
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback
                onPress={this.cameraPhotoPressed.bind(this, index)}>
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
                        <View
                            style={{
                                position: 'absolute',
                                right: 5,
                                bottom: 5
                            }}>
                            <Icon
                                name="check-circle"
                                size={SCREEN_HEIGHT * 0.03}
                                color="#00aced"
                            />
                        </View>
                    )}
                    {item.tags && Object.keys(item.tags).length > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                left: 5,
                                bottom: 0
                            }}>
                            <Icon
                                name="attachment"
                                size={SCREEN_HEIGHT * 0.04}
                                color="#00aced"
                            />
                        </View>
                    )}
                    {itemIsGeotagged && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5
                            }}>
                            <Icon name="place" size={28} color="#00aced" />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    /**
     * Render photos selected from the users geotagged album
     */
    renderGalleryPhoto = ({ item, index }) => {
        // console.log('renderGalleryPhoto', item);
        const itemIsGeotagged = isGeotagged(item);
        let width;
        let mgn = 0;

        // middle image
        if (index % 3 === 1) {
            width = SCREEN_WIDTH / 3.1;
            mgn = 2;
        }
        // left & right image
        else {
            width = SCREEN_WIDTH / 3;
        }

        return (
            <TouchableWithoutFeedback
                onPress={this.galleryPhotoPressed.bind(this, index)}>
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

                    {item.selected && (
                        <View
                            style={{
                                position: 'absolute',
                                right: 5,
                                bottom: 5
                            }}>
                            <Icon
                                name="check-circle"
                                size={SCREEN_HEIGHT * 0.03}
                                color="#00aced"
                            />
                        </View>
                    )}

                    {item.tags && Object.keys(item.tags).length > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                left: 5,
                                bottom: 0
                            }}>
                            <Icon
                                name="attachment"
                                size={SCREEN_HEIGHT * 0.04}
                                color="#00aced"
                            />
                        </View>
                    )}
                    {itemIsGeotagged && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5
                            }}>
                            <Icon name="place" size={28} color="#00aced" />
                        </View>
                    )}
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

    _marginWhenPhotos() {
        if (this.props.photos.length > 0) {
            return styles.smallTopMargin;
        }
    }

    /**
     * Style of webText tag
     */
    _webTextStyle() {
        if (Platform.OS === 'android') return styles.webTextSmall;

        // if "iPhone 10+", return 17% card height
        const x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.webText;

        if (x === '8' || x === 'SE') {
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
    render() {
        const lang = this.props.lang;
        if (
            this.props.photos.length === 0 &&
            this.props.gallery.length === 0 &&
            this.props.webImagesCount === 0
        ) {
            return (
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 0.75
                    }}>
                    <Image
                        style={{
                            width: SCREEN_WIDTH / 2,
                            height: SCREEN_WIDTH / 2
                        }}
                        source={require('../../../assets/illustrations/empty_image.png')}
                    />
                    <SubTitle
                        style={styles.exptyStateText}
                        dictionary={`${lang}.leftpage.no-images`}
                    />
                    <Body
                        style={styles.exptyStateText}
                        dictionary={`${lang}.leftpage.take-photo`}
                    />
                </View>
            );
        }

        // Web photos have been uploaded to the web-app
        // Photos are taken the in-app camera
        // Gallery from albums
        return (
            <View style={this._marginWhenPhotos()}>
                {this.props.webPhotos.length > 0 && (
                    <View style={styles.webImageContainer}>
                        <TouchableWithoutFeedback
                            onPress={this._webImagePressed.bind(this)}>
                            <Image
                                source={{
                                    uri: this.props.webPhotos[0].filename
                                }}
                                style={styles.webImage}
                            />
                        </TouchableWithoutFeedback>

                        <View style={styles.webTextContainer}>
                            <View style={styles.webInnerContainer}>
                                <Icon
                                    name="cloud"
                                    size={SCREEN_HEIGHT * 0.04}
                                    color="#00aced"
                                />
                                <Text style={this._webTextStyle()}>
                                    {this.props.webImagesCount}
                                </Text>
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
                        renderItem={this.renderCameraPhoto}
                        ItemSeparatorComponent={this.renderSeparator}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                {/* Empty space between camera & gallery photos */}
                <View style={{ height: SCREEN_HEIGHT * 0.003 }} />

                {this.props.gallery && (
                    <FlatList
                        data={this.props.gallery}
                        extraData={this.props.uniqueValue}
                        keyExtractor={(item, index) => item + index}
                        numColumns={3}
                        renderItem={this.renderGalleryPhoto}
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
        backgroundColor: '#95a5a6'
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
        height: 135
    },
    webImageContainer: {
        position: 'relative',
        paddingBottom: SCREEN_HEIGHT * 0.002
        // backgroundColor: 'white'
    },
    webTextContainer: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.01,
        right: SCREEN_WIDTH * 0.7,
        height: SCREEN_HEIGHT * 0.03,
        width: SCREEN_HEIGHT * 0.03,
        alignItems: 'center',
        justifyContent: 'center'
        // backgroundColor: 'white'
    },
    webInnerContainer: {
        position: 'relative',
        height: SCREEN_HEIGHT * 0.035,
        width: SCREEN_HEIGHT * 0.05
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
        bottom: SCREEN_HEIGHT * 0.01
    },
    exptyStateText: {
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20
    }
};

export default connect(
    null,
    actions
)(UploadImagesGrid);
