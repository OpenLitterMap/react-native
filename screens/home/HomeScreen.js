import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Text,
    TouchableWithoutFeedback,
    View,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import { TransText } from 'react-native-translation';

import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import { Header, Title, Body, Colors, SubTitle } from '../components';

import { connect } from 'react-redux';
import * as actions from '../../actions';
import { checkCameraRollPermission } from '../../utils/permissions';
import { isGeotagged } from '../../utils/isGeotagged';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const equalWidth = SCREEN_WIDTH / 3;

// Components
import { UploadImagesGrid, ActionButton, UploadButton } from './homeComponents';
import AddTags from '../pages/AddTags';
import DeviceInfo from 'react-native-device-info';
import moment from 'moment';

class HomeScreen extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            total: 0, // total number of images with tags to upload
            uploaded: 0, // total number of tagged images uploaded
            failedUpload: 0
        };

        // Bind any functions that call props
        this.toggleSelecting = this.toggleSelecting.bind(this);

        // Photos selected from the Photos Album
        AsyncStorage.getItem('openlittermap-gallery').then(gallery => {
            if (gallery && gallery !== '[]') {
                this.props.photosFromGallery(JSON.parse(gallery));
            }
        });

        // Photos taken from the OLM Camera
        AsyncStorage.getItem('openlittermap-photos').then(photos => {
            if (photos && photos !== '[]') {
                this.props.loadCameraPhotosFromAsyncStorage(JSON.parse(photos));
            }
        });

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
        // web_actions, web_reducer
        await this.props.checkForImagesOnWeb(this.props.token);

        this.checkNewVersion();
        this.checkGalleryPermission();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.appVersion !== this.props.appVersion) {
            this.checkNewVersion();
        }
    }

    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result === 'granted') {
            this.getImagesFormCameraroll();
        } else {
            this.props.navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION'
            });
        }
    }

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

    getImagesFormCameraroll() {
        this.props.getPhotosFromCameraroll();
    }

    /**
     *
     */
    _toggleUpload() {
        this.props.toggleUpload();

        // cancel pending uploads
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
                        visible={this.props.modalVisible}>
                        {/* Upload Photos */}
                        {this.props.uploadVisible && (
                            <View style={styles.modal}>
                                <TransText
                                    style={styles.uploadText}
                                    dictionary={`${lang}.leftpage.please-wait-uploading`}
                                />

                                <ActivityIndicator
                                    style={{ marginBottom: 10 }}
                                />

                                <Text style={styles.uploadCount}>
                                    {this.state.uploaded} / {this.state.total}
                                </Text>

                                <Button
                                    onPress={this._toggleUpload.bind(this)}
                                    title="Cancel"
                                />
                            </View>
                        )}

                        {/* Tag Litter to Images */}
                        {this.props.litterVisible && (
                            <View style={styles.litterModal}>
                                <AddTags />
                            </View>
                        )}

                        {/* Thank you modal */}
                        {this.props.thankYouVisible && (
                            <View style={styles.modal}>
                                <View style={styles.thankYouModalInner}>
                                    {this.state.uploaded > 0 ? (
                                        <TransText
                                            style={{
                                                fontSize: SCREEN_HEIGHT * 0.02,
                                                marginBottom: 5
                                            }}
                                            dictionary={`${lang}.leftpage.thank-you`}
                                        />
                                    ) : (
                                        <SubTitle
                                            style={{ marginBottom: 5 }}
                                            color="error">
                                            Error
                                        </SubTitle>
                                    )}

                                    {this.state.uploaded > 0 ? (
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
                                    ) : (
                                        <Body style={{ marginBottom: 12 }}>
                                            Something went wrong please try
                                            again.
                                        </Body>
                                    )}

                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableWithoutFeedback
                                            onPress={this._toggleThankYou.bind(
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

                    <UploadImagesGrid
                        gallery={this.props.gallery}
                        photos={this.props.photos}
                        lang={this.props.lang}
                        uniqueValue={this.props.uniqueValue}
                        isSelecting={this.props.isSelecting}
                        //webNextImage={this.props.webNextImage}
                        webImagesCount={this.props.webImagesCount}
                        webPhotos={this.props.webPhotos}
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
     * Delete Selected Images
     * todo - check if we need to async await before closing.
     * other loops returning bugs when deleting multiple indexes
     */
    deleteSelectedImages = () => {
        for (let i = this.props.photos.length - 1; i >= 0; --i) {
            if (this.props.photos[i]['selected']) {
                this.props.deleteSelectedPhoto(i);
            }
        }

        for (let i = this.props.gallery.length - 1; i >= 0; --i) {
            if (this.props.gallery[i]['selected']) {
                this.props.deleteSelectedGallery(i);
            }
        }

        // when all this is done, async await...then
        this.props.toggleSelecting();

        // async-storage photos & gallery set
        setTimeout(() => {
            AsyncStorage.setItem(
                'openlittermap-photos',
                JSON.stringify(this.props.photos)
            );
            AsyncStorage.setItem(
                'openlittermap-gallery',
                JSON.stringify(this.props.gallery)
            );
        }, 1000);
    };

    /**
     * Navigate to album screen
     *
     */
    loadGallery = async () => {
        this.props.navigation.navigate('ALBUM');
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
                            style={{ marginLeft: 10 }}
                            color="muted"
                            dictionary={`${
                                this.props.lang
                            }.leftpage.select-to-delete`}
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
        if (
            (this.props.photos?.length === 0 &&
                this.props.gallery?.length === 0 &&
                this.props.webPhotos?.length === 0) ||
            this.props.isSelecting
        ) {
            return;
        } else {
            let tagged = 0;
            this.props.photos.map(img => {
                if (img.tags && Object.keys(img.tags)?.length > 0) {
                    tagged++;
                }
            });

            this.props.gallery.map(img => {
                if (img.tags && Object.keys(img.tags)?.length > 0) {
                    tagged++;
                }
            });

            this.props.webPhotos.map(img => {
                if (img.tags && Object.keys(img.tags)?.length > 0) {
                    tagged++;
                }
            });

            if (tagged === 0) {
                return;
            } else {
                return (
                    <UploadButton
                        lang={this.props.lang}
                        onPress={this.uploadPhotos}
                    />
                );
            }
        }
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

        if (this.props.photos.length > 0 || this.props.gallery.length > 0) {
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
     * Render Header Title
     *
     * My Account || x photos selected
     */
    renderCenterTitle() {
        if (this.props.isSelecting) {
            return (
                <TransText
                    dictionary={`${this.props.lang}.leftpage.selected`}
                    values={{ photos: this.props.selected }}
                />
            );
        }

        if (this.props.gallery.length > 0 || this.props.photos.length > 0) {
            for (let i = 0; i < this.props.gallery.length; i++) {
                if (this.props.gallery[i].hasOwnProperty('litter')) {
                    return (
                        <TransText
                            style={styles.normalText}
                            dictionary={`${
                                this.props.lang
                            }.leftpage.press-upload`}
                        />
                    );
                }
            }

            for (let i = 0; i < this.props.photos.length; i++) {
                if (this.props.photos[i].hasOwnProperty('litter')) {
                    return (
                        <TransText
                            style={styles.normalText}
                            dictionary={`${
                                this.props.lang
                            }.leftpage.press-upload`}
                        />
                    );
                }
            }

            return (
                <TransText
                    style={styles.normalText}
                    dictionary={`${this.props.lang}.leftpage.select-a-photo`}
                />
            );
        }
    }

    /**
     * Toggle Selecting - header right
     */
    toggleSelecting() {
        if (this.props.isSelecting) {
            if (this.props.photos.length > 0) {
                this.props.deselectAllCameraPhotos();
            }
            if (this.props.gallery.length > 0) {
                this.props.deselectAllGalleryPhotos();
            }
        }

        this.props.toggleSelecting();
    }

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
            uploaded: 0,
            failedUpload: 0
        });

        const model = this.props.model;

        let galleryCount = 0;
        let photosCount = 0;
        let webCount = 0;

        this.props.gallery.map(item => {
            if (item.tags && Object.keys(item.tags)?.length > 0) {
                galleryCount++;
            }
        });

        this.props.photos.map(item => {
            if (item.tags && Object.keys(item.tags)?.length > 0) {
                photosCount++;
            }
        });

        this.props.webPhotos.map(item => {
            if (item.tags && Object.keys(item.tags)?.length > 0) {
                webCount++;
            }
        });

        const total = galleryCount + photosCount + webCount;

        console.log({ total });

        this.setState({
            total
        });

        // shared.js
        this.props.toggleUpload();

        if (galleryCount > 0) {
            // async loop
            for (const img of this.props.gallery) {
                const isgeotagged = await isGeotagged(img);
                if (
                    img.tags &&
                    Object.keys(img.tags).length > 0 &&
                    isgeotagged
                ) {
                    let galleryToUpload = new FormData();

                    galleryToUpload.append('photo', {
                        name: img.filename,
                        type: 'image/jpeg',
                        uri: img.uri
                    });

                    const date = moment
                        .unix(img.timestamp)
                        .format('YYYY:MM:DD HH:mm:ss');

                    galleryToUpload.append('lat', img.lat);
                    galleryToUpload.append('lon', img.lon);
                    galleryToUpload.append('date', date);
                    galleryToUpload.append('presence', img.picked_up);
                    galleryToUpload.append('model', model);
                    galleryToUpload.append('tags', img.tags);

                    const myIndex = this.props.gallery.indexOf(img);

                    // shared_actions.js
                    const response = await this.props.uploadImage(
                        this.props.token,
                        galleryToUpload
                    );

                    if (response && response.success) {
                        // Remove the image
                        this.props.galleryPhotoUploadedSuccessfully(myIndex);

                        this.setState(previousState => ({
                            uploaded: previousState.uploaded + 1
                        }));
                    } else {
                        this.setState(previousState => ({
                            failedUpload: previousState.failedUpload + 1
                        }));
                    }
                } else if (!isgeotagged) {
                    this.setState(previousState => ({
                        failedUpload: previousState.failedUpload + 1
                    }));
                }
            }
        }

        if (photosCount > 0) {
            // async loop
            for (const img of this.props.photos) {
                const isgeotagged = await isGeotagged(img);

                if (
                    img.tags &&
                    Object.keys(img.tags).length > 0 &&
                    isgeotagged
                ) {
                    // Formdata
                    let cameraPhoto = new FormData();

                    cameraPhoto.append('photo', {
                        name: img.filename,
                        type: 'image/jpeg',
                        uri: img.uri
                    });

                    cameraPhoto.append('lat', img.lat);
                    cameraPhoto.append('lon', img.lon);
                    cameraPhoto.append('date', img.date);
                    cameraPhoto.append('presence', img.picked_up);
                    cameraPhoto.append('model', model);
                    cameraPhoto.append('tags', img.tags);
                    const myIndex = this.props.photos.indexOf(img);
                    console.log(JSON.stringify(cameraPhoto, null, 2));
                    // uploading images with tags
                    const response = await this.props.uploadImage(
                        this.props.token,
                        cameraPhoto
                    );

                    if (response && response.success) {
                        // Remove the image
                        this.props.cameraPhotoUploadedSuccessfully(myIndex);

                        this.setState(previousState => ({
                            uploaded: previousState.uploaded + 1
                        }));
                    } else {
                        this.setState(previousState => ({
                            failedUpload: previousState.failedUpload + 1
                        }));
                    }
                } else if (!isgeotagged) {
                    this.setState(previousState => ({
                        failedUpload: previousState.failedUpload + 1
                    }));
                }
            }
        }

        if (webCount > 0) {
            // async loop
            for (const img of this.props.webPhotos) {
                if (img.tags && Object.keys(img.tags).length > 0) {
                    const response = await this.props.uploadTags(
                        this.props.token,
                        img.tags,
                        img.id
                    );

                    if (response && response.success) {
                        this.props.removeWebImage(img.id);

                        this.setState(previousState => ({
                            uploaded: previousState.uploaded + 1
                        }));
                    } else {
                        this.setState(previousState => ({
                            failedUpload: previousState.failedUpload + 1
                        }));
                    }
                }
            }
        }

        //  Last step - if all photos have been deleted, close modal
        if (
            this.state.uploaded + this.state.failedUpload ===
            this.state.total
        ) {
            // shared_actions
            this.props.toggleUpload();
            this.props.toggleThankYou();
            // this.state.uploaded > 0 && this.props.toggleThankYou();
        }

        setTimeout(() => {
            AsyncStorage.setItem(
                'openlittermap-photos',
                JSON.stringify(this.props.photos)
            );
            AsyncStorage.setItem(
                'openlittermap-gallery',
                JSON.stringify(this.props.gallery)
            );
        }, 1000);
    };

    /**
     *
     */
    _toggleThankYou() {
        console.log('toggleThankYou');
        this.props.toggleThankYou();
    }

    /**
     * fn to determine the state of FAB
     */

    renderActionButton() {
        let status = 'NO_IMAGES';
        let fabFunction = this.loadGallery;
        if (
            this.props.photos.length === 0 &&
            this.props.gallery.length === 0 &&
            this.props.webImagesCount === 0
        ) {
            status = 'NO_IMAGES';
            fabFunction = this.loadGallery;
        }
        if (this.props.isSelecting) {
            status = 'SELECTING';
            if (this.props.selected > 0) {
                status = 'SELECTED';
                fabFunction = this.deleteSelectedImages;
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
        androidName: state.settings.androidName,
        gallery: state.gallery.gallery,
        imageBrowserOpen: state.gallery.imageBrowserOpen,
        isSelecting: state.shared.isSelecting,
        lang: state.auth.lang,
        selected: state.shared.selected,
        photos: state.photos.photos,
        progress: state.photos.progress,
        modalVisible: state.shared.modalVisible,
        model: state.settings.model,
        litterVisible: state.shared.litterVisible,
        remainingCount: state.photos.remainingCount,
        token: state.auth.token,
        totalGalleryUploaded: state.gallery.totalGalleryUploaded,
        totalCameraPhotosUploaded: state.photos.totalCameraPhotosUploaded,
        thankYouVisible: state.shared.thankYouVisible,
        totalImagesToUpload: state.shared.totalImagesToUpload,
        totalTaggedGalleryCount: state.gallery.totalTaggedGalleryCount,
        totalTaggedSessionCount: state.photos.totalTaggedSessionCount,
        uploadVisible: state.shared.uploadVisible,
        uniqueValue: state.shared.uniqueValue,
        user: state.auth.user,
        webImagesCount: state.web.count,
        //webNextImage: state.web.nextImage
        webPhotos: state.web.photos,
        totalWebImagesUpdated: state.web.totalWebImagesUpdated,
        appVersion: state.shared.appVersion
    };
};

export default connect(
    mapStateToProps,
    actions
)(HomeScreen);
