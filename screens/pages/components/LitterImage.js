import React, { PureComponent, createRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Keyboard,
    ScrollView,
    Pressable,
    Text,
    View
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
    static defaultProps = {
        doAnimateZoomReset: false,
        maximumZoomScale: 2,
        minimumZoomScale: 1,
        zoomHeight: SCREEN_HEIGHT,
        zoomWidth: SCREEN_WIDTH
    };

    constructor(props) {
        super(props);

        this.state = {
            imageLoaded: false,
            isOverlayDisplayed: false,
            isKeyboardOpen: false
        };
        this.actionsheetRef = createRef();
    }

    componentDidMount() {
        // TODO: remove this -- only for dev
        this.actionsheetRef.current?.setModalVisible(true);
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
        return (
            <View style={{ backgroundColor: 'black' }}>
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
                        this.actionsheetRef.current?.setModalVisible();
                    }}
                    toggleOverlay={() => {
                        this.setState(previousState => ({
                            isOverlayDisplayed: !previousState.isOverlayDisplayed
                        }));
                    }}
                />

                <ActionSheet
                    ref={this.actionsheetRef}
                    closeOnTouchBackdrop={false}
                    keyboardShouldPersistTaps="always">
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
                        <LitterCategories
                            categories={CATEGORIES}
                            category={this.props.category}
                            lang={this.props.lang}
                            callback={this.categoryClicked}
                        />
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
                        <Pressable
                            onPress={() => this.addTag()}
                            style={styles.buttonStyle}>
                            <SubTitle color="white">ADD TAG</SubTitle>
                        </Pressable>
                    </View>
                </ActionSheet>
            </View>
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
