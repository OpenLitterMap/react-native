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
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import { TransText } from 'react-native-translation';

import { request, PERMISSIONS } from 'react-native-permissions';

import { Button, Header, Icon, SearchBar } from 'react-native-elements';
// import * as Progress from 'react-native-progress'

import { connect } from 'react-redux';
import * as actions from '../../actions';

import AlbumList from './library/AlbumList';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const equalWidth = SCREEN_WIDTH / 3;

// Components
import LeftPageImages from './components/LeftPageImages';
// import Stats from './components/Stats'
import LitterPicker from './LitterPicker';

import moment from 'moment';

class LeftPage extends PureComponent {
  constructor(props) {
    super(props);
    // Bind any functions that call props
    this.toggleSelecting = this.toggleSelecting.bind(this);
    // this.renderDeleteButton = this.renderDeleteButton.bind(this);
    // this.renderGalleryItem = this.renderGalleryItem.bind(this);
    // this.galleryItemPressed = this.galleryItemPressed.bind(this);

    // If the app is below a certain version, delete stored data.

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
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // console.log('Next props - left page.gallery', nextProps.gallery);
    // If the user does not exist, the user has logged out.
    if (!nextProps.user) {
      // console.log('left page- user does not exist');
      this.props.navigation.navigate('Auth');
      return;
    }
  }

  /**
   * Check for images on the web app when this page loads
   */
  async componentDidMount() {
    // web_actions, web_reducer
    await this.props.checkForImagesOnWeb(this.props.token);
  }

  /**
   *
   */
  _toggleUpload() {
    this.props.toggleUpload();

    // cancel pending uploads
  }

  render() {
    console.log('LeftPage.render');
    if (this.props.imageBrowserOpen) {
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
            visible={this.props.modalVisible}>
            {/* Upload Photos */}
            {this.props.uploadVisible && (
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

                <Button
                  onPress={this._toggleUpload.bind(this)}
                  title="Cancel"
                />
              </View>
            )}

            {/* Tag Litter to Images */}
            {this.props.litterVisible && (
              <View style={styles.litterModal}>
                <LitterPicker />
              </View>
            )}

            {/* Thank you modal */}
            {this.props.thankYouVisible && (
              <View style={styles.modal}>
                <View style={styles.thankYouModalInner}>
                  <TransText
                    style={{ fontSize: SCREEN_HEIGHT * 0.02, marginBottom: 5 }}
                    dictionary={`${lang}.leftpage.thank-you`}
                  />

                  <TransText
                    style={{ fontSize: SCREEN_HEIGHT * 0.02, marginBottom: 5 }}
                    dictionary={`${lang}.leftpage.you-have-uploaded`}
                    values={{ count: this.props.totalImagesToUpload }}
                  />

                  <View style={{ flexDirection: 'row' }}>
                    <TouchableWithoutFeedback
                      onPress={this._toggleThankYou.bind(this)}>
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
            )}
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

          <View style={styles.bottomContainer}>
            {this.renderBottomTabBar()}
          </View>
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
   * Open Photo Gallery by changing state
   * @props gallery_actions, gallery_reducer
   */
  loadGallery = async () => {
    this.props.setImagesLoading(true);

    let p = Platform.OS === 'android' ? PERMISSIONS.ANDROID : PERMISSIONS.IOS;

    request(p.CAMERA).then(result => {
      if (result === 'granted') {
        this.props.toggleImageBrowser(true);
      }
    });
  };

  /**
   * Render Bottom Tab Bar = A || B
   */
  renderBottomTabBar() {
    if (this.props.isSelecting) {
      if (this.props.selected > 0) {
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
              <TransText
                style={styles.normalText}
                dictionary={`${this.props.lang}.leftpage.delete`}
              />
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <TransText
          dictionary={`${this.props.lang}.leftpage.select-to-delete`}
        />
      );
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
            <TransText
              style={styles.normalText}
              dictionary={`${this.props.lang}.leftpage.photos`}
            />
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
  renderUploadButton() {
    if (this.props.photos.length === 0 && this.props.gallery.length === 0)
      return;

    let tagged = 0;
    this.props.photos.map(photo => {
      if (Object.keys(photo.tags).length > 0) tagged++;
    });

    this.props.gallery.map(gall => {
      if (Object.keys(gall.tags).length > 0) tagged++;
    });

    if (tagged === 0) return;

    return (
      <TouchableWithoutFeedback onPress={this.uploadPhotos}>
        <View style={styles.iconPadding}>
          <Icon name="backup" size={SCREEN_HEIGHT * 0.04} color="#00aced" />
          <TransText
            style={styles.normalText}
            dictionary={`${this.props.lang}.leftpage.upload`}
          />
        </View>
      </TouchableWithoutFeedback>
    );
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
              dictionary={`${this.props.lang}.leftpage.press-upload`}
            />
          );
        }
      }

      for (let i = 0; i < this.props.photos.length; i++) {
        if (this.props.photos[i].hasOwnProperty('litter')) {
          return (
            <TransText
              style={styles.normalText}
              dictionary={`${this.props.lang}.leftpage.press-upload`}
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
   * Show remaining tagged photos count to upload
   * Reset to 0 when press upload
   */
  _getRemainingUploadCount() {
    return (
      this.props.totalGalleryUploaded + this.props.totalCameraPhotosUploaded
    );
  }

  /**
   * Upload photos, 1 photo per request
   *
   * - status - images being sent across
   * - fix progress bar percentComplete
   * - Consider: Auto-upload any tagged images in the background once the user has pressed Confirm
   */
  uploadPhotos = async () => {
    this.props.resetGalleryToUpload(); // gallery.totalTaggedGalleryCount
    this.props.resetPhotosToUpload(); // photos.totalCameraPhotosUploaded

    let galleryCount = 0;
    let cameraPhotosCount = 0;
    const model = this.props.model;

    this.props.gallery.map(item => {
      if (Object.keys(item.tags).length > 0) galleryCount++;
    });

    this.props.photos.map(item => {
      if (Object.keys(item.tags).length > 0) cameraPhotosCount++;
    });

    const totalCount = galleryCount + cameraPhotosCount;

    // shared.js
    this.props.updateTotalCount(totalCount); // this.props.totalImagesToUpload

    // shared.js
    this.props.toggleUpload();

    if (galleryCount > 0) {
      // async loop
      // upload gallery photos
      for (const img of this.props.gallery) {
        if (Object.keys(img.tags).length > 0) {
          let galleryToUpload = new FormData();

          galleryToUpload.append('photo', {
            name: img.filename,
            type: 'image/jpeg',
            uri: img.uri
          });

          const date = moment.unix(img.timestamp).format('YYYY:MM:DD HH:mm:ss');

          galleryToUpload.append('lat', img.lat);
          galleryToUpload.append('lon', img.lon);
          galleryToUpload.append('date', date);
          galleryToUpload.append('presence', img.picked_up);
          galleryToUpload.append('model', model);

          const myIndex = this.props.gallery.indexOf(img);

          // gallery.js
          const response = await this.props.uploadPhoto(
            this.props.token,
            galleryToUpload
          );

          if (response.success) {
            // upload the tags
            const resp = await this.props.uploadTags(
              this.props.token,
              img.tags
            );

            if (resp.success) {
              // Remove the image
              this.props.galleryPhotoUploadedSuccessfully(myIndex);
            }
          }
        }
      }
    }

    if (cameraPhotosCount > 0) {
      // upload olm-camera photos
      // async loop
      for (const img of this.props.photos) {
        if (Object.keys(img.tags).length > 0) {
          let cameraPhoto = new FormData();

          cameraPhoto.append('photo', {
            name: img.filename,
            type: 'image/jpeg',
            uri: img.uri
          });

          cameraPhoto.append('lat', img.lat);
          cameraPhoto.append('lon', img.lon);
          cameraPhoto.append('date', img.date);
          cameraPhoto.append('presence', img.presence);
          cameraPhoto.append('model', model);

          const myIndex = this.props.photos.indexOf(img);

          // photos.js
          const response = await this.props.uploadPhoto(
            this.props.token,
            cameraPhoto
          );

          if (response.success) {
            const resp = await this.props.uploadTags(
              this.props.token,
              img.tags
            );

            if (resp.success) {
              this.props.cameraPhotoUploadedSuccessfully(myIndex);
            }
          }
        }
      }
    }

    //  Last step - if all photos have been deleted, close modal
    if (this._getRemainingUploadCount() === this.props.totalImagesToUpload) {
      // shared_actions, reducer
      this.props.toggleUpload();
      this.props.toggleThankYou();
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
    webPhotos: state.web.photos
  };
};

export default connect(
  mapStateToProps,
  actions
)(LeftPage);
