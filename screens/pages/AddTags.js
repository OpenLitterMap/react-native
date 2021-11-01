import React, { PureComponent } from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    View
} from 'react-native';
import { TransText } from 'react-native-translation';
import { Icon } from 'react-native-elements';
import Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import * as actions from '../../actions';

import CATEGORIES from './data/categories';

import LitterCategories from './components/LitterCategories';
import LitterImage from './components/LitterImage';
import LitterPickerWheels from './components/LitterPickerWheels';
import LitterTags from './components/LitterTags';
import LitterBottomSearch from './components/LitterBottomSearch';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import DeviceInfo from 'react-native-device-info';
import LITTERKEYS from './data/litterkeys';
const cloneDeep = require('clone-deep');

class AddTags extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            webLoading: false,
            keyboardOpen: false,
            bottomHeight: 0,
            topPadding: 0,
            height: 0
        };

        this.closeKeyboardAndroid = this.closeKeyboardAndroid.bind(this);
    }

    /**
     *
     */
    UNSAFE_componentWillMount() {
        if (this.props.rightPage) {
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
    async componentDidMount() {
        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === 'android') {
            await this.setState({ height: SCREEN_HEIGHT * 0.1 });
        }

        this.keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            this._keyboardDidShow.bind(this)
        );
        this.keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            this._keyboardDidHide.bind(this)
        );
    }

    /**
     * Cancel event listeners
     */
    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    /**
     * Set params when keyboard has been opened to show bottom nav panel
     * We need to change the height-offset based on device type
     */
    _keyboardDidShow(e) {
        let height = 0;
        let bottomHeight = 0; // Height on the "suggested tags" container

        if (Platform.OS === 'android') {
            height = 0;
            bottomHeight = 0;
        } else {
            // if "iPhone 10+"
            let x = DeviceInfo.getModel().split(' ')[1];

            bottomHeight = 0.2025;

            if (x.includes('X') || parseInt(x) >= 10) {
                height = 0.345;
            }
            // iPhone 5,6,7,8
            else {
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
    _keyboardDidHide() {
        let height = 0;

        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === 'android') {
            height = SCREEN_HEIGHT * 0.1;
        }

        // we need to reset item for currently selected category
        if (this.props.category.hasOwnProperty('title')) {
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
    _closeModal() {
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
    hideBottomContainer() {
        return this.state.keyboardOpen ? styles.hide : styles.bottomContainer;
    }

    /**
     * If we are an Android, we need to close the keyboard programatically
     *
     * as onClickOutside is not working yet
     */
    closeKeyboardAndroid() {
        if (Platform.OS === 'android') {
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
    };

    /**
     * The LitterPicker component
     */
    render() {
        const { lang, swiperIndex } = this.props;

        const IMAGES_COUNT = this.props.images.length;

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
                        index={swiperIndex}
                        loop={false}
                        showsPagination={false}
                        keyboardShouldPersistTaps="handled"
                        ref="imageSwiper"
                        onIndexChanged={index =>
                            this.swiperIndexChanged(index)
                        }>
                        {this._renderLitterImage()}
                    </Swiper>

                    {/* Third - Tags. position: absolute */}
                    <LitterTags
                        tags={this.props.images[this.props.swiperIndex]?.tags}
                        previousTags={this.props.previousTags}
                        positions={this.props.positions}
                        item={this.props.item}
                        keyboardOpen={this.state.keyboardOpen}
                        lang={this.props.lang}
                        swiperIndex={swiperIndex}
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

                        {/* 4.2 - <- Previous Image || Add Tags || Next Image -> */}
                        <View style={this._computeButtonsContainer()}>
                            {/* When swiperIndex is 0, don't show the previousImageArrow */}
                            {swiperIndex === 0 && (
                                <View style={{ flex: 0.15 }} />
                            )}
                            {/* Only show previousImage when swiperIndex is greater than 0 */}
                            {swiperIndex > 0 && (
                                <TouchableOpacity
                                    onPress={this.previousImage.bind(this)}
                                    style={styles.tabArrowIconContainer}>
                                    <Icon
                                        name="arrow-back"
                                        size={SCREEN_HEIGHT * 0.05}
                                    />
                                </TouchableOpacity>
                            )}

                            {/* 4.2.2 - Add Tag or Increment Quantity */}
                            <TouchableOpacity
                                onPress={this.addTag.bind(this)}
                                style={styles.addTagButtonOuter}
                                disabled={this.props.images.length === 0}>
                                <View style={styles.addTagButtonInner}>
                                    <Icon
                                        name="add"
                                        size={SCREEN_HEIGHT * 0.05}
                                    />
                                    <TransText
                                        style={styles.textIconStyle}
                                        dictionary={`${lang}.tag.add-tag`}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Hide the nextImageArrow  */}
                            {swiperIndex === IMAGES_COUNT - 1 && (
                                <View style={{ flex: 0.15 }} />
                            )}
                            {swiperIndex >= 0 &&
                                swiperIndex !== IMAGES_COUNT - 1 && (
                                    <TouchableOpacity
                                        onPress={this.nextImage.bind(this)}
                                        style={styles.tabArrowIconContainer}>
                                        <Icon
                                            name="arrow-forward"
                                            size={SCREEN_HEIGHT * 0.05}
                                        />
                                    </TouchableOpacity>
                                )}
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
                        swiperIndex={swiperIndex}
                    />
                </View>
                <SafeAreaView style={{ flex: 0 }} />
            </View>
        );
    }

    /**
     * Position absolute
     * bottom: pickerWheelsContainer 15%
     * bottom: iPickerWheelsContainer 12%
     *
     * @hide on Android when keyboard is open
     */
    _computePickerWheelsContainer() {
        if (this.state.keyboardOpen) {
            return styles.hide;
        }

        if (Platform.OS === 'android') {
            return styles.pickerWheelsContainer;
        }

        // if "iPhone 10+", return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) {
            return styles.iPickerWheelsContainer;
        }

        return styles.pickerWheelsContainer;
    }

    /**
     * Container for Confirm, Add Tag buttons
     * marginTop: 5%
     * if iPhoneX+ marginTop: 8%;
     *
     * @hide on Android when keyboard is open
     */
    _computeButtonsContainer() {
        if (this.state.keyboardOpen) {
            return styles.hide;
        }

        if (Platform.OS === 'android') {
            return styles.buttonsContainer;
        }

        // if iPhone 10+, return 17% card height
        let x = DeviceInfo.getModel().split(' ')[1];

        if (x.includes('X') || parseInt(x) >= 10) {
            return styles.iButtonsContainer;
        }

        return styles.buttonsContainer;
    }

    /**
     * Check length of tags object
     *
     * Return True or False
     */
    _checkCollectionLength() {
        return Object.keys(this.props.tags).length === 0;
    }

    /**
     * Show the leftArrow when the currentIndex is greater than 0
     */
    getLeftArrowContainer() {
        return this.props.swiperIndex === 0
            ? styles.hideArrowContainer
            : styles.tabArrowIconContainer;
    }

    /**
     * Load the previous image
     */
    previousImage() {
        const currentIndex = this.props.swiperIndex;

        if (currentIndex > 0) {
            this.props.swiperIndexChanged(currentIndex - 1);
        }
    }

    /**
     * Load the next image
     */
    nextImage() {
        const currentIndex = this.props.swiperIndex;

        this.props.swiperIndexChanged(currentIndex + 1);
    }

    /**
     * The user has swiped left or right across an array of all photo types.
     *
     * This function gives us the new index the user has swiped to.
     *
     *
     * @param newGlobalIndex (int): the global index across all photo types.
     */
    swiperIndexChanged = newGlobalIndex => {
        console.log('swiperIndexChanged', newGlobalIndex);

        // Without this, we get "cannot update a component from within the function body of another component"
        setTimeout(() => {
            // litter.js swiperIndex
            this.props.swiperIndexChanged(newGlobalIndex);

            // If we are browsing web photos
            // At the end of the search, we need to check to see if we need to load more images
            // Currently we are loading 10 images at a time
            // if (currentPhotoType === 'web')
            // {
            //     // If this is the last webPhoto, load more
            //     if (this.props.photoSelected.id === this.props.webPhotos[this.props.webPhotos.length -1].id)
            //     {
            //         // show loading more images from web
            //         this.props.loadMoreWebImages(this.props.token, this.props.photoSelected.id);
            //     }
            // }
        }, 0);
    };

    /**
     * Array of images to swipe through
     */

    _renderLitterImage = () => {
        // Return an array of all photos
        return this.props.images.map((image, index) => {
            // Only render one image
            if (index === this.props.swiperIndex) {
                return <LitterImage key={image.id} photoSelected={image} />;
            }

            // Otherwise, just return an empty view
            return <View key={image.id} />;
        });
    };

    /**
     * Add or Update Tags
     *
     * on a specific image
     */
    addTag() {
        const tag = {
            category: this.props.category.title.toString(),
            title: this.props.item.toString(),
            quantity: this.props.q
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;

        this.props.addTagsToImages({
            tag,
            currentIndex,
            quantityChanged: this.props.quantityChanged
        });

        this.props.changeQuantiyStatus(false);
    }
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
        width: SCREEN_WIDTH
    },
    biggerContainer: {
        alignItems: 'center',
        // backgroundColor: 'blue',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.15,
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.63
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
        height: SCREEN_HEIGHT * 0.2
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.08,
        marginTop: SCREEN_HEIGHT * 0.05
    },
    iButtonsContainer: {
        flexDirection: 'row',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.07,
        marginTop: SCREEN_HEIGHT * 0.08
    },
    addTagButtonInner: {
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 'auto',
        justifyContent: 'center',
        alignItems: 'center'
    },
    addTagButtonOuter: {
        backgroundColor: '#e67e22',
        flex: 0.7,
        zIndex: 1,
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 5
    },
    hide: {
        display: 'none'
    },
    hideArrowContainer: {
        backgroundColor: 'red',
        height: SCREEN_HEIGHT * 0.05,
        flex: 0.15
    },
    modalOuter: {
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1
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
    tabArrowIconContainer: {
        flex: 0.15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    tabBarButtonLeft: {
        backgroundColor: '#2ecc71',
        width: SCREEN_WIDTH * 0.5,
        zIndex: 1
    },
    tabBarButtonLeftDisabled: {
        display: 'none'
    },
    tabBarButtonRightDisabled: {
        backgroundColor: '#ccc',
        // borderRadius: '50%',
        marginRight: SCREEN_WIDTH * 0.04
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
        indexSelected: state.litter.indexSelected, // index of photos, gallery, web
        item: state.litter.item,
        items: state.litter.items,
        lang: state.auth.lang,
        model: state.settings.model,
        photoSelected: state.litter.photoSelected,
        photoType: state.litter.photoType,
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
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged,
        // webImages: state.web.images,
        // webNextImage: state.web.nextImage,
        webImagesCount: state.web.count,
        webPhotos: state.web.photos,
        webImageSuccess: state.web.webImageSuccess,
        images: state.images.images
    };
};

export default connect(
    mapStateToProps,
    actions
)(AddTags);
