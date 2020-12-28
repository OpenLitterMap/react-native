import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableHighlight,
    View
} from 'react-native'

import { Button, Icon } from 'react-native-elements'
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
            height: 0
        };

        this._checkForPhotos = this._checkForPhotos.bind(this);
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

            console.log({ x });

            if (x.includes('X') || parseInt(x) >= 10)
            {
                height = 0.2;
                bottomHeight = 0.3; // was 0.35
            }

            // iPhone 5,6,7,8
            else
            {
                // TD - if (parseInt(x) === 8)...
                height = 0; // 0.2425;
                bottomHeight = 0.35;
            }
        }

        console.log({ height });
        console.log({ bottomHeight });

        this.setState({
            keyboardOpen: true,
            bottomHeight: SCREEN_HEIGHT * bottomHeight,
            height: SCREEN_HEIGHT * height
        });
    }

    /**
     * Set params when keyboard has been closed to hide bottom nav panel
     *
     * Bug with android that we can fix by setting height of keyboardAvoidingView to 10% screen height when closed *shrugs*
     */
    _keyboardDidHide ()
    {
        let height = 0;

        // this is necessary to allow the user to click on text input because of a bug with keyboardAvoidingView on Android
        if (Platform.OS === "android") height = SCREEN_HEIGHT * 0.1;

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
     * The LitterPicker component
     */
    render ()
    {
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
                    <LitterCategories categories={CATEGORIES} category={this.props.category} />

                    {/* Second - Image. Height: 80% */}
                    <LitterImage
                        photos={this.props.photos}
                        gallery={this.props.gallery}
                        webImages={this.props.webImages}
                        photoSelected={this.props.photoSelected}
                    />

                    {/* Third - Tags. position: absolute */}
                    <LitterTags
                        tags={this.props.tags}
                        previousTags={this.props.previousTags}
                        positions={this.props.positions}
                        item={this.props.item}
                        keyboardOpen={this.state.keyboardOpen}
                    />

                    {/* Fourth - bottomContainer 20% height */}
                    <View style={styles.bottomContainer}>

                        {/* 4.1 - LitterPickerWheels */}
                        <View style={this._computePickerWheelsContainer()}>
                            <LitterPickerWheels
                                item={this.props.item}
                                items={this.props.items}
                                model={this.props.model}
                                q={this.props.q}
                            />
                        </View>

                        {/* 4.2 - Confirm Data | Add Tags */}
                        <View style={this._computeButtonsContainer()}>
                            {/* 4.2.1 - Confirm -> Load next photo or close LitterPicker modal */}
                            <TouchableHighlight
                                onPress={this._confirmData.bind(this)}
                                style={styles.tabBarButtonLeft}
                                disabled={this._checkCollectionLength()}
                            >
                                <View style={styles.innerButtonContainer}>
                                    <Icon name="check" size={SCREEN_HEIGHT * 0.05} />
                                    <Text style={styles.textIconStyle}>Confirm</Text>
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
                                    <Text style={styles.textIconStyle}>Add Tag</Text>
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
        return (this.props.gallery.length === 0 && this.props.photos.length === 0 && this.props.webImages.length === 0);
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

    _renderModalContents = () =>
    {
        const items = [];

        Object.keys(this.props.tags).map(category => {
            items.push(category + ":");
            Object.keys(this.props.tags[category]).map(item => {
                items.push(
                    item + ':' + ' ' + this.props.tags[category][item]
                );
            });
            items.push("\n");
        });

        return items;
    };

    /**
     * Confirm this data is ready for upload
     * @Gallery = Camera_Roll,
     * @Photos  = Taken with OLM Camera this session
     * @Web     = Uploaded via web-app
     * some users have settings.previous_tags true
     */
    _confirmData = async () =>
    {
        // The user can only confirm if tags exist
        if (Object.keys(this.props.tags).length === 0) return;

        let tags = cloneDeep(this.props.tags);

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

            // Check if there is another image to load
            if (this.props.webImages.length > 0)
            {
                let item = this.props.webImages[0];
                item.uri = this.props.webImages[0].filename;
                item.type = 'web';
                item.litter = {};

                if (this.props.previous_tags)
                {
                    item.litter = cloneDeep(tags);
                }

                // litter_actions
                // Note, other actions are using slideInNext
                this.props.itemSelected(item);

                // Loading off web_actions
                await this.setState({ webLoading: false });

                // close the waiting modal
                await this.props.setLitterPickerModal(false);

                return;
            }

            // Loading off
            await this.setState({ webLoading: false });
        }

        else if (this.props.photoSelected.type === 'gallery')
        {
            // gallery_actions, gallery_reducer
            await this.props.confirmGalleryItem({
                index: this.props.photoSelected.index,
                data: tags,
                presence: this.props.presence
            });

            // Problem - Some components re-render here
            // Slide in next image, or return
            // todo, slide animation
            // todo swipe left & right between images
            let gal = this._checkForNextGalleryPhoto(tags);

            if (gal) return;
        }

        else
        {
            // photo_actions, photos_reducer
            await this.props.confirmSessionItem({
                index: this.props.photoSelected.index,
                data: this.props.tags,
                presence: this.props.presence
            });

            // litter_actions, litter_reducer
            // await this.props.savePreviousTags(this.props.tags);

            let val = this._checkForNextSessionPhoto(tags);
            // console.log('After Session', val);
            if (val) return;
        }

        // console.log('After check Gallery + Session');

        // todo - no need to map over Gallery or Session again/
        //      - find a better way to map over Session if gallery completed, visa versa
        // this._checkForNextGalleryPhoto();
        // this._checkForNextSessionPhoto();

        // If no Gallery or Session items are available, close the LitterPicker Modal.
        // this.props.resetLitterObjectAndCloseModal();

        // if it's a modal, close it
        // but if its not a modal........ navigate to uploads?
        // LitterPicker is not a modal on RightPage.js
        this.props.toggleLitter();
        // this.props.closeLitterModal();
        // this.props.acceptDataAndCloseModal();
    };

    /**
     * Look for a gallery photo that is not tagged
     * todo -> slideIn animation
     * todo -> find a more efficient way of finding the next item that doesn't have a litter object
     *        eg maintain list of tagged and untagged images
     */
    _checkForNextGalleryPhoto (tags)
    {
        if (this.props.totalTaggedGalleryCount < this.props.galleryTotalCount)
        {
            for (let i = 0; i < this.props.gallery.length; i++)
            {
                if (! this.props.gallery[i].litter)
                {
                    let item = {
                        index: i,
                        lat: this.props.gallery[i].location.latitude,
                        lon: this.props.gallery[i].location.longitude,
                        uri: this.props.gallery[i].image.uri,
                        filename: this.props.gallery[i].image.filename,
                        timestamp: this.props.gallery[i].timestamp,
                        type: 'gallery',
                        litter: {}
                    };

                    // let tags = {...this.props.tags};
                    if (this.props.previous_tags) {
                        item.litter = cloneDeep(tags);
                    }

                    // litter_actions, litter_reducer
                    // this.props.itemSelected(item); // todo -> animate
                    // this.props.slideInNext(item);
                    this.props.itemSelected({
                        index: item.index,
                        lat: item.lat,
                        lon: item.lon,
                        uri: item.uri,
                        filename: item.filename,
                        timestamp: item.timestamp,
                        type: 'gallery',
                        litter: item.litter // data if exists
                    });

                    return true;
                }
            }
            // console.log('loop over gallery finished - all items have litter object.');
            return false;
        }
        // console.log("totalTaggedGalleryCount ! < props.gallery.length");
        return false;
    }

    /**
     * Check for a session photo that is not tagged
     */
    _checkForNextSessionPhoto (tags)
    {
        // todo Slide in next image
        for (let i = 0; i < this.props.photos.length; i++)
        {
            if (! this.props.photos[i].litter)
            {
                // litter_actions / reducer
                let item = this.props.photos[i];
                item.index = i;
                item.litter = {};

                // If user.previous_tags is true, load them on the next image
                if (this.props.previous_tags) {
                    item.litter = cloneDeep(tags);
                }


                // was slideInNext
                this.props.itemSelected(item); // todo -> animate
                return true;
            }
        }

        return false;
    }

    /**
     * Add Tag or Update the Collection
     * @litter_actions @litter_reducer
     */
    addTag ()
    {
        const tags = {
            category: this.props.category,
            title: this.props.item,
            quantity: this.props.q
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
        width: SCREEN_WIDTH * 1,
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
        backgroundColor: 'yellow',
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
    iTagsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.15,
        position: 'absolute',
        top: SCREEN_HEIGHT * .63
    },
    iTagsContainerOpen: {
        alignItems: 'center',
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.15,
        position: 'absolute',
        top: SCREEN_HEIGHT * .33
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
        model: state.settings.model,
        photos: state.photos.photos,
        photoSelected: state.litter.photoSelected,
        positions: state.litter.positions,
        presence: state.litter.presence,
        previous_tags: state.auth.user.previous_tags,
        previousTags: state.litter.previousTags,
        suggestedTags: state.litter.suggestedTags,
        totalLitterCount: state.litter.totalLitterCount,
        tags: state.litter.tags,
        tagsModalVisible: state.litter.tagsModalVisible,
        token: state.auth.token,
        totalTaggedGalleryCount: state.gallery.totalTaggedGalleryCount,
        totalTaggedSessionCount: state.photos.totalTaggedSessionCount,
        q: state.litter.q,
        webImages: state.web.images,
        webImageSuccess: state.web.webImageSuccess
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterPicker);
