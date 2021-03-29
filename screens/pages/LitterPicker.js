import React, { PureComponent, useEffect } from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    SafeAreaView,
    StatusBar,
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { TransText } from "react-native-translation";
import { Icon } from 'react-native-elements'
import Swiper from 'react-native-swiper'
import { connect } from 'react-redux'
import * as actions from '../../actions'

import CATEGORIES from './data/categories'

import LitterCategories from './components/LitterCategories'
import LitterImage from './components/LitterImage'
import LitterPickerWheels from './components/LitterPickerWheels'
import LitterTags from './components/LitterTags'
import LitterBottomSearch from './components/LitterBottomSearch'

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

import DeviceInfo from 'react-native-device-info'
import LITTERKEYS from "./data/litterkeys";
const cloneDeep = require('clone-deep')

class LitterPicker extends PureComponent
{
    constructor (props)
    {
        super(props);

        this.state = {
            loading: false,
            webLoading: false,
            keyboardOpen: false,
            bottomHeight: 0,
            topPadding: 0,
            height: 0,
            // swiperIndex: 0
        };

        this._checkForPhotos = this._checkForPhotos.bind(this);
        this.closeKeyboardAndroid = this.closeKeyboardAndroid.bind(this);
    }

    /**
     *
     */
    UNSAFE_componentWillMount ()
    {
        if (this.props.rightPage)
        {
            this.setState({
                loading: true
            });
        }
    }

    /**
     * Check if the user has any photos on web
     * @photo_actions.js
     */
    async componentDidMount ()
    {
        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === "android") await this.setState({ height: SCREEN_HEIGHT * 0.1 });

        if (this.state.loading) await this.props.checkForWebUpload(this.props.token);

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));

        // tamara/swipe-images
        const photos = [].concat(this.props.photos, this.props.gallery, this.props.webPhotos);

        photos.forEach((photo, index) => {

            // console.log({ photo });

            // null is coming through here somewhere. Maybe from web?
            if (photo)
            {
                if (photo.type === "image")
                {
                    if (photo.image.filename === this.props.photoSelected.filename)
                    {
                        this.props.swiperIndexChanged(index);
                    }
                }
                else
                {
                    if (photo.filename === this.props.photoSelected.filename)
                    {
                        this.props.swiperIndexChanged(index);
                    }
                }
            }
        });
    }

    /**
     * Cancel event listeners
     */
    componentWillUnmount ()
    {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    /**
     * Set params when keyboard has been opened to show bottom nav panel
     * We need to change the height-offset based on device type
     */
    _keyboardDidShow (e)
    {
        let height = 0;
        let bottomHeight = 0; // Height on the "suggested tags" container

        if (Platform.OS === 'android')
        {
            height = 0;
            bottomHeight = 0;
        }

        else
        {
            // if "iPhone 10+"
            let x = DeviceInfo.getModel().split(' ')[1];

            bottomHeight = 0.2025;

            if (x.includes('X') || parseInt(x) >= 10)
            {
                height = 0.345;
            }

            // iPhone 5,6,7,8
            else
            {
                height = 0.39;
            }
        }

        height = height * SCREEN_HEIGHT;
        bottomHeight = bottomHeight * SCREEN_HEIGHT;

        this.setState({
            keyboardOpen: true,
            bottomHeight: bottomHeight,
            height: height
        });
    }

    /**
     * Set params when keyboard has been closed to hide bottom nav panel
     *
     * 2 bugs here
     *
     * 1. On android, we need to set height of keyboardAvoidingView to 10% screen height when closed...not sure why
     *
     * 2. When a tag is set from the keyboard, the tag.key changes (eg "facemask") but the category does not change.
     *    onKeyboardClose, we need to reset tag.key to the first item of the currently selected category
     */
    _keyboardDidHide ()
    {
        let height = 0;

        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === "android") height = SCREEN_HEIGHT * 0.1;

        // we need to reset item for currently selected category
        if (this.props.category.hasOwnProperty('title'))
        {
            const first = LITTERKEYS[this.props.category.title][0];

            this.props.changeItem(first);
        }

        this.setState({
            keyboardOpen: false,
            bottomHeight: 0,
            height
        });
    }

    /**
     * Close the modal and all content types
     */
    _closeModal ()
    {
        this.props.setLitterPickerModal(false);

        this.props.showAllTags(false);

        this.setState({
            webLoading: false
        });
    }

    /**
     * This container is showing on Android when the board is open
     * We can hide it here
     */
    hideBottomContainer ()
    {
        return this.state.keyboardOpen ? styles.hide : styles.bottomContainer;
    }

    /**
     * If we are an Android, we need to close the keyboard programatically
     *
     * as onClickOutside is not working yet
     */
    closeKeyboardAndroid ()
    {
        if (Platform.OS === 'android')
        {
            this.setState({
                keyboardOpen: false
            });

            Keyboard.dismiss();
        }
    }

    /**
     * A category card has been clicked
     *
     * This is a callback function from LitterCategories
     */
    categoryClicked = () => {
        this.closeKeyboardAndroid();
    }

    /**
     * The LitterPicker component
     */
    render ()
    {
        console.log('LitterPicker.render');
        const { lang } = this.props;

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.container}>
                    <StatusBar hidden />

                    {/*<Modal*/}
                    {/*    animationType="slide"*/}
                    {/*    transparent={true}*/}
                    {/*    visible={this.props.tagsModalVisible}*/}
                    {/*>*/}
                    {/*    <View style={styles.modalOuter}>*/}
                    {/*        {*/}
                    {/*            this.state.webLoading && (*/}
                    {/*                <ActivityIndicator />*/}
                    {/*            )*/}
                    {/*        }*/}
                    {/*    </View>*/}
                    {/*</Modal>*/}

                    {/* First - Top Bar position: 'absolute'  */}
                    <LitterCategories
                        categories={CATEGORIES}
                        category={this.props.category}
                        lang={this.props.lang}
                        callback={this.categoryClicked}
                    />

                    {/* Second - Image. Height: 80% */}
                    <Swiper
                        index={this.props.swiperIndex}
                        loop={false}
                        showsPagination={false}
                        keyboardShouldPersistTaps="handled"
                        ref="imageSwiper"
                        onIndexChanged={(index) => this.swiperIndexChanged(index)}
                    >{ this._renderLitterImage() }</Swiper>

                    {/* Third - Tags. position: absolute */}
                    <LitterTags
                        tags={this.props.tags}
                        previousTags={this.props.previousTags}
                        positions={this.props.positions}
                        item={this.props.item}
                        keyboardOpen={this.state.keyboardOpen}
                        lang={this.props.lang}
                    />

                    {/* Fourth - bottomContainer 20% height */}
                    <View style={styles.bottomContainer}>

                        {/* 4.1 - LitterPickerWheels */}
                        <View style={this._computePickerWheelsContainer()}>
                            <LitterPickerWheels
                                item={this.props.item}
                                items={this.props.items}
                                model={this.props.model}
                                category={this.props.category}
                                q={this.props.q}
                                lang={this.props.lang}
                            />
                        </View>

                        {/* 4.2 - Confirm Data | Add Tags */}
                        <View style={this._computeButtonsContainer()}>
                            {/* 4.2.1 - Confirm -> Load next photo or close LitterPicker modal */}
                            <TouchableHighlight
                                onPress={this._confirmData.bind(this)}
                                style={styles.tabBarButtonLeft}
                                //disabled={this._checkCollectionLength()}
                            >
                                <View style={styles.innerButtonContainer}>
                                    <Icon name="check" size={SCREEN_HEIGHT * 0.05} />
                                    <TransText style={styles.textIconStyle} dictionary={`${lang}.tag.confirm`} />
                                </View>
                            </TouchableHighlight>

                            {/* 4.2.2 - Add Tag or Increment Quantity */}
                            <TouchableHighlight
                                onPress={this.addTag.bind(this)}
                                style={styles.tabBarButtonRight}
                                disabled={this._checkForPhotos()}
                            >
                                <View style={styles.innerButtonContainer}>
                                    <Icon name="add" size={SCREEN_HEIGHT * 0.05} />
                                    <TransText style={styles.textIconStyle} dictionary={`${lang}.tag.add-tag`} />
                                </View>
                            </TouchableHighlight>
                        </View>
                    </View>

                    <LitterBottomSearch
                        keyboardOpen={this.state.keyboardOpen}
                        suggestedTags={this.props.suggestedTags}
                        height={this.state.height}
                        bottomHeight={this.state.bottomHeight}
                        presence={this.props.presence}
                        lang={this.props.lang}
                    />
                </View>
                <SafeAreaView style={{ flex: 0 }} />
            </View>
        );
    }

    /**
     * Return True or False
     */
    _checkForPhotos ()
    {
        return (this.props.gallery.length === 0 && this.props.photos.length === 0 && this.props.webImagesCount === 0);
    }

    /**
     * 20% height
     */
    // _computeBottomContainer ()
    // {
    //   return styles.bottomContainer
    //
    //   // if (Platform.OS === 'android') return styles.biggerBottomContainer;
    //   //
    //   // // if "iPhone 10+", return 17% card height
    //   // let x = DeviceInfo.getModel().split(' ')[1];
    //   //
    //   // if (x.includes('X') || parseInt(x) >= 10) ;
    //   //
    //   // return styles.biggerBottomContainer;
    // }

    /**
     * Position absolute
     * bottom: pickerWheelsContainer 15%
     * bottom: iPickerWheelsContainer 12%
     *
     * @hide on Android when keyboard is open
     */
    _computePickerWheelsContainer ()
    {
        if (this.state.keyboardOpen) return styles.hide;

        if (Platform.OS === 'android') return styles.pickerWheelsContainer;

        // if "iPhone 10+", return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.iPickerWheelsContainer;

        return styles.pickerWheelsContainer;
    }

    /**
     * Container for Confirm, Add Tag buttons
     * marginTop: 5%
     * if iPhoneX+ marginTop: 8%;
     *
     * @hide on Android when keyboard is open
     */
    _computeButtonsContainer ()
    {
        if (this.state.keyboardOpen) return styles.hide;

        if (Platform.OS === 'android') return styles.buttonsContainer;

        // if iPhone 10+, return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) return styles.iButtonsContainer;

        return styles.buttonsContainer;
    }

    /**
     * Check length of tags object
     *
     * Return True or False
     */
    _checkCollectionLength ()
    {
        return Object.keys(this.props.tags).length === 0;
    }

    /**
     * Event when the image was swiped Left or Right
     */
    swiperIndexChanged = (index) => {

        console.log({ index });

        const photos = [].concat(this.props.photos, this.props.gallery, this.props.webPhotos);

        let photo = photos[index];

        setTimeout(() => {

            // Necessary to put this here to avoid error
            this.props.swiperIndexChanged(index);

            // Gallery
            if (photo.type === 'image')
            {
                let item = photos[index];
                let litter = {};

                let itemIndex;
                this.props.gallery.forEach((galleryPhoto, index) => {
                    if (galleryPhoto.image.filename === item.image.filename) {
                        itemIndex = index;
                    }
                });

                if (item.litter) litter = Object.assign({}, item.litter);

                // litter_reducer
                this.props.itemSelected({
                    index: itemIndex,
                    lat: item.location.latitude,
                    lon: item.location.longitude,
                    uri: item.image.uri,
                    filename: item.image.filename,
                    timestamp: item.timestamp,
                    type: 'gallery',
                    litter // data if exists
                });
            }
            // Session, Web
            else
            {
                this.props.itemSelected(photo);
            }

            // If we are browsing web photos
            // At the end of the search, we need to check to see if we need to load more images
            // Currently we are loading 10 images at a time
            if (this.props.photoSelected.type === 'web')
            {
                // If this is the last webPhoto, load more
                if (this.props.photoSelected.id === this.props.webPhotos[this.props.webPhotos.length -1].id)
                {
                    // show loading more images from web

                    this.props.loadMoreWebImages(this.props.token, this.props.photoSelected.id);
                }
            }

        }, 0);
    }

    /**
     * Images to swipe through
     */
    _renderLitterImage = () =>
    {
        // console.log('renderLitterImage.index', this.props.swiperIndex);

        const photos = [].concat(this.props.photos, this.props.gallery, this.props.webPhotos);

        // console.log({ photos });

        return photos.map((photo, index) => {

            // Only render the one image we want
            if (index === this.props.swiperIndex)
            {
                return photo.type === "web" || photo.type === "session"
                    ? <LitterImage key={photos.length} photoSelected={photo} />
                    : <LitterImage key={photos.length} photoSelected={photo.image} />;
            }

            // Otherwise, just return an empty view
            return (
                <View key={photos.length} />
            );

        });
    }

    _renderModalContents = () =>
    {
        const items = [];

        Object.keys(this.props.tags).map(category => {

            items.push(category + ":");

            Object.keys(this.props.tags[category]).map(item => {
                items.push(item + ':' + ' ' + this.props.tags[category][item]);
            });

            items.push("\n");
        });

        return items;
    };

    /**
     * Confirm this data is ready for upload
     *
     * @Gallery = Camera_Roll,
     * @Photos  = Taken with OLM Camera this session
     * @Web     = Uploaded via web-app
     *
     * some users have settings.previous_tags true
     */
    _confirmData = async () =>
    {
        let deleteWebImageId = null;
        let tags = null;

        console.log('CONFIRM_DATA', this.props.tags);

        // The user can only confirm if tags exist
        if (Object.keys(this.props.tags).length !== 0)
        {
            tags = cloneDeep(this.props.tags);

            if (this.props.photoSelected.type === 'web')
            {
                // Turn on spinner
                await this.setState({ webLoading: true });

                // Show the modal
                await this.props.setLitterPickerModal(true);

                // Submit data to the server, web_actions.js
                // this will load the next image
                await this.props.confirmWebPhoto({
                    id: this.props.photoSelected.id,
                    tags,
                    presence: this.props.presence,
                    token: this.props.token
                });

                this.props.resetTags();

                this.props.removeWebImage(this.props.photoSelected.id);

                return;
            }

            else if (this.props.photoSelected.type === 'gallery')
            {
                // gallery_actions, gallery_reducer
                await this.props.confirmGalleryItem({
                    index: this.props.photoSelected.index,
                    data: tags,
                    presence: this.props.presence
                });
            }

            else
            {
                // photo_actions, photos_reducer
                await this.props.confirmSessionItem({
                    index: this.props.photoSelected.index,
                    data: this.props.tags,
                    presence: this.props.presence
                });
            }
        }

        // tamara/persist-image
        // async-storage photos & gallery set
        setTimeout(() => {
            AsyncStorage.setItem('openlittermap-photos', JSON.stringify(this.props.photos));
            AsyncStorage.setItem('openlittermap-gallery', JSON.stringify(this.props.gallery));
        }, 1000);

        // tamara/confirm-image
        const imageCount = this.props.photos.length + this.props.gallery.length + this.props.webPhotos.length;

        console.log({ imageCount });
        console.log('swiperIndex', this.props.swiperIndex);

        if (this.props.swiperIndex === imageCount - 1)
        {
            // litter_reducer
            this.props.resetLitterTags();
  
            // shared_reducer
            this.props.closeLitterModal();
        }
        else
        {
            this.refs.imageSwiper.scrollTo(this.props.swiperIndex + 1, true);
        }

        // probably a better way to do this...
        if (this.props.previous_tags)
        {
            setTimeout(() => {
                this.props.updateTags(tags);
            }, 500);
        }
    };

    /**
     * Add Tag or Update the Collection
     * @litter_actions @litter_reducer
     */
    addTag ()
    {
        const tags = {
            category: this.props.category.title.toString(),
            title: this.props.item.toString(),
            quantity: parseInt(this.props.q)
        };

        this.props.tagLitter(tags);
    };
}

const styles = {
    container: {
        flex: 1,
        // paddingTop: SCREEN_HEIGHT * 0.05,
        backgroundColor: 'white'
    },
    innerTagsContainer: {
        // backgroundColor: 'red',
        height: SCREEN_HEIGHT * 0.08,
        // paddingLeft: SCREEN_WIDTH * 0.05,
        // marginRight: SCREEN_WIDTH * 0.05,
        // marginBottom: - SCREEN_HEIGHT * 0.02,
        width: SCREEN_WIDTH,
    },
    biggerContainer: {
        alignItems: 'center',
        // backgroundColor: 'blue',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.15,
        position: 'absolute',
        top: SCREEN_HEIGHT * .63
        // marginTop: SCREEN_HEIGHT * 0.66,
    },

    // biggerBottomContainer: {
    //   backgroundColor: 'yellow',
    //   position: 'absolute',
    //   bottom: 0,
    //   height: SCREEN_HEIGHT * 0.2
    // },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        height: SCREEN_HEIGHT * 0.2,
    },

    buttonsContainer: {
        flexDirection: 'row',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.08,
        marginTop: SCREEN_HEIGHT * 0.05,
    },
    iButtonsContainer: {
        flexDirection: 'row',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.07,
        marginTop: SCREEN_HEIGHT * 0.08,
    },
    innerButtonContainer: {
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 'auto',
        justifyContent: 'center'
    },
    hide: {
        display: 'none'
    },
    modalOuter: {
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1,
    },
    // modalInner: {
    //     backgroundColor: 'white',
    //     padding: 50,
    //     borderRadius: 6
    // },
    modalTaggedText: {
        alignSelf: 'center',
        fontSize: SCREEN_HEIGHT * 0.02,
        paddingTop: SCREEN_HEIGHT * 0.02,
        paddingBottom: SCREEN_HEIGHT * 0.02,
        fontWeight: '600'
    },
    pickerWheelsContainer: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.15
    },
    iPickerWheelsContainer: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.12
    },
    tabBarButtonLeft: {
        backgroundColor: '#2ecc71',
        width: SCREEN_WIDTH * 0.5,
        zIndex: 1
    },
    tabBarButtonLeftDisabled: {
        display: 'none',
    },
    tabBarButtonRight: {
        backgroundColor: '#e67e22',
        width: '50%',
        zIndex: 1
    },
    tabBarButtonRightDisabled: {
        backgroundColor: '#ccc',
        // borderRadius: '50%',
        marginRight: SCREEN_WIDTH * 0.04,
        // position: 'absolute',
        // right: 0,
    },
    textIconStyle: {
        marginTop: 'auto',
        marginBottom: 'auto',
        fontSize: SCREEN_HEIGHT * 0.02,
        paddingLeft: SCREEN_WIDTH * 0.04
    }
};

const mapStateToProps = state => {
    return {
        category: state.litter.category,
        collectionLength: state.litter.collectionLength,
        currentTotalItems: state.litter.currentTotalItems,
        displayAllTags: state.litter.displayAllTags,
        gallery: state.gallery.gallery,
        galleryTaggedCount: state.gallery.galleryTaggedCount,
        galleryTotalCount: state.gallery.galleryTotalCount,
        item: state.litter.item,
        items: state.litter.items,
        lang: state.auth.lang,
        model: state.settings.model,
        photos: state.photos.photos,
        photoSelected: state.litter.photoSelected,
        positions: state.litter.positions,
        presence: state.litter.presence,
        previous_tags: state.auth.user.previous_tags,
        previousTags: state.litter.previousTags,
        suggestedTags: state.litter.suggestedTags,
        swiperIndex: state.litter.swiperIndex,
        totalLitterCount: state.litter.totalLitterCount,
        tags: state.litter.tags,
        tagsModalVisible: state.litter.tagsModalVisible,
        token: state.auth.token,
        totalTaggedGalleryCount: state.gallery.totalTaggedGalleryCount,
        totalTaggedSessionCount: state.photos.totalTaggedSessionCount,
        q: state.litter.q,
        // webImages: state.web.images,
        // webNextImage: state.web.nextImage,
        webImagesCount: state.web.count,
        webPhotos: state.web.photos,
        webImageSuccess: state.web.webImageSuccess
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterPicker);
