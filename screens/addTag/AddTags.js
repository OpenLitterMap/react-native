import React, {Component, createRef} from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Swiper from 'react-native-swiper';
import {StackActions} from '@react-navigation/native';
import {connect} from 'react-redux';
import LottieView from 'lottie-react-native';
import ActionSheet from 'react-native-actions-sheet';
import * as actions from '../../actions';
import CATEGORIES from '../../assets/data/categories';
import {
    LitterBottomButtons,
    LitterCategories,
    LitterImage,
    LitterPickerWheels,
    LitterTags,
    LitterTextInput
} from './addTagComponents';
import {Body, Colors} from '../components';
import Icon from 'react-native-vector-icons/Ionicons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const AnimatedSwiper = Animated.createAnimatedComponent(Swiper);

class AddTags extends Component {
    constructor(props) {
        super(props);

        this.state = {
            categoryAnimation: new Animated.Value(100),
            sheetAnimation: new Animated.Value(0),
            opacityAnimation: new Animated.Value(1),
            isCategoriesVisible: true,
            isKeyboardOpen: false,
            keyboardHeight: 0,
            animation: new Animated.Value(0)
        };
        this.actionSheetRef = createRef();
        this.swiper = createRef();

        // positions category and for tagging/bottom container
        this.categoryContainerPosition = 300;
        this.taggingContainerPosition = 400;
    }

    async componentDidMount() {
        this.keyboardDidShowSubscription = Keyboard.addListener(
            'keyboardDidShow',
            e => {
                this.setState({
                    isKeyboardOpen: true,
                    keyboardHeight: e.endCoordinates.height
                });

                // start keyboard animation
                this.keyboardStartAnimation();
            }
        );
        this.keyboardDidHideSubscription = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                this.setState({isKeyboardOpen: false, keyboardHeight: 0});
                this.startAnimation();
            }
        );

        // react navigation subscription to check if stack navigation animation transaction have ended
        this.openModalTransitionSubscription =
            this.props.navigation.addListener('transitionEnd', () => {
                // initially open tagging container
                this.openTaggingContainer();
            });
    }

    /**
     * Cancel event listeners
     */
    componentWillUnmount() {
        this.keyboardDidShowSubscription.remove();
        this.keyboardDidHideSubscription.remove();
        this.openModalTransitionSubscription();
    }

    keyboardStartAnimation = () => {
        // Animate keyboard only for ios
        // TODO: need testing on other android devices

        const sheetPosition = -(
            this.state.keyboardHeight + this.taggingContainerPosition
        );

        Platform.OS === 'ios' &&
            Animated.timing(this.state.sheetAnimation, {
                toValue: sheetPosition,
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
    startAnimation = () => {
        Animated.timing(this.state.categoryAnimation, {
            // extra 50 for height of container
            toValue: this.categoryContainerPosition + 50,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
        Animated.timing(this.state.sheetAnimation, {
            toValue: -this.taggingContainerPosition,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    /**
     * Fn for close animation
     * happen on backdrop click
     * @param pressType --> "LONG" | "REGULAR"
     * if pressType === LONG hide categories and tag section but dont show Meta details
     */
    returnAnimation = (pressType = 'REGULAR') => {
        Animated.timing(this.state.categoryAnimation, {
            toValue: -this.categoryContainerPosition,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(() => {
            pressType === 'REGULAR' &&
                this.setState({
                    isCategoriesVisible: true
                });
        });
        Animated.timing(this.state.sheetAnimation, {
            toValue: 100,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    /**
     * fn to open tagging containers with animation
     */
    openTaggingContainer = () => {
        this.startAnimation();
        this.setState({
            isCategoriesVisible: true
        });
    };

    /**
     * function for deleting image
     *
     * currentIndex is current swiper index
     * if WEB image hit api and delete uploaded image and then delete from state
     *  else delete from state by id
     */
    deleteImage = async () => {
        // length of all images in state
        const length = this.props.images.length;
        const currentIndex = this.props.swiperIndex;

        const {id, type} = this.props.images[currentIndex];

        if (type === 'WEB') {
            const photoId = this.props.images[currentIndex].photoId;
            this.props.deleteWebImage(this.props.token, photoId, id);
        } else {
            await this.props.deleteImage(id);
        }
        // close delete confirmation action sheet
        // if last image is deleted close AddTags modal
        // else hide delete modal
        // swiper index is changed by onIndexChanged fn of Swiper

        if (currentIndex === length - 1) {
            this.actionSheetRef.current?.hide();
            this.props.navigation.dispatch(StackActions.popToTop());
        } else if (currentIndex < length - 1) {
            this.actionSheetRef.current?.hide();
        }
    };

    outerViewClicked = () => {
        if (this.state.isKeyboardOpen) {
            this.handleCloseKeyboard();
        }
    };

    handleCloseKeyboard = () => {
        this.setState({isKeyboardOpen: false, keyboardHeight: 0});
        this.startAnimation();
        Keyboard.dismiss();
    };

    /**
     * The Add Tags component
     */
    render() {
        const {lang} = this.props;

        const categoryAnimatedStyle = {
            transform: [{translateY: this.state.categoryAnimation}]
        };
        const sheetAnimatedStyle = {
            transform: [{translateY: this.state.sheetAnimation}]
        };

        // Had a bug with this since upgrading react-native from 0.63 -> 0.72
        // swiper was perfect, but now rarely detected
        // removing the style/containerStyle prop seems to have helped a bit.
        // const animatedStyle = {
        //     transform: [{translateY: this.state.animation}]
        // };

        const opacityStyle = {
            opacity: this.state.opacityAnimation
        };
        return (
            <View style={{flex: 1}}>
                <View style={{flex: 1}}>
                    <View style={styles.container}>
                        {/* Hide status bar on this screen */}
                        <StatusBar hidden />

                        {/* Images swiper */}
                        <AnimatedSwiper
                            ref={this.swiper}
                            showsButtons={!this.state.isKeyboardOpen}
                            prevButton={
                                <View style={styles.slideButtonStyle}>
                                    <Icon
                                        name="ios-chevron-back"
                                        color={Colors.accent}
                                        size={32}
                                    />
                                </View>
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

                        {/* Top nav */}
                        {/* index/total && Close X */}
                        <View
                            style={{
                                position: 'absolute',
                                top: 20,
                                left: 20,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: SCREEN_WIDTH - 40
                            }}>
                            {/* ImgIndex/Total */}
                            <View style={styles.indexStyle}>
                                <Body color="text">
                                    {this.props.swiperIndex + 1}/
                                    {this.props.images.length}
                                </Body>
                            </View>
                            {/* Close X */}
                            <Pressable
                                onPress={() =>
                                    this.props.navigation.navigate('HOME')
                                }
                                style={styles.closeButton}>
                                <Icon
                                    name="ios-close-outline"
                                    color="black"
                                    size={24}
                                />
                            </Pressable>
                        </View>

                        {/* Category component -- show only if add tag button is clicked
                            hidden when backdrop is pressed
                        */}
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    top: -this.categoryContainerPosition,
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

                        {/* Bottom action sheet with Tags picker and add tags section */}
                        <Animated.View
                            style={[
                                {bottom: -this.taggingContainerPosition},
                                styles.bottomSheet,
                                sheetAnimatedStyle,
                                opacityStyle
                            ]}>
                            <TouchableWithoutFeedback
                                onPress={this.outerViewClicked}>
                                <View
                                    style={[
                                        {maxWidth: SCREEN_WIDTH},
                                        this.state.isKeyboardOpen
                                            ? {paddingTop: SCREEN_HEIGHT * 0.15}
                                            : null
                                    ]}>
                                    <LitterTags
                                        tags={
                                            this.props.images[
                                                this.props.swiperIndex
                                            ]?.tags
                                        }
                                        customTags={
                                            this.props.images[
                                                this.props.swiperIndex
                                            ]?.customTags
                                        }
                                        lang={this.props.lang}
                                        swiperIndex={this.props.swiperIndex}
                                    />

                                    <LitterTextInput
                                        suggestedTags={this.props.suggestedTags}
                                        // height={this.state.height}
                                        lang={this.props.lang}
                                        swiperIndex={this.props.swiperIndex}
                                        isKeyboardOpen={
                                            this.state.isKeyboardOpen
                                        }
                                        navigation={this.props.navigation}
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
                                        <LitterBottomButtons
                                            images={this.props.images}
                                            swiperIndex={this.props.swiperIndex}
                                            lang={lang}
                                            category={this.props.category}
                                            item={this.props.item}
                                            quantityChanged={
                                                this.props.quantityChanged
                                            }
                                            q={this.props.q}
                                            navigation={this.props.navigation}
                                            deleteButtonPressed={() => {
                                                this.actionSheetRef.current?.show();
                                            }}
                                        />
                                    )}
                                </View>
                            </TouchableWithoutFeedback>
                        </Animated.View>
                    </View>
                </View>

                {/* delete confirmation action sheet */}
                <ActionSheet ref={this.actionSheetRef}>
                    <View
                        style={{
                            padding: 40,
                            alignItems: 'center'
                        }}>
                        <LottieView
                            source={require('../../assets/lottie/trash_can_lottie.json')}
                            autoPlay
                            loop
                            style={{width: 80, height: 80, marginBottom: 20}}
                        />
                        <Body
                            style={{textAlign: 'center'}}
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
                                    {backgroundColor: Colors.error}
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
                    key={image.id}
                    category={this.props.category}
                    lang={this.props.lang}
                    photoSelected={image}
                    swiperIndex={this.props.swiperIndex}
                    navigation={this.props.navigation}
                    // hide all tagging containers
                    onLongPressStart={() => this.returnAnimation('LONG')}
                    // show all tagging containers
                    onLongPressEnd={() => this.startAnimation()}
                    // hide tagging containers and show meta containers
                    onImageTap={() => {
                        console.log('image tapped');
                        // if (this.state.isCategoriesVisible) {
                        //     this.returnAnimation('REGULAR');
                        // }
                    }}
                />
            );
        });
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    statusCard: {
        backgroundColor: Colors.white,
        width: SCREEN_WIDTH - 40,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20
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
        opacity: 0.4,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    indexStyle: {
        minWidth: 80,
        paddingHorizontal: 20,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButton: {
        width: 30,
        height: 30,
        backgroundColor: 'white',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomSheet: {
        position: 'absolute',
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

export default connect(mapStateToProps, actions)(AddTags);
