import React, { PureComponent } from 'react';
import {
    Dimensions,
    FlatList,
    Keyboard,
    TextInput,
    View,
    Pressable
} from 'react-native';
import { getTranslation } from 'react-native-translation';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Body, Caption, Colors } from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class LitterBottomSearch extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            text: '',
            keyboardStatus: undefined
        };
    }

    componentDidMount() {
        this.keyboardDidShowSubscription = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                this.setState({ keyboardStatus: 'KEYBOARD_SHOWN' });
            }
        );
        this.keyboardDidHideSubscription = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                this.setState({ keyboardStatus: 'KEYBOARD_HIDDEN' });
            }
        );
    }

    componentWillUnmount() {
        this.keyboardDidShowSubscription.remove();
        this.keyboardDidHideSubscription.remove();
    }

    /**
     * A tag has been selected
     */
    addTag(tag) {
        // update selected tag to execute scrollTo
        this.props.changeItem(tag);

        const newTag = {
            category: tag.category,
            title: tag.key
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;

        this.props.addTagToImage({
            tag: newTag,
            currentIndex
        });

        // clears text filed after one tag is selected
        this.setState({ text: '' });
    }

    /**
     *
     */
    clear() {
        this.setState({ text: '' });
    }

    /**
     * Close the litter picker and go back to the gallery screen
     */
    closeLitterPicker() {
        // litter_reducer
        this.props.resetLitterTags();

        // shared_reducer
        this.props.toggleLitter();
    }

    /**
     * Render a suggested tag
     */
    renderTag = ({ item }) => {
        return (
            <Pressable
                style={styles.tag}
                onPress={this.addTag.bind(this, item)}>
                <Caption
                    // style={styles.category}
                    dictionary={`${this.props.lang}.litter.categories.${
                        item.category
                    }`}
                />
                <Body
                    style={styles.item}
                    dictionary={`${this.props.lang}.litter.${item.category}.${
                        item.key
                    }`}
                />
            </Pressable>
        );
    };

    /**
     * Update text
     */
    updateText(text) {
        this.setState({ text });

        this.props.suggestTags(text, this.props.lang);
    }

    render() {
        const lang = this.props.lang;
        const suggest = getTranslation(`${lang}.litter.tags.type-to-suggest`);

        return (
            <View>
                <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <TextInput
                        style={{
                            width: SCREEN_WIDTH - 40,
                            height: 60,
                            backgroundColor: Colors.accentLight,
                            borderRadius: 12,
                            padding: 10
                        }}
                        placeholder={suggest}
                        placeholderTextColor={Colors.muted}
                        onChangeText={text => this.updateText(text)}
                        selectionColor="black"
                        blurOnSubmit={false}
                        clearButtonMode="always"
                        value={this.state.text}
                    />
                </View>

                {this.state.keyboardStatus && (
                    <View style={styles.tagsOuterContainer}>
                        <Caption
                            style={styles.suggest}
                            dictionary={`${lang}.litter.tags.suggested`}
                            values={{
                                count: this.props.suggestedTags.length
                            }}
                        />

                        <FlatList
                            data={this.props.suggestedTags}
                            horizontal={true}
                            renderItem={this.renderTag}
                            keyExtractor={(item, index) => item.key + index}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                )}
            </View>
        );
    }
}

const styles = {
    androidTextFilterClosed: {
        alignItems: 'center',
        borderRadius: 50,
        borderColor: 'gray',
        borderWidth: 1,
        padding: SCREEN_WIDTH * 0.001, // works better on android
        // height: SCREEN_HEIGHT * 0.045, // works better on iOS
        textAlign: 'center',
        width: '50%'
    },
    category: {
        marginBottom: SCREEN_HEIGHT * 0.01
    },
    container: {
        // position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.05,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH
    },
    closedBottomContainer: {
        // position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.07,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH
    },
    openContainerAndroid: {
        // position: 'absolute',
        // top: SCREEN_HEIGHT * 0.1,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.25
    },
    openContaineriOS: {
        // position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.2
    },
    hide: {
        display: 'none'
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.25
    },
    iOSTextFilterClosed: {
        alignItems: 'center',
        borderRadius: 50,
        borderColor: 'gray',
        borderWidth: 1,
        // padding: SCREEN_WIDTH * 0.001, // works better on android
        height: SCREEN_HEIGHT * 0.045, // works better on iOS
        textAlign: 'center',
        width: '50%'
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    suggest: {
        marginBottom: SCREEN_HEIGHT * 0.01
    },
    tag: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.muted
    },
    tagsOuterContainer: {
        marginLeft: 20,
        marginBottom: 40
    },

    textInputOpen: {
        borderRadius: 50,
        borderColor: 'gray',
        borderWidth: 1,
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.045,
        paddingTop: 0, // android
        paddingBottom: 0, // android
        paddingLeft: SCREEN_WIDTH * 0.05,
        marginTop: SCREEN_HEIGHT * 0.01,
        marginLeft: SCREEN_WIDTH * 0.25,
        marginRight: SCREEN_WIDTH * 0.25,
        marginBottom: SCREEN_HEIGHT * 0.01,
        width: '50%'
    }
};

const mapStateToProps = state => {
    return {
        suggestedTags: state.litter.suggestedTags
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterBottomSearch);
