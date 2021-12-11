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
import LottieView from 'lottie-react-native';
import ActionSheet from 'react-native-actions-sheet';
import * as actions from '../../actions';
import CATEGORIES from '../../assets/data/categories';
import LitterCategories from './components/LitterCategories';
import LitterImage from './components/LitterImage';
import LitterPickerWheels from './components/LitterPickerWheels';
import LitterTags from './components/LitterTags';
import LitterBottomSearch from './components/LitterBottomSearch';
import TagsActionButton from './components/TagsActionButton';
import { SubTitle, Colors, Body, Caption } from '../components';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import LITTERKEYS from '../../assets/data/litterkeys';
import Icon from 'react-native-vector-icons/Ionicons';

class AddTags extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            categoryAnimation: new Animated.Value(100),
            sheetAnmiation: new Animated.Value(0),
            isCategoriesVisible: false,
            isKeyboardOpen: false,
            keyboardHeight: 0,
            isOverlayDisplayed: false
        };
        this.actionSheetRef = createRef();
    }

    /**
     */
    async componentDidMount() {
        this.keyboardDidShowSubscription = Keyboard.addListener(
            'keyboardDidShow',
            e => {
                this.setState({
                    isKeyboardOpen: true,
                    keyboardHeight: e.endCoordinates.height
                });
                this.keyboardStartAnimation(-this.state.keyboardHeight - 400);
                // this.startAnimation(-this.state.keyboardHeight - 400);
            }
        );
        this.keyboardDidHideSubscription = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                this.setState({ isKeyboardOpen: false, keyboardHeight: 0 });
                console.log(this.state.keyboardHeight);
                this.startAnimation(-400);
            }
        );
    }

    /**
     * Cancel event listeners
     */
    componentWillUnmount() {
        this.keyboardDidShowSubscription.remove();
        this.keyboardDidHideSubscription.remove();
    }

    /**
     * Add tag on a specific image
     */
    addTag() {
        const tag = {
            category: this.props.category.title.toString(),
            title: this.props.item.toString(),
            quantity: this.props.q
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;
        this.props.addTagToImage({
            tag,
            currentIndex,
            quantityChanged: this.props.quantityChanged
        });

        this.props.changeQuantiyStatus(false);
    }

    keyboardStartAnimation = sheetValue => {
        Animated.timing(this.state.sheetAnmiation, {
            toValue: sheetValue,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.categoryAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };
    /**
     * fn for start animation on add tags floating button click
     * animates categories from top
     * and Tags sheet with search box from bottom
     */
    startAnimation = sheetToValue => {
        Animated.timing(this.state.categoryAnimation, {
            toValue: 200,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
        Animated.timing(this.state.sheetAnmiation, {
            toValue: sheetToValue,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    /**
     * Fn for close animation
     * happen on backdrop click
     */
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
        Animated.timing(this.state.sheetAnmiation, {
            toValue: 100,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    /** function for deleting image
     * currentIndex is current swiper index
     * if WEB image hit api and delete uploaded image and then delete from state
     *  else delete from state by id
     */
    deleteImage = async () => {
        const currentIndex = this.props.swiperIndex;

        const { id, type } = this.props.images[currentIndex];

        if (type === 'WEB') {
            const photoId = this.props.images[currentIndex].photoId;

            await this.props.deleteWebImage(this.props.token, photoId, id);
        } else {
            this.props.deleteImage(id);
        }

        // close delete confirmation action sheet

        if (currentIndex === 0) {
            // this.props.resetLitterTags();
            this.props.toggleLitter();
        } else {
            this.actionSheetRef.current?.hide();
            this.props.swiperIndexChanged(currentIndex - 1);
        }
    };

    /**
     * The LitterPicker component
     */
    render() {
        const { lang, swiperIndex } = this.props;

        const categoryAnimatedStyle = {
            transform: [{ translateY: this.state.categoryAnimation }]
        };
        const sheetAnimatedStyle = {
            transform: [{ translateY: this.state.sheetAnmiation }]
        };

        return (
            <View>
                <View style={{ flex: 1 }}>
                    <View style={styles.container}>
                        {/* Hide status bar on this screen */}
                        <StatusBar hidden />

                        {/* Images swiper  */}
                        <Swiper
                            showsButtons={
                                this.state.isCategoriesVisible ? false : true
                            }
                            nextButton={
                                <View style={styles.slideButtonStyle}>
                                    <Icon
                                        name="ios-chevron-forward"
                                        color={Colors.accent}
                                        size={32}
                                    />
                                </View>
                            }
                            prevButton={
                                <View style={styles.slideButtonStyle}>
                                    <Icon
                                        name="ios-chevron-back"
                                        color={Colors.accent}
                                        size={32}
                                    />
                                </View>
                            }
                            index={swiperIndex}
                            loop={false}
                            loadMinimal //
                            loadMinimalSize={2} // loads only 2 images at a time
                            showsPagination={false}
                            keyboardShouldPersistTaps="handled"
                            ref="imageSwiper"
                            onIndexChanged={index =>
                                this.swiperIndexChanged(index)
                            }>
                            {this._renderLitterImage()}
                        </Swiper>

                        {/* Category component -- show only if add tag button is clicked
                        hidden when backdrop is pressed
                    */}
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

                        {/* Black overlay */}
                        {this.state.isOverlayDisplayed && (
                            <View
                                style={{
                                    position: 'absolute',
                                    flex: 1,
                                    backgroundColor: 'black',
                                    opacity: 0.4,
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_HEIGHT
                                }}
                            />
                        )}
                        {this.state.isOverlayDisplayed && (
                            <View
                                style={{
                                    position: 'absolute',
                                    backgroundColor: Colors.white,
                                    width: SCREEN_WIDTH - 40,
                                    marginLeft: 20,
                                    // height: 100,
                                    top: 100,
                                    borderRadius: 12,
                                    padding: 20
                                }}>
                                <Caption>Litter Status</Caption>
                                {this.props.images[this.props.swiperIndex]
                                    ?.picked_up ? (
                                    <Body color="accent">Picked up 👍🏻</Body>
                                ) : (
                                    <Body color="error">Not picked up 👎🏻</Body>
                                )}
                            </View>
                        )}

                        {/* Floating action button */}
                        <TagsActionButton
                            pickedUpStatus={
                                this.props.images[this.props.swiperIndex]
                                    ?.picked_up
                            }
                            openTagSheet={() => {
                                if (this.state.isCategoriesVisible) {
                                    this.returnAnimation();
                                } else {
                                    this.startAnimation(-400);
                                    this.setState({
                                        isCategoriesVisible: true
                                    });
                                }
                            }}
                            toggleOverlay={() => {
                                this.setState(previousState => ({
                                    isOverlayDisplayed: !previousState.isOverlayDisplayed
                                }));
                            }}
                            verticalButtonPress={
                                this.actionSheetRef.current?.setModalVisible
                            }
                            horizontalButtonPress={() =>
                                this.props.togglePickedUp(
                                    this.props.images[this.props.swiperIndex]
                                        ?.id
                                )
                            }
                        />

                        {/* Bottom action sheet with Tags picker and add tags section */}

                        {this.state.isCategoriesVisible && (
                            <Animated.View
                                style={[
                                    {
                                        backgroundColor: 'white',
                                        position: 'absolute',
                                        bottom: -400,
                                        left: 0,
                                        paddingVertical: 20,
                                        borderTopLeftRadius: 8,
                                        borderTopRightRadius: 8
                                    },
                                    sheetAnimatedStyle
                                ]}>
                                <View
                                    style={{
                                        // height: 200,
                                        maxWidth: SCREEN_WIDTH
                                    }}>
                                    <LitterTags
                                        tags={
                                            this.props.images[
                                                this.props.swiperIndex
                                            ]?.tags
                                        }
                                        lang={this.props.lang}
                                        swiperIndex={this.props.swiperIndex}
                                    />

                                    <LitterBottomSearch
                                        suggestedTags={this.props.suggestedTags}
                                        // height={this.state.height}
                                        lang={this.props.lang}
                                        swiperIndex={this.props.swiperIndex}
                                        isKeyboardOpen={
                                            this.state.isKeyboardOpen
                                        }
                                    />
                                    {!this.state.isKeyboardOpen && (
                                        <LitterPickerWheels
                                            item={this.props.item}
                                            items={this.props.items}
                                            model={this.props.model}
                                            category={this.props.category}
                                            lang={this.props.lang}
                                        />
                                    )}
                                    {!this.state.isKeyboardOpen && (
                                        <TouchableOpacity
                                            onPress={() => this.addTag()}
                                            style={styles.buttonStyle}>
                                            <SubTitle
                                                color="white"
                                                dictionary={`${lang}.tag.suggested-tags`}>
                                                ADD TAG
                                            </SubTitle>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* delete confirmation action sheet */}
                <ActionSheet ref={this.actionSheetRef}>
                    <View
                        style={{
                            // height: 300,
                            padding: 40,
                            alignItems: 'center'
                        }}>
                        <LottieView
                            source={require('../../assets/lottie/trash_can_lottie.json')}
                            autoPlay
                            loop
                            style={{ width: 80, height: 80, marginBottom: 20 }}
                        />
                        <Body style={{ textAlign: 'center' }}>
                            Are you sure you want to delete this image ?
                        </Body>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                                marginVertical: 40,
                                width: SCREEN_WIDTH - 40
                            }}>
                            <Pressable
                                onPress={this.actionSheetRef.current?.hide}
                                style={[styles.actionButtonStyle]}>
                                <Body>Cancel</Body>
                            </Pressable>
                            <Pressable
                                onPress={this.deleteImage}
                                style={[
                                    styles.actionButtonStyle,
                                    { backgroundColor: Colors.error }
                                ]}>
                                <Body color="white">Yes, Delete</Body>
                            </Pressable>
                        </View>
                    </View>
                </ActionSheet>
            </View>
        );
    }

    /**
     * The user has swiped left or right across an array of all photo types.
     *
     * This function gives us the new index the user has swiped to.
    
     */
    swiperIndexChanged = newGlobalIndex => {
        // Without this, we get "cannot update a component from within the function body of another component"
        setTimeout(() => {
            // litter.js swiperIndex
            this.props.swiperIndexChanged(newGlobalIndex);
        }, 0);
    };

    /**
     * Array of images to swipe through
     */

    _renderLitterImage = () => {
        // Return an array of all photos
        return this.props.images.map((image, index) => {
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
                        }
                    }}
                />
            );
        });
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingTop: SCREEN_HEIGHT * 0.05,
        backgroundColor: 'white'
    },
    buttonStyle: {
        height: 56,
        width: SCREEN_WIDTH - 40,
        backgroundColor: Colors.accent,
        marginBottom: 40,
        marginLeft: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12
    },
    slideButtonStyle: {
        backgroundColor: '#fff',
        borderRadius: 100,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtonStyle: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

const mapStateToProps = state => {
    return {
        category: state.litter.category,
        item: state.litter.item,
        items: state.litter.items,
        lang: state.auth.lang,
        model: state.settings.model,
        photoSelected: state.litter.photoSelected,
        suggestedTags: state.litter.suggestedTags,
        swiperIndex: state.litter.swiperIndex,
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
