import React, { PureComponent } from 'react';
import {
    Dimensions,
    FlatList,
    Keyboard,
    TextInput,
    View,
    Pressable,
    StyleSheet
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
            customTagError: ''
        };
    }

    /**
     * A tag has been selected
     */
    addTag(tag) {
        const newTag = {
            category: tag.category,
            title: tag.key
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;

        this.props.addTagToImage({
            tag: newTag,
            currentIndex,
            quantityChanged: false
        });

        // clears text filed after one tag is selected
        this.setState({ text: '' });
    }

    /**
     * Add custom tag to images
     * only 3 custom tags can be added per image
     */

    addCustomTag = async () => {
        // reset tags error
        this.setState({ customTagError: '' });
        const isCustomTagValid = await this.validateCustomTag();

        if (isCustomTagValid) {
            // currentGlobalIndex
            const currentIndex = this.props.swiperIndex;

            this.props.addCustomTagToImage({
                tag: this.state.text,
                currentIndex
            });
            this.updateText('');
        }
    };

    /**
     * fn to validate custom tags
     *
     * should be between 3-100 characters length
     * should be unique (case insensitive)
     * max 3 custom tags per image
     *
     */
    validateCustomTag = async () => {
        const inputText = this.state.text;
        const customTagsArray = this.props.images[this.props.swiperIndex]
            ?.customTags;
        let result = false;

        // check min 3 and max 100 characters
        if (inputText.length >= 3 && inputText.length < 100) {
            result = true;
        } else {
            this.setState({
                customTagError: 'Tag should be 3 - 100 characters long'
            });
            return false;
        }

        // check if tag already exist
        if (
            await customTagsArray.some(
                tag => tag.toLowerCase() === inputText.toLowerCase()
            )
        ) {
            this.setState({
                customTagError: 'Tag already added'
            });
            return false;
        } else {
            result = true;
        }

        // check if only 3 custom tags are added
        if (customTagsArray?.length <= 3) {
            result = true;
        } else {
            this.setState({
                customTagError: 'You can upload up to 3 custom tags'
            });
            return false;
        }

        return result;
    };

    /**
     *
     */
    clear() {
        this.setState({ text: '' });
    }

    /**
     * Update text
     */
    updateText(text) {
        this.setState({ text });

        this.props.suggestTags(text, this.props.lang);
    }

    /**
     * Close the litter picker and go back to the gallery screen
     */
    closeLitterPicker() {
        // litter_reducer
        this.props.resetLitterTags();

        this.props.navigation.navigate('HOME');
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

    render() {
        const lang = this.props.lang;
        const suggest = getTranslation(`${lang}.tag.type-to-suggest`);
        return (
            <View>
                <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                    <TextInput
                        style={styles.textFieldStyle}
                        placeholder={suggest}
                        placeholderTextColor={Colors.muted}
                        onChangeText={text => this.updateText(text)}
                        selectionColor="black"
                        blurOnSubmit={false}
                        clearButtonMode="always"
                        value={this.state.text}
                        onSubmitEditing={this.addCustomTag}
                    />
                    <Caption color="error">{this.state.customTagError}</Caption>
                </View>

                {this.props.isKeyboardOpen && (
                    <View style={styles.tagsOuterContainer}>
                        <View style={styles.suggest}>
                            <Caption
                                dictionary={`${lang}.tag.suggested-tags`}
                                values={{
                                    count:
                                        this.state.text === ''
                                            ? this.props.previousTags.length
                                            : this.props.suggestedTags.length
                                }}
                            />
                        </View>

                        <FlatList
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 10 }}
                            data={
                                this.state.text === ''
                                    ? this.props.previousTags
                                    : this.props.suggestedTags
                            }
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

const styles = StyleSheet.create({
    textFieldStyle: {
        width: SCREEN_WIDTH - 40,
        height: 60,
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 10,
        borderColor: Colors.muted,
        borderWidth: 0.5
    },

    category: {
        marginBottom: SCREEN_HEIGHT * 0.01
    },

    item: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    suggest: {
        marginBottom: 8,
        marginLeft: 20,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start'
    },
    tag: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: Colors.muted
    },
    tagsOuterContainer: {
        marginBottom: 40
    }
});

const mapStateToProps = state => {
    return {
        suggestedTags: state.litter.suggestedTags,
        swiperIndex: state.litter.swiperIndex,
        images: state.images.imagesArray,
        previousTags: state.images.previousTags
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterBottomSearch);
