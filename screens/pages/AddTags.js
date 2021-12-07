import React, { PureComponent, createRef } from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    View,
    Text,
    Animated,
    Easing,
    StyleSheet,
    Pressable
} from 'react-native';

import Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import CATEGORIES from '../../assets/data/categories';
import LitterCategories from './components/LitterCategories';
import LitterImage from './components/LitterImage';
import LitterPickerWheels from './components/LitterPickerWheels';
import LitterTags from './components/LitterTags';
import LitterBottomSearch from './components/LitterBottomSearch';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import LITTERKEYS from '../../assets/data/litterkeys';

class AddTags extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            categoryAnimation: new Animated.Value(0),
            isCategoriesVisible: false
        };
        this.actionsheetRef = createRef();
    }

    /**
     * Check if the user has any photos on web
     *
     * @photo_actions.js
     */
    async componentDidMount() {}

    /**
     * Cancel event listeners
     */
    componentWillUnmount() {}

    startAnimation = () => {
        Animated.timing(this.state.categoryAnimation, {
            toValue: 200,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    returnAnimation = () => {
        Animated.timing(this.state.categoryAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(() => {
            this.setState({
                isCategoriesVisible: false
            });
        });
    };
    /**
     * The LitterPicker component
     */
    render() {
        const { lang, swiperIndex } = this.props;

        const categoryAnimatedStyle = {
            transform: [{ translateY: this.state.categoryAnimation }]
        };

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.container}>
                    <StatusBar hidden />

                    <Swiper
                        style={{ zIndex: 20 }}
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
                    {/* First - Top Bar position: 'absolute'  */}
                    {this.state.isCategoriesVisible && (
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    top: -150,
                                    left: 20,
                                    zIndex: 2
                                },
                                categoryAnimatedStyle
                            ]}>
                            <LitterCategories
                                categories={CATEGORIES}
                                category={this.props.category}
                                lang={this.props.lang}
                            />
                        </Animated.View>
                    )}
                </View>
            </View>
        );
    }

    /**
     * The user has swiped left or right across an array of all photo types.
     *
     * This function gives us the new index the user has swiped to.
    
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
                return (
                    <LitterImage
                        category={this.props.category}
                        lang={this.props.lang}
                        key={image.id}
                        photoSelected={image}
                        swiperIndex={this.props.swiperIndex}
                        toggleFn={() => {
                            if (this.state.isCategoriesVisible) {
                                this.returnAnimation();
                            } else {
                                this.startAnimation();
                                this.setState({
                                    isCategoriesVisible: true
                                });
                            }
                        }}
                    />
                );
            }

            // Otherwise, just return an empty view
            return <View key={image.id} />;
        });
    };
}

const styles = StyleSheet.create({
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
});

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
        images: state.images.imagesArray
    };
};

export default connect(
    mapStateToProps,
    actions
)(AddTags);
