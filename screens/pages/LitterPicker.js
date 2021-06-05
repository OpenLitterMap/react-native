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
     *
     * @photo_actions.js
     */
    async componentDidMount ()
    {
        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === "android") await this.setState({ height: SCREEN_HEIGHT * 0.1 });

        if (this.state.loading) await this.props.checkForWebUpload(this.props.token);

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));
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

                    {/* 4.3 - Bottom Input - Search All Tags */}
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
     *
     * this.props.photos = from in-app camera
     */
    swiperIndexChanged = (index) => {

        // console.log('swiperIndexChanged', index);

        const photos = [].concat(this.props.photos, this.props.gallery, this.props.webPhotos);

        const photo = photos[index];

        let image = null;

        setTimeout(() => {

            // This was necessary to avoid error
            // litter.js swiperIndex
            this.props.swiperIndexChanged(index);

            // Camera
            if (photo.type === 'camera')
            {
                image = this.props.photos[index];
            }
            // Gallery
            else if (photo.type === 'gallery')
            {
                const galleryIndex = index - this.props.photos.length;

                image = this.props.gallery[galleryIndex];
            }
            // Web
            else if (photo.type === 'web')
            {
                const webIndex = index - this.props.photos.length - this.props.gallery.length;

                image = this.props.webPhotos[webIndex];
            }

            this.props.photoSelectedForTagging({
                swiperIndex: index,
                image
            });

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
     * Array of images to swipe through
     *
     * this.props.swiperIndex is the current index across all available photo types
     *
     * this.props.photos are from the in-app camera
     * this.props.gallery are selected from the users photo album
     * this.props.webPhotos were uploaded to web and in the app for tagging
     */
    _renderLitterImage = () =>
    {
        // Put all the data we want to display into an array
        const photos = [].concat(this.props.photos, this.props.gallery, this.props.webPhotos);

        // Return an array of all photos
        return photos.map((photo, index) => {

            // Only render one image
            if (index === this.props.swiperIndex)
            {
                return <LitterImage key={photos.length} photoSelected={photo} />;
            }

            // Otherwise, just return an empty view
            return (
                <View key={photos.length} />
            );
        });
    }

    /**
     * Confirm this data is ready for upload
     *
     * this.props.photos are from the in-app camera
     * this.props.gallery are selected from the users photo album
     * this.props.webPhotos were uploaded to web and in the app for tagging
     *
     * some users have settings.previous_tags true
     */
    _confirmData = async () =>
    {
        const swiperIndex = this.props.swiperIndex;

        // Some users want to copy the tags onto the next image, so we need to clone them
        const tags = cloneDeep(this.props.tags);

        // The user can only confirm if tags exist
        if (Object.keys(this.props.tags).length > 0)
        {
            if (this.props.photoSelected.type === 'web')
            {
                // Turn on spinner
                await this.setState({ webLoading: true });

                // Show the modal
                await this.props.setLitterPickerModal(true);

                // Submit data to the server, web_actions.js
                await this.props.confirmWebPhoto({
                    id: this.props.photoSelected.id,
                    tags,
                    presence: this.props.presence,
                    token: this.props.token
                });

                // web.js - filter out the current image by ID and decrement web.count
                // this.props.photoSelected needs to be updated
                this.props.removeWebImage(this.props.photoSelected.id);

                // update this.props.photoSelected with the next image
                if (this.props.webPhotos.length > 0)
                {
                    const nextWebPhoto = this.props.webPhotos[0];

                    if (nextWebPhoto)
                    {
                        this.props.photoSelectedForTagging({
                            swiperIndex,
                            image: nextWebPhoto
                        });

                        if (this.props.previous_tags)
                        {
                            this.props.updateTags(tags);
                        }
                        else
                        {
                            this.props.resetTags();
                        }

                        return;
                    }
                }
            }
            else if (this.props.photoSelected.type === 'gallery')
            {
                const galleryIndex = swiperIndex - this.props.photos.length;

                // gallery_actions, gallery_reducer
                await this.props.confirmGalleryTags({
                    index: galleryIndex,
                    tags,
                    picked_up: this.props.presence
                });
            }
            else if (this.props.photoSelected.type === 'camera')
            {
                // photo_actions, photos_reducer
                await this.props.confirmSessionTags({
                    index: swiperIndex,
                    tags,
                    picked_up: this.props.presence
                });
            }
        }

        // Store remaining images in-case app closes or crashes
        setTimeout(() => {
            AsyncStorage.setItem('openlittermap-photos', JSON.stringify(this.props.photos));
            AsyncStorage.setItem('openlittermap-gallery', JSON.stringify(this.props.gallery));
        }, 1000);

        // swipe in the next image
        const imageCount = this.props.photos.length + this.props.gallery.length + this.props.webPhotos.length;

        if (imageCount === 0 || this.props.swiperIndex + 1 === imageCount)
        {
            // litter_reducer
            this.props.resetLitterTags();

            // shared_reducer
            this.props.closeLitterModal();
        }
        else
        {
            this.refs.imageSwiper.scrollTo(this.props.swiperIndex + 1, true);

            // Some users want to apply the same tags to the next image
            // this.props.previous_tags is a setting saved to the user
            // probably a better way to do this...
            if (this.props.previous_tags)
            {
                setTimeout(() => {
                    this.props.updateTags(tags);
                }, 500);
            }
        }
    };

    /**
     * Add Tag or Update the Collection
     *
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
        indexSelected: state.litter.indexSelected, // index of photos, gallery, web
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
