import React, { Component, createRef } from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    StatusBar,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    StyleSheet,
    Pressable
} from 'react-native';
import Swiper from 'react-native-swiper';
import GestureRecognizer from 'react-native-swipe-gestures';
import { connect } from 'react-redux';
import LottieView from 'lottie-react-native';
import ActionSheet from 'react-native-actions-sheet';
import * as actions from '../../actions';
import CATEGORIES from '../../assets/data/categories';
import {
    LitterCategories,
    LitterImage,
    LitterPickerWheels,
    LitterTags,
    LitterBottomSearch,
    TagsActionButton,
    LitterTagsCard
} from './addTagComponents';
import { SubTitle, Colors, Body, Caption } from '../components';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import Icon from 'react-native-vector-icons/Ionicons';

const AnimatedSwiper = Animated.createAnimatedComponent(Swiper);
class AddTags extends Component {
    constructor(props) {
        super(props);

        this.state = {
            categoryAnimation: new Animated.Value(100),
            sheetAnimation: new Animated.Value(0),
            opacityAnimation: new Animated.Value(1),
            isCategoriesVisible: false,
            isKeyboardOpen: false,
            keyboardHeight: 0,
            isOverlayDisplayed: false,
            animation: new Animated.Value(0),
            imageViewPosition: 'TOP'
        };
        this.actionSheetRef = createRef();
        this.swiper = createRef();
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

                // when keyboard opens animate sheet till the height of keyboard
                this.keyboardStartAnimation(-this.state.keyboardHeight - 400);
            }
        );
        this.keyboardDidHideSubscription = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                this.setState({ isKeyboardOpen: false, keyboardHeight: 0 });
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

        /**
         * If quantityChanged is true -- then while clicking Add Tag button
         * the quantilty value currently in PICKER is added to tag
         *
         * else if quantityChanged is false -- then while clicking Add Tag button
         * quantity currently on TAG + 1 is added on tag.
         *
         * here we are changing status to false once Add tag button is pressed
         */
        this.props.changeQuantityStatus(false);
    }

    keyboardStartAnimation = sheetValue => {
        // Animate keyboard only for ios
        // TODO: need testing on other andrid devices

        Platform.OS === 'ios' &&
            Animated.timing(this.state.sheetAnimation, {
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
        Animated.timing(this.state.sheetAnimation, {
            toValue: sheetToValue,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    imageAnimation = () => {
        let toValue = -380;
        // checking if image have tags
        // if tags animate value to value -460
        // else translate value to value -380
        const tags = this.props.images[this.props.swiperIndex]?.tags;
        if (tags !== undefined && Object.keys(tags).length !== 0) {
            toValue = -460;
        }

        if (this.state.imageViewPosition === 'TOP') {
            Animated.timing(this.state.animation, {
                toValue,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.elastic(1)
            }).start(() => this.setState({ imageViewPosition: 'BOTTOM' }));
        } else {
            Animated.timing(this.state.animation, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.elastic(1)
            }).start(() => this.setState({ imageViewPosition: 'TOP' }));
        }
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
        Animated.timing(this.state.sheetAnimation, {
            toValue: 100,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    opacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    returnOpacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 1,
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
        // length of all images in state
        const length = this.props.images.length;
        const currentIndex = this.props.swiperIndex;

        const { id, type } = this.props.images[currentIndex];

        if (type === 'WEB') {
            const photoId = this.props.images[currentIndex].photoId;

            this.props.deleteWebImage(this.props.token, photoId, id);
        } else {
            this.props.deleteImage(id);
        }

        // close delete confirmation action sheet
        // if last image is deleted close AddTags modal
        // else hide delete modal
        // swiper index is changed by onIndexChanged fn of Swiper

        if (currentIndex === length - 1) {
            this.props.toggleLitter();
        } else if (currentIndex < length - 1) {
            this.actionSheetRef.current?.hide();
        }
    };

    /**
     * The LitterPicker component
     */
    render() {
        const { lang } = this.props;

        const categoryAnimatedStyle = {
            transform: [{ translateY: this.state.categoryAnimation }]
        };
        const sheetAnimatedStyle = {
            transform: [{ translateY: this.state.sheetAnimation }]
        };
        const animatedStyle = {
            transform: [{ translateY: this.state.animation }]
        };

        const opacityStyle = {
            opacity: this.state.opacityAnimation
        };
        return (
            <View>
                <View style={{ flex: 1 }}>
                    <View style={styles.container}>
                        {/* Hide status bar on this screen */}
                        <StatusBar hidden />

                        {/* Images swiper  */}

                        <AnimatedSwiper
                            style={[animatedStyle]}
                            ref={this.swiper}
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
                            index={this.props.swiperIndex}
                            loop={false}
                            loadMinimal //
                            loadMinimalSize={2} // loads only 2 images at a time
                            showsPagination={false}
                            keyboardShouldPersistTaps="handled"
                            onIndexChanged={index => {
                                this.swiperIndexChanged(index);
                            }}>
                            {this._renderLitterImage()}
                        </AnimatedSwiper>

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
                                    categoryAnimatedStyle,
                                    opacityStyle
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
                            <GestureRecognizer
                                onSwipeDown={state => {
                                    this.props.toggleLitter();
                                }}>
                                <View style={styles.overlayStyle} />
                            </GestureRecognizer>
                        )}

                        <View
                            style={{
                                position: 'absolute',
                                top: 20,
                                left: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: SCREEN_WIDTH - 40
                            }}>
                            <View style={styles.indexStyle}>
                                <Body color="text">
                                    {this.props.swiperIndex + 1}/
                                    {this.props.images.length}
                                </Body>
                            </View>
                            <Pressable
                                onPress={this.props.toggleLitter}
                                style={styles.closeButton}>
                                <Icon
                                    name="ios-close-outline"
                                    color="black"
                                    size={32}
                                />
                            </Pressable>
                        </View>

                        {this.state.isOverlayDisplayed && (
                            <View
                                style={{
                                    position: 'absolute',
                                    marginLeft: 20,
                                    top: 70
                                }}>
                                {/* Shows the status of litter if "picked up" or not */}
                                <View style={styles.statusCard}>
                                    <Caption
                                        dictionary={`${lang}.tag.litter-status`}
                                    />
                                    {this.props.images[this.props.swiperIndex]
                                        ?.picked_up ? (
                                        <Body
                                            color="accent"
                                            dictionary={`${lang}.tag.picked-thumb`}
                                        />
                                    ) : (
                                        <Body
                                            color="error"
                                            dictionary={`${lang}.tag.not-picked-thumb`}
                                        />
                                    )}
                                </View>
                                {/* Shows the list of tags */}
                                <LitterTagsCard
                                    tags={
                                        this.props.images[
                                            this.props.swiperIndex
                                        ]?.tags
                                    }
                                    lang={this.props.lang}
                                />
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
                            verticalButtonPress={() => {
                                this.actionSheetRef.current?.setModalVisible();
                            }}
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
                                    styles.bottomSheet,
                                    sheetAnimatedStyle,
                                    opacityStyle
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
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                onPress={() => this.addTag()}
                                                style={styles.buttonStyle}>
                                                <SubTitle
                                                    color="white"
                                                    dictionary={`${lang}.tag.add-tag`}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onLongPress={() => {
                                                    this.opacityAnmiation();
                                                }}
                                                onPress={() => {
                                                    this.imageAnimation();
                                                }}
                                                onPressOut={() => {
                                                    this.returnOpacityAnmiation();
                                                }}
                                                style={[
                                                    styles.buttonStyle,
                                                    {
                                                        width:
                                                            SCREEN_WIDTH * 0.25
                                                    }
                                                ]}>
                                                {this.state
                                                    .imageViewPosition ===
                                                'TOP' ? (
                                                    <Icon
                                                        name="chevron-up-outline"
                                                        size={32}
                                                        color="white"
                                                    />
                                                ) : (
                                                    <Icon
                                                        name="chevron-down-outline"
                                                        size={32}
                                                        color="white"
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </View>
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
                        <Body
                            style={{ textAlign: 'center' }}
                            dictionary={`${lang}.tag.delete-message`}
                        />
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
                                <Body dictionary={`${lang}.tag.cancel`} />
                            </Pressable>
                            <Pressable
                                onPress={this.deleteImage}
                                style={[
                                    styles.actionButtonStyle,
                                    { backgroundColor: Colors.error }
                                ]}>
                                <Body
                                    color="white"
                                    dictionary={`${lang}.tag.delete`}
                                />
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
                            // Move image to bottom position if Tags Sheet is closed
                            // By clicking on the image
                            this.state.imageViewPosition === 'BOTTOM' &&
                                this.imageAnimation();
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
        backgroundColor: 'black'
    },
    statusCard: {
        backgroundColor: Colors.white,
        width: SCREEN_WIDTH - 40,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20
    },
    buttonStyle: {
        height: 56,
        width: SCREEN_WIDTH * 0.6,
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
    },
    overlayStyle: {
        position: 'absolute',
        flex: 1,
        backgroundColor: 'red',
        opacity: 0.4,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    indexStyle: {
        minWidth: 80,
        paddingHorizontal: 20,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomSheet: {
        backgroundColor: 'white',
        position: 'absolute',
        bottom: -400,
        left: 0,
        paddingVertical: 20,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8
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
