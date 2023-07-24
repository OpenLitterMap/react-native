import React, {PureComponent} from 'react';
import {Dimensions, FlatList, Pressable, StyleSheet, View} from 'react-native';
// @ts-ignore
import {getTranslation} from 'react-native-translation';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {
    addCustomTagToImage,
    addTagToImage,
    resetLitterTags,
    suggestTags
} from '../../../actions';
import {Body, Caption, Colors, CustomTextInput} from '../../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LitterBottomSearchProps {
    suggestedTags: any;
    swiperIndex: number;
    images: any;
    previousTags: any;
    lang: string;
    isKeyboardOpen: boolean;
    navigation: any;
}

interface LitterBottomSearchState {
    text: string;
    customTagError: string;
}

class LitterBottomSearch extends PureComponent<
    LitterBottomSearchProps,
    LitterBottomSearchState
> {
    constructor(props: LitterBottomSearchProps) {
        super(props);

        this.state = {
            text: '',
            customTagError: ''
        };
    }

    /**
     * A tag has been selected
     */
    addTag(tag: any) {
        // reset tags error
        this.setState({customTagError: ''});
        const newTag = {
            category: tag.category,
            title: tag.key
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;

        // images_actions
        addTagToImage({
            tag: newTag,
            currentIndex,
            quantityChanged: false
        });

        // clears text filed after one tag is selected
        this.setState({text: ''});
    }

    /**
     * Add custom tag to images
     * only 3 custom tags can be added per image
     */
    addCustomTag = async (tag: string) => {
        // reset tags error
        this.setState({customTagError: ''});
        const isCustomTagValid = await this.validateCustomTag(tag);

        if (isCustomTagValid) {
            // currentGlobalIndex
            const currentIndex = this.props.swiperIndex;

            // images_actions
            addCustomTagToImage({
                tag: tag,
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
     */
    validateCustomTag = async (inputText: string) => {
        const lang = this.props.lang;
        const customTagsArray =
            this.props.images[this.props.swiperIndex]?.customTags;
        let result = false;

        // check min 3 and max 100 characters
        if (inputText.length >= 3 && inputText.length < 100) {
            result = true;
        } else {
            inputText.length < 3
                ? this.setState({
                      customTagError: `${lang}.tag.custom-tags-min`
                  })
                : this.setState({
                      customTagError: `${lang}.tag.custom-tags-max`
                  });
            return false;
        }

        // below checks are only required if customTagsArray is defined
        // on a new image it's undefined till at least one custom tag is added
        if (customTagsArray) {
            // check if tag already exist
            if (
                await customTagsArray?.some(
                    (tag: string) =>
                        tag.toLowerCase() === inputText.toLowerCase()
                )
            ) {
                this.setState({
                    customTagError: `${lang}.tag.tag-already-added`
                });
                return false;
            } else {
                result = true;
            }

            // check if only 10 custom tags are added
            if (customTagsArray?.length < 10) {
                result = true;
            } else {
                this.setState({
                    customTagError: `${lang}.tag.tag-limit-reached`
                });
                return false;
            }
        }

        return result;
    };

    /**
     *
     */
    clear() {
        this.setState({text: ''});
    }

    /**
     * Update text
     */
    updateText(text: string) {
        this.setState({text});

        suggestTags(text, this.props.lang);
    }

    /**
     * Close the litter picker and go back to the gallery screen
     */
    closeLitterPicker() {
        // litter_reducer
        resetLitterTags();

        this.props.navigation.navigate('HOME');
    }

    /**
     * Render a suggested tag
     */
    renderTag = ({item}: {item: any}) => {
        const isCustomTag = item?.category === 'custom-tag';
        return (
            <Pressable
                style={styles.tag}
                onPress={() => {
                    isCustomTag
                        ? this.addCustomTag(item.key)
                        : this.addTag(item);
                }}>
                <Caption
                    dictionary={`${this.props.lang}.litter.categories.${item.category}`}
                />
                {/* show translated tag only if it's not a custom tag */}
                <Body
                    style={styles.item}
                    dictionary={
                        !isCustomTag
                            ? `${this.props.lang}.litter.${item.category}.${item.key}`
                            : ''
                    }>
                    {item.key}
                </Body>
            </Pressable>
        );
    };

    render() {
        const lang = this.props.lang;
        const suggest = getTranslation(`${lang}.tag.type-to-suggest`);

        // @ts-ignore
        return (
            <View>
                <View
                    style={{
                        paddingHorizontal: 20,
                        marginBottom: 10
                    }}>
                    <CustomTextInput
                        autoCorrect={false}
                        style={styles.textFieldStyle}
                        placeholder={suggest}
                        placeholderTextColor={Colors.muted}
                        onChangeText={(text: string) => this.updateText(text)}
                        blurOnSubmit={false}
                        clearButtonMode="always"
                        value={this.state.text}
                        onSubmitEditing={() =>
                            this.addCustomTag(this.state.text)
                        }
                        touched={!!this.state.customTagError}
                        error={this.state.customTagError}
                    />
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
                            contentContainerStyle={{paddingHorizontal: 10}}
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
        paddingLeft: 10
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    suggest: {
        marginBottom: 5,
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
        marginBottom: 0
    }
});

const mapStateToProps = (state: any) => {
    return {
        suggestedTags: state.litter.suggestedTags,
        swiperIndex: state.litter.swiperIndex,
        images: state.images.imagesArray,
        previousTags: state.images.previousTags
    };
};

export default connect(mapStateToProps, actions)(LitterBottomSearch);
