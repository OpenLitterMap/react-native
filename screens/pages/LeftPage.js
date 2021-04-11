import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Fragment,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage';

import { TransText } from 'react-native-translation'

import { request, PERMISSIONS } from 'react-native-permissions'

import { Button, Header, Icon, SearchBar } from 'react-native-elements'
// import * as Progress from 'react-native-progress'

import { connect } from 'react-redux'
import * as actions from '../../actions'

import AlbumList from './library/AlbumList'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

const equalWidth = SCREEN_WIDTH / 3

// Components
import LeftPageImages from './components/LeftPageImages'
// import Stats from './components/Stats'
import LitterPicker from './LitterPicker'

import moment from 'moment'

// Select + Upload Page
class LeftPage extends PureComponent
{
    constructor (props)
    {
        super (props);
        // Bind any functions that call props
        this.toggleSelecting = this.toggleSelecting.bind(this);
        // this.renderDeleteButton = this.renderDeleteButton.bind(this);
        // this.renderGalleryItem = this.renderGalleryItem.bind(this);
        // this.galleryItemPressed = this.galleryItemPressed.bind(this);

        // async-storage photos & gallery get
        AsyncStorage.getItem('openlittermap-gallery').then((gallery) => {
            if (gallery == null) {
                this.props.photosFromGallery([]);
            } else {
                this.props.photosFromGallery(JSON.parse(gallery));
            }
        });

        AsyncStorage.getItem('openlittermap-photos').then((photos) => {
            if (photos == null) {
                this.props.setPhotos([]);
            } else {
                this.props.setPhotos(JSON.parse(photos));
            }
        });
    }

    UNSAFE_componentWillReceiveProps (nextProps)
    {
        // console.log('Next props - left page.gallery', nextProps.gallery);
        // If the user does not exist, the user has logged out.
        if (! nextProps.user)
        {
            // console.log('left page- user does not exist');
            this.props.navigation.navigate('Auth');
            return;
        }
    }

    /**
     * Check for images on the web app when this page loads
     */
    async componentDidMount ()
    {
        // web_actions, web_reducer
        await this.props.checkForImagesOnWeb(this.props.token);
    }

    _toggleUpload ()
    {
        this.props.toggleUpload();
        this.props.resetGalleryCount();
        this.props.resetSessionCount();
    }

    render ()
    {
        console.log('LeftPage.render');
        if (this.props.imageBrowserOpen)
        {
            // todo- cancel all subscriptions and async tasks in componentWillUnmount
            return <AlbumList navigation={this.props.navigation} />;
        }

        const lang = this.props.lang;

        return (
            <>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#2189dc' }} />
                <SafeAreaView style={styles.container}>

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={this.props.modalVisible}
                    >
                        {/* Upload Photos */}
                        {
                            this.props.uploadVisible && (
                                <View style={styles.modal}>
                                    <TransText
                                        style={styles.uploadText}
                                        dictionary={`${lang}.leftpage.please-wait-uploading`}
                                    />

                                    <ActivityIndicator style={{ marginBottom: 10 }} />

                                    <Text style={styles.uploadCount}>
                                        {this._getRemainingUploadCount()} /{' '}
                                        {this.props.totalImagesToUpload}
                                    </Text>

                                    {/* <Progress.Circle
                                      progress={this.props.galleryUploadProgress}
                                      showsText={true}
                                      size={100}
                                      style={{ marginBottom: 30 }}
                                    /> */}
                                    {/* Todo - translate cancel */}

                                    <Button onPress={this._toggleUpload.bind(this)} title="Cancel" />
                                </View>
                            )
                        }

                        {/* Tag Litter to Images */}
                        {
                            this.props.litterVisible && (
                                <View style={styles.litterModal}>
                                    <LitterPicker />
                                </View>
                            )
                        }

                        {/* Thank you modal */}
                        {
                            this.props.thankYouVisible && (
                                <View style={styles.modal}>
                                    <View style={styles.thankYouModalInner}>
                                        <TransText
                                            style={{ fontSize: SCREEN_HEIGHT * 0.02, marginBottom: 5 }}
                                            dictionary={`${lang}.leftpage.thank-you`}
                                        />

                                        <TransText
                                            style={{ fontSize: SCREEN_HEIGHT * 0.02, marginBottom: 5 }}
                                            dictionary={`${lang}.leftpage.you-have-uploaded`}
                                            values={{ "count": this.props.totalImagesToUpload }}
                                        />

                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableWithoutFeedback
                                                onPress={this._toggleThankYou.bind(this)}
                                            >
                                                <View style={styles.thankYouButton}>
                                                   <TransText
                                                       style={styles.normalWhiteText}
                                                       dictionary={`${lang}.leftpage.close`}
                                                   />
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                </View>
                            )
                        }
                    </Modal>

                    <Header
                        containerStyle={{ paddingTop: 0, height: SCREEN_HEIGHT * 0.1 }}
                        leftComponent={{
                            icon: 'menu',
                            color: '#fff',
                            size: SCREEN_HEIGHT * 0.035,
                            onPress: () => {
                                this.props.navigation.navigate('settings');
                            }
                        }}
                        centerComponent={this.renderCenterTitle()}
                        rightComponent={this.renderDeleteButton()}
                    />

                    <LeftPageImages
                        gallery={this.props.gallery}
                        photos={this.props.photos}
                        lang={this.props.lang}
                        uniqueValue={this.props.uniqueValue}
                        isSelecting={this.props.isSelecting}
                        //webNextImage={this.props.webNextImage}
                        webImagesCount={this.props.webImagesCount}
                        webPhotos={this.props.webPhotos}
                    />

                    <View style={styles.bottomContainer}>{this.renderBottomTabBar()}</View>
                </SafeAreaView>
                <SafeAreaView style={{ flex: 0, backgroundColor: 'white' }} />
            </>
        );
    }

    /**
     * Delete Selected Images
     * todo - check if we need to async await before closing.
     * other loops returning bugs when deleting multiple indexes
     */
    deleteSelectedImages = () => {

        for (let i = this.props.photos.length - 1; i >= 0; --i)
        {
            if (this.props.photos[i]['selected'])
            {
                this.props.deleteSelectedPhoto(i);
            }
        }

        for (let i = this.props.gallery.length - 1; i >= 0; --i)
        {
            if (this.props.gallery[i]['selected'])
            {
                this.props.deleteSelectedGallery(i);
            }
        }

        // when all this is done, async await...then
        this.props.toggleSelecting();

        // async-storage photos & gallery set
        setTimeout(() => {
          AsyncStorage.setItem('openlittermap-photos', JSON.stringify(this.props.photos));
          AsyncStorage.setItem('openlittermap-gallery', JSON.stringify(this.props.gallery));
        }, 1000);
    };

    /**
     * Open Photo Gallery by changing state
     * @props gallery_actions, gallery_reducer
     */
    loadGallery = async () => {
        this.props.setImagesLoading(true);

        let p = Platform.OS === 'android' ? PERMISSIONS.ANDROID : PERMISSIONS.IOS;

        request(p.CAMERA).then(result => {
            if (result === 'granted')
            {
                this.props.toggleImageBrowser(true);
            }
        });
    };

    /**
     * Render Bottom Tab Bar = A || B
     */
    renderBottomTabBar ()
    {
        if (this.props.isSelecting)
        {
            if (this.props.selected > 0)
            {
                return (
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            width: '100%'
                        }}>
                        <TouchableOpacity onPress={() => this.deleteSelectedImages()}>
                            <Icon
                                name="delete-sweep"
                                size={SCREEN_HEIGHT * 0.04}
                                color="#00aced"
                            />
                            <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.delete`} />
                        </TouchableOpacity>
                    </View>
                );
            }

            return <TransText dictionary={`${this.props.lang}.leftpage.select-to-delete`} />;
        }
        return (
            <View style={styles.bottomBarContainer}>
                {/* Icon 1 - Load Photos  */}
                <TouchableWithoutFeedback onPress={this.loadGallery}>
                    <View style={styles.iconPadding}>
                        <Icon
                            name="perm-media"
                            size={SCREEN_HEIGHT * 0.04}
                            color="#00aced"
                        />
                        <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.photos`} />
                    </View>
                </TouchableWithoutFeedback>

                {/* Icon 2 - Upload Photos & Data */}
                {this.renderUploadButton()}
            </View>
        );
    }

    /**
     * Render Upload Button, if images & tag(s) exist
     */
    renderUploadButton ()
    {
        if (this.props.photos.length === 0 && this.props.gallery.length === 0) return;

        let tagged = 0;
        this.props.photos.map(photo => {
            if (photo.hasOwnProperty('litter')) tagged++;
        });

        this.props.gallery.map(gall => {
            if (gall.hasOwnProperty('litter')) tagged++;
        });

        if (tagged === 0) return;

        return (
            <TouchableWithoutFeedback onPress={this.uploadPhotos}>
                <View style={styles.iconPadding}>
                    <Icon name="backup" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
                    <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.upload`} />
                </View>
            </TouchableWithoutFeedback>
        );
    }

    /**
     * Render Delete / Cancel Header Button
     */
    renderDeleteButton ()
    {
        if (this.props.isSelecting)
        {
            return (
                <TransText
                    style={styles.normalWhiteText}
                    onPress={this.toggleSelecting}
                    dictionary={`${this.props.lang}.leftpage.cancel`}
                />
            );
        }

        if (this.props.photos.length > 0 || this.props.gallery.length > 0)
        {
            return (
                <TransText
                    style={styles.normalText}
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
    renderCenterTitle ()
    {
        if (this.props.isSelecting)
        {
            return (
                <TransText
                    dictionary={`${this.props.lang}.leftpage.selected`}
                    values={{ 'photos': this.props.selected }}
                />
            );
        }

        if (this.props.gallery.length > 0 | this.props.photos.length > 0)
        {
            for (let i = 0; i < this.props.gallery.length; i++)
            {
                if (this.props.gallery[i].hasOwnProperty('litter'))
                {
                    return <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.press-upload`} />;
                }
            }

            for (let i = 0; i < this.props.photos.length; i++)
            {
                if (this.props.photos[i].hasOwnProperty('litter'))
                {
                    return <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.press-upload`} />;
                }
            }

            return <TransText style={styles.normalText} dictionary={`${this.props.lang}.leftpage.select-a-photo`} />;
        }
    }

    /**
     * Toggle Selecting - header right
     */
    toggleSelecting ()
    {
        if (this.props.isSelecting)
        {
            if (this.props.photos.length > 0)
            {
                this.props.removeAllSelectedPhotos();
            }
            if (this.props.gallery.length > 0)
            {
                this.props.removeAllSelectedGallery();
            }
        }

        this.props.toggleSelecting();
    }

    /**
     * Show remaining tagged photos count to upload
     * Reset to 0 when press upload
     */
    _getRemainingUploadCount ()
    {
        return this.props.totalGalleryUploaded + this.props.totalSessionUploaded;
    }

    /**
     * Upload photos, 1 photo per request
     * - todo - move all this to redux.
     ** - status - images being sent across
     *** - fix progress bar percentComplete
     **** - Consider: Auto-upload any tagged images in the background once the user has pressed Confirm
     */
    uploadPhotos = async () => {

        this.props.resetGalleryToUpload(); // gallery
        this.props.resetPhotosToUpload(); // photo

        let galleryCount = 0;
        let sessionCount = 0;
        let model = '';

        model = this.props.model;

        this.props.gallery.map(item => {
            if (item.litter) galleryCount++;
        });

        this.props.photos.map(item => {
            if (item.litter) sessionCount++;
        });

        const totalCount = galleryCount + sessionCount;
        // console.log(({ totalCount }));

        // shared_actions, shared_reducer
        // updates -> this.props.totalImagesToUpload
        this.props.updateTotalCount(totalCount);

        // 2. Open Upload Modal
        this.props.toggleUpload();

        // 3. Upload Photos
        // Photo Gallery - On Device
        // this.props.totalTaggedGalleryCount > 0
        if (galleryCount > 0)
        {
            // async loop
            for (const item of this.props.gallery)
            {
                if (item.litter)
                {
                    let data = new FormData();

                    data.append('photo', {
                        // gallery
                        name: item.image.filename,
                        type: 'image/jpeg',
                        uri: item.image.uri
                    });

                    const date = moment.unix(item.timestamp).format('YYYY:MM:DD HH:mm:ss');

                    data.append('lat', item.location.latitude);
                    data.append('lon', item.location.longitude);
                    data.append('date', date);
                    data.append('presence', item.presence);
                    data.append('model', model);
                    console.log(data);

                    // console.log('Data to upload', data);

                    // need to get index dynamically because gallery.length -1 with upload
                    const myIndex = this.props.gallery.indexOf(item);
                    console.log(item);

                    // gallery_actions
                    // this makes 2 requests
                    // 1st to upload the IMAGE
                    // 2nd to upload the DATA
                    // when OLM recieves the data, it adds the processing to a queue so the user does not have to wait for a response here
                    const response = await this.props.uploadTaggedGalleryPhoto(
                        data,
                        this.props.token,
                        item.litter
                    );
                    // console.log("LeftPage - after: Image should be uploaded");
                    // console.log('Response - uploadTaggedGalleryPhotos');
                    // console.log(response);
                    if (response.message)
                    {
                        // pass item.id to delete image from users screen
                        // todo - find a way to delete the image from the users saved photos without asking for permission every time
                        //
                        this.props.galleryPhotoUploadedSuccessfully(myIndex);
                    }
                }
            }
        }

        if (this.props.totalTaggedSessionCount > 0)
        {
            // upload session photos
            // console.log("upload session photos");
            for (const item of this.props.photos)
            {
                if (item.litter)
                {
                    // console.log("Session - litter found");
                    // console.log(item);
                    let data = new FormData();

                    data.append('photo', {
                        name: item.filename,
                        type: 'image/jpeg',
                        uri: item.uri
                    });

                    data.append('lat', item.lat);
                    data.append('lon', item.lon);
                    data.append('date', item.date);
                    data.append('presence', item.presence);
                    data.append('model', model);
                    // console.log('Data to upload', data);

                    const myIndex = this.props.photos.indexOf(item);

                    // photo_actions, photos_reducer
                    const response = await this.props.uploadTaggedSessionPhotos(
                        data,
                        this.props.token,
                        item.litter
                    );

                    // console.log('Response - uploadTaggedSessionPhotos');
                    // console.log(response);
                    // decrement this.props.totalTaggedSessionCount
                    if (response.message) {
                        this.props.sessionPhotoUploadedSuccessfully(myIndex);
                    }
                }
            }
        }

        //  Last step - if all photos have been deleted, close modal
        if (this._getRemainingUploadCount() === this.props.totalImagesToUpload)
        {
            // shared_actions, reducer
            this.props.toggleUpload();
            this.props.toggleThankYou();
            // photos_actions
            this.props.resetSessionCount();
            // gallery_actions
            this.props.resetGalleryCount();
        }

        setTimeout(() => {
          AsyncStorage.setItem('openlittermap-photos', JSON.stringify(this.props.photos));
          AsyncStorage.setItem('openlittermap-gallery', JSON.stringify(this.props.gallery));
        }, 1000);
    };

    /**
     *
     */
    _toggleThankYou ()
    {
        this.props.toggleThankYou();
    }

}

const styles = {
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flex: 1,
        height: SCREEN_HEIGHT * 0.1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomBarContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%'
    },
    container: {
        flex: 1,
        backgroundColor: '#2ecc71'
    },
    iconPadding: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 5,
        paddingBottom: 5,
        alignItems: 'center',
        justifyContent: 'center'
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
        galleryUploadProgress: state.gallery.galleryUploadProgress,
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
        totalSessionUploaded: state.photos.totalSessionUploaded,
        thankYouVisible: state.shared.thankYouVisible,
        totalImagesToUpload: state.shared.totalImagesToUpload,
        totalTaggedGalleryCount: state.gallery.totalTaggedGalleryCount,
        totalTaggedSessionCount: state.photos.totalTaggedSessionCount,
        uploadVisible: state.shared.uploadVisible,
        uniqueValue: state.shared.uniqueValue,
        user: state.auth.user,
        webImagesCount: state.web.count,
        //webNextImage: state.web.nextImage
        webPhotos: state.web.photos
    };
};

export default connect(
    mapStateToProps,
    actions
)(LeftPage);
