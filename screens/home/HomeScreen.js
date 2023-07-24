import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import {TransText} from 'react-native-translation';

import {Button} from '@rneui/themed';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Colors, Header, Title} from '../components';

import {connect} from 'react-redux';
import * as actions from '../../actions';
import {checkCameraRollPermission} from '../../utils/permissions';
import {isGeotagged} from '../../utils/isGeotagged';
// Components
import {ActionButton, UploadButton, UploadImagesGrid} from './homeComponents';
import DeviceInfo from 'react-native-device-info';
import {isTagged} from '../../utils/isTagged';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class HomeScreen extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isUploadCancelled: false,
            total: 0, // total number of images to upload
            uploaded: 0, // total number of tagged images uploaded
            uploadFailed: 0,
            tagged: 0, // total number of images tagged successfully
            taggedFailed: 0
        };

        // Bind any functions that call props
        this.toggleSelecting = this.toggleSelecting.bind(this);
        this.deleteImages = this.deleteImages.bind(this);

        const model = DeviceInfo.getModel();

        // settings_actions, settings_reducer
        this.props.setModel(model);
    }

    /**
     * Check for images on the web app when this page loads
     * INFO: these are images that were uploaded on website
     * but were not tagged and submitted
     */
    async componentDidMount() {
        // If enable_admin_tagging is False, the user wants to get and tag their uploads
        if (!this.props.user?.enable_admin_tagging) {
            // images_actions, images_reducer
            await this.props.getUntaggedImages(this.props.token);
        }

        // if not in DEV mode check for new version
        !__DEV__ && this.checkNewVersion();

        this.checkGalleryPermission();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.appVersion !== this.props.appVersion) {
            this.checkNewVersion();
        }
    }

    /**
     * During upload, the user pressed cancel
     */
    cancelUpload() {
        this.props.cancelUpload();

        // cancel pending uploads
        this.setState({isUploadCancelled: true});
    }

    /**
     * Needs comment
     */
    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();

        if (result === 'granted') {
            this.getImagesFromCameraRoll();
        } else {
            this.props.navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION'
            });
        }
    }

    /**
     * Needs comment
     */
    async checkNewVersion() {
        const version = DeviceInfo.getVersion();

        const platform = Platform.OS;

        if (this.props.appVersion === null) {
            this.props.checkAppVersion();
        } else if (this.props.appVersion[platform].version !== version) {
            this.props.navigation.navigate('UPDATE', {
                url: this.props.appVersion[platform].url
            });
        }
    }

    /**
     * Dispatch action that will get the images from the camera roll
     */
    getImagesFromCameraRoll() {
        this.props.getPhotosFromCameraroll();
    }

    render() {
        const lang = this.props.lang;

        return (
            <>
                <Header
                    leftContent={
                        <Title
                            color="white"
                            dictionary={`${lang}.leftpage.upload`}
                        />
                    }
                    rightContent={this.renderDeleteButton()}
                />
                <View style={styles.container}>
                    {/* INFO: modal thats shown during image upload */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={this.props.showModal}>
                        {/* Waiting spinner to show during upload */}
                        {this.props.isUploading && (
                            <View style={styles.modal}>
                                <TransText
                                    style={styles.uploadText}
                                    dictionary={`${lang}.leftpage.please-wait-uploading`}
                                />

                                <ActivityIndicator style={{marginBottom: 10}} />

                                <Text style={styles.uploadCount}>
                                    {this.state.uploaded} / {this.state.total}
                                </Text>

                                <Button
                                    onPress={this.cancelUpload.bind(this)}
                                    title="Cancel"
                                />
                            </View>
                        )}

                        {/* Thank You + Messages */}
                        {this.props.showThankYouMessages && (
                            <View style={styles.modal}>
                                <View style={styles.thankYouModalInner}>
                                    <TransText
                                        style={{
                                            fontSize: SCREEN_HEIGHT * 0.03,
                                            marginBottom: 5
                                        }}
                                        dictionary={`${lang}.leftpage.thank-you`}
                                    />

                                    {/* Upload success */}
                                    {this.state.uploaded > 0 && (
                                        <TransText
                                            style={{
                                                fontSize: SCREEN_HEIGHT * 0.02,
                                                marginBottom: 5
                                            }}
                                            dictionary={`${lang}.leftpage.you-have-uploaded`}
                                            values={{
                                                count: this.state.uploaded
                                            }}
                                        />
                                    )}

                                    {/* Tagged success */}
                                    {this.state.tagged > 0 && (
                                        <TransText
                                            style={{
                                                fontSize: SCREEN_HEIGHT * 0.02,
                                                marginBottom: 5
                                            }}
                                            dictionary={`${lang}.leftpage.you-have-tagged`}
                                            values={{
                                                count: this.state.tagged
                                            }}
                                        />
                                    )}

                                    {this.state.uploadFailed > 0 && (
                                        <Text
                                            style={{
                                                fontSize: SCREEN_HEIGHT * 0.02,
                                                marginBottom: 5
                                            }}>
                                            {this.state.uploadFailed} uploads
                                            failed
                                        </Text>
                                    )}

                                    {this.state.taggedFailed > 0 && (
                                        <Text
                                            style={{
                                                fontSize: SCREEN_HEIGHT * 0.02,
                                                marginBottom: 5
                                            }}>
                                            {this.state.taggedFailed} tags
                                            failed
                                        </Text>
                                    )}

                                    <View style={{flexDirection: 'row'}}>
                                        <TouchableWithoutFeedback
                                            onPress={this.hideThankYouMessages.bind(
                                                this
                                            )}>
                                            <View style={styles.thankYouButton}>
                                                <TransText
                                                    style={
                                                        styles.normalWhiteText
                                                    }
                                                    dictionary={`${lang}.leftpage.close`}
                                                />
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Modal>
                    {/* Grid to display images -- 3 columns */}
                    <UploadImagesGrid
                        navigation={this.props.navigation}
                        photos={this.props.images}
                        lang={this.props.lang}
                        uniqueValue={this.props.uniqueValue}
                        isSelecting={this.props.isSelecting}
                    />

                    <View style={styles.bottomContainer}>
                        {this.renderHelperMessage()}
                    </View>
                </View>
                {this.renderActionButton()}

                {this.renderUploadButton()}
            </>
        );
    }

    /**
     * Navigate to album screen
     *
     */
    loadGallery = async () => {
        this.props.navigation.navigate('ALBUM', {screen: 'GALLERY'});
    };

    /**
     * Render helper text when delete button is clicked
     */
    renderHelperMessage() {
        if (this.props.isSelecting) {
            if (this.props.selected === 0) {
                return (
                    <View style={styles.helperContainer}>
                        <Icon
                            color={Colors.muted}
                            name="ios-information-circle-outline"
                            size={32}
                        />
                        <Body
                            style={{marginLeft: 10}}
                            color="muted"
                            dictionary={`${this.props.lang}.leftpage.select-to-delete`}
                        />
                    </View>
                );
            }
        }
    }

    /**
     * Render Upload Button
     *
     * ... if images exist and at least 1 image has a tag
     */
    renderUploadButton() {
        if (this.props.images?.length === 0 || this.props.isSelecting) {
            return;
        }

        let hasTags = false;

        this.props.images.map(img => {
            let tagged = isTagged(img);

            if (tagged) {
                hasTags = true;
            }
        });

        if (!hasTags) {
            return;
        }

        return (
            <UploadButton lang={this.props.lang} onPress={this.uploadPhotos} />
        );
        r;
    }

    /**
     * Render Delete / Cancel Header Button
     */
    renderDeleteButton() {
        if (this.props.isSelecting) {
            return (
                <TransText
                    style={styles.normalWhiteText}
                    onPress={this.toggleSelecting}
                    dictionary={`${this.props.lang}.leftpage.cancel`}
                />
            );
        }

        if (this.props.images.length > 0) {
            return (
                <TransText
                    style={styles.normalWhiteText}
                    onPress={this.toggleSelecting}
                    dictionary={`${this.props.lang}.leftpage.delete`}
                />
            );
        }

        return null;
    }

    /**
     * Toggle Selecting - header right
     */
    toggleSelecting() {
        this.props.deselectAllImages();
        this.props.toggleSelecting();
    }

    /**
     * if image is of type WEB -- hit api to delete uploaded image
     * then delete from state
     *
     * else
     * delete images from state based on id
     */
    deleteImages() {
        this.props.images.map(image => {
            if (image.selected) {
                if (image.type === 'web' && image.uploaded) {
                    this.props.deleteWebImage(
                        this.props.token,
                        image.id,
                        this.props.user.enable_admin_tagging
                    );
                } else {
                    this.props.deleteImage(image.id);
                }
            }
        });

        // this.props.deleteSelectedImages();
        this.props.toggleSelecting();
    }

    // reset state after cancel button pressed
    resetAfterUploadCancelled = () => {
        this.setState({
            total: 0,
            uploaded: 0,
            uploadFailed: 0,
            isUploadCancelled: false,
            tagged: 0,
            taggedFailed: 0
        });
    };

    /**
     * Upload photos, 1 photo per request
     *
     * - status - images being sent across
     * - fix progress bar percentComplete
     * - Consider: Auto-upload any tagged images in the background once the user has pressed Confirm
     */
    uploadPhotos = async () => {
        // Reset upload count
        this.setState({
            // Images to upload
            uploaded: 0,
            uploadFailed: 0,

            // Images that are uploaded, now being tagged
            tagged: 0,
            taggedFailed: 0
        });

        const model = this.props.model;

        let imagesCount = this.props.images.length;

        this.setState({
            total: imagesCount
        });

        // shared.js
        // showModal = true;
        // isUploading = true;
        this.props.startUploading();

        if (imagesCount > 0) {
            // async loop
            for (const img of this.props.images) {
                console.log('LOOP');
                console.log(img);

                // break loop if cancel button is pressed
                if (this.state.isUploadCancelled) {
                    this.resetAfterUploadCancelled();
                    return;
                }
                const isgeotagged = isGeotagged(img);
                const isItemTagged = isTagged(img);

                // Upload any new image that is tagged or not
                if (img.type === 'gallery' && isgeotagged) {
                    let ImageData = new FormData();

                    ImageData.append('photo', {
                        name: img.filename,
                        type: 'image/jpeg',
                        uri: img.uri
                    });

                    ImageData.append('lat', img.lat);
                    ImageData.append('lon', img.lon);
                    ImageData.append('date', parseInt(img.date));
                    ImageData.append('picked_up', img.picked_up ? 1 : 0);
                    ImageData.append('model', model);

                    // Tags and custom_tags may or may not exist

                    if (isItemTagged) {
                        if (Object.keys(img.tags).length > 0) {
                            ImageData.append('tags', JSON.stringify(img.tags));
                        }

                        if (
                            img.hasOwnProperty('customTags') &&
                            img.customTags.length > 0
                        ) {
                            ImageData.append(
                                'custom_tags',
                                JSON.stringify(img.customTags)
                            );
                        }
                    }

                    // Upload image
                    const response = await this.props.uploadImage(
                        this.props.token,
                        ImageData,
                        img.id,
                        this.props.user.enable_admin_tagging,
                        isItemTagged
                    );

                    // if success upload++ else failed++

                    if (response && response.success) {
                        this.setState(previousState => ({
                            uploaded: previousState.uploaded + 1
                        }));
                    } else {
                        this.setState(previousState => ({
                            uploadFailed: previousState.uploadFailed + 1
                        }));
                    }
                } else if (img.type.toLowerCase() === 'web' && isItemTagged) {
                    /**
                     * Upload tags for already uploaded image
                     *
                     * Previously these were images uploaded to web,
                     * But now untagged images can also be uploaded from mobile.
                     * These should be re-classified as Uploaded, Not tagged.
                     *
                     * We can also update 'picked_up' value here
                     */
                    const response = await this.props.uploadTagsToWebImage(
                        this.props.token,
                        img
                    );

                    console.log('After web upload');
                    console.log(response);

                    if (response && response.success) {
                        this.setState(previousState => ({
                            tagged: previousState.tagged + 1
                        }));
                    } else {
                        this.setState(previousState => ({
                            taggedFailed: previousState.taggedFailed + 1
                        }));
                    }
                }
                // else if (!isgeotagged)
                // {
                //     this.setState(previousState => ({
                //         uploadFailed: previousState.uploadFailed + 1
                //     }));
                // }
                else {
                    console.log('do something?');
                }
            }
        }

        this.props.showThankYouMessagesAfterUpload();
    };

    /**
     *
     */
    hideThankYouMessages() {
        this.props.closeThankYouMessages();
    }

    /**
     * fn to determine the state of FAB
     */
    renderActionButton() {
        let status = 'NO_IMAGES';
        let fabFunction = this.loadGallery;
        if (this.props.images.length === 0) {
            status = 'NO_IMAGES';
            fabFunction = this.loadGallery;
        }
        if (this.props.isSelecting) {
            status = 'SELECTING';
            if (this.props.selected > 0) {
                status = 'SELECTED';
                fabFunction = this.deleteImages;
            }
        }

        return <ActionButton status={status} onPress={fabFunction} />;
    }
}

const styles = {
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20
    },
    helperContainer: {
        position: 'relative',
        bottom: 30,
        width: SCREEN_WIDTH - 150,
        height: 80,
        flexDirection: 'row',
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: Colors.accentLight
    },
    normalText: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    normalWhiteText: {
        color: 'white',
        fontSize: SCREEN_HEIGHT * 0.02
    },
    modal: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadedImagesNotTaggedContainer: {
        padding: 5,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        maWidth: SCREEN_WIDTH * 0.8
    },
    photo: {
        height: 100,
        width: SCREEN_WIDTH * 0.325,
        marginRight: 2
    },
    photos: {
        flexDirection: 'row',
        marginLeft: 2,
        width: SCREEN_WIDTH * 0.99
    },
    progress: {
        alignItems: 'flex-end'
    },
    progressTop: {
        color: 'grey',
        fontSize: 7
    },
    progressBottom: {
        fontSize: 7,
        marginBottom: 15
    },
    // Litter Modal
    litterModal: {
        backgroundColor: 'rgba(255,255,255,1)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    thankYouButton: {
        backgroundColor: 'green',
        borderRadius: 3,
        flex: 0.8,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    },
    thankYouModalInner: {
        backgroundColor: 'rgba(255,255,255,1)',
        borderRadius: 6,
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH * 0.7,
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10
    },
    uploadCount: {
        color: 'white',
        fontSize: SCREEN_HEIGHT * 0.02,
        fontWeight: 'bold',
        marginBottom: 20
    },
    uploadText: {
        color: 'white',
        fontSize: SCREEN_HEIGHT * 0.02,
        fontWeight: 'bold',
        marginBottom: 10
    }
};

const mapStateToProps = state => {
    return {
        appVersion: state.shared.appVersion,
        images: state.images.imagesArray,
        isSelecting: state.images.isSelecting,
        lang: state.auth.lang,
        showModal: state.shared.showModal,
        model: state.settings.model,
        selected: state.images.selected,
        showThankYouMessages: state.shared.showThankYouMessages,
        token: state.auth.token,
        totalImagesToUpload: state.shared.totalImagesToUpload,
        isUploading: state.shared.isUploading,
        uniqueValue: state.shared.uniqueValue,
        user: state.auth.user
    };
};

export default connect(mapStateToProps, actions)(HomeScreen);
