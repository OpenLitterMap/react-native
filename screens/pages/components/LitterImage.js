import React, { PureComponent, createRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Keyboard,
    ScrollView,
    Pressable,
    Text,
    View,
    Animated,
    Easing
} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import TagsActionButton from './TagsActionButton';
import LitterCategories from './LitterCategories';
import LitterBottomSearch from './LitterBottomSearch';
import LitterPickerWheels from './LitterPickerWheels';
import LitterTags from './LitterTags';
import CATEGORIES from '../../../assets/data/categories';
import { SubTitle, Colors, Title } from '../../components';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class LitterImage extends PureComponent {
    // ScrollView Image Props

    constructor(props) {
        super(props);

        this.state = {
            sheetAnmiation: new Animated.Value(0),
            imageLoaded: false,
            isOverlayDisplayed: false,
            isKeyboardOpen: false,
            isSheetVisible: false
        };
        this.actionsheetRef = createRef();
    }

    componentDidMount() {
        // TODO: remove this -- only for dev
        // this.actionsheetRef.current?.setModalVisible(true);
        this.keyboardDidShowSubscription = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                console.log('OPENED');
                this.setState({ isKeyboardOpen: true });
            }
        );
        this.keyboardDidHideSubscription = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                console.log('CLOSED');
                this.setState({ isKeyboardOpen: false });
            }
        );
    }

    componentWillUnmount() {
        this.keyboardDidShowSubscription.remove();
        this.keyboardDidHideSubscription.remove();
    }

    _imageLoaded() {
        this.setState({ imageLoaded: true });
    }

    startAnimation = () => {
        Animated.timing(this.state.sheetAnmiation, {
            toValue: -400,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };
    returnAnimation = () => {
        Animated.timing(this.state.sheetAnmiation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(() => {
            this.setState({
                isSheetVisible: false
            });
        });
    };

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

    /**
     * Render the Image inside LitterPicker.Swiper
     *
     * This renders twice. Once when Swiper is created (imageLoaded false)
     *
     * and again when imageLoaded is true
     */
    render() {
        const sheetAnimatedStyle = {
            transform: [{ translateY: this.state.sheetAnmiation }]
        };
        return (
            <Pressable
                onPress={() => {
                    if (this.state.isSheetVisible) {
                        this.returnAnimation();
                        this.props.toggleFn();
                    }
                }}
                style={{ backgroundColor: 'black' }}>
                <Image
                    resizeMode="cover"
                    source={{ uri: this.props.photoSelected.uri }}
                    style={styles.image}
                    onLoad={this._imageLoaded.bind(this)}
                />

                <ActivityIndicator
                    style={styles.activityIndicator}
                    animating={!this.state.imageLoaded}
                />
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

                <TagsActionButton
                    openTagSheet={() => {
                        // this.actionsheetRef.current?.setModalVisible();
                        this.startAnimation();
                        this.props.toggleFn();
                        this.setState({
                            isSheetVisible: true
                        });
                    }}
                    toggleOverlay={() => {
                        this.setState(previousState => ({
                            isOverlayDisplayed: !previousState.isOverlayDisplayed
                        }));
                    }}
                />

                {this.state.isSheetVisible && (
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
                                tags={this.props.photoSelected?.tags}
                                lang={this.props.lang}
                                swiperIndex={this.props.swiperIndex}
                            />
                            {/* {!this.state.isKeyboardOpen && (
                            <LitterCategories
                                categories={CATEGORIES}
                                category={this.props.category}
                                lang={this.props.lang}
                                callback={this.categoryClicked}
                            />
                        )} */}
                            <LitterBottomSearch
                                suggestedTags={this.props.suggestedTags}
                                // height={this.state.height}
                                lang={this.props.lang}
                                swiperIndex={this.props.swiperIndex}
                                isKeyboardOpen={this.state.isKeyboardOpen}
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
                                <Pressable
                                    onPress={() => this.addTag()}
                                    style={styles.buttonStyle}>
                                    <SubTitle color="white">ADD TAG</SubTitle>
                                </Pressable>
                            )}
                        </View>
                    </Animated.View>
                )}

                {/* </ActionSheet> */}
            </Pressable>
        );
    }
}

const styles = {
    activityIndicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
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
    }
};

const mapStateToProps = state => {
    return {
        category: state.litter.category,
        item: state.litter.item,
        items: state.litter.items,
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterImage);
