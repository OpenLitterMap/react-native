import React, { Component } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Dimensions,
    Animated,
    Pressable
} from 'react-native';
import { Colors, Body, Caption } from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * component to show added tags on image when AddTags screen is opened
 * shown below Litter Status card
 *
 * Loop over Array of keys of tag Object to get Categories
 * Then loop again Key of categories Object to get individual tag and its quantity
 *
 * tag : {
 * "category" : {
 *          "tag1" : quantity
 *          }
 * }
 * @param {Object} tag -- > Object of tags
 * @param {String} lang --> Selected Global Language
 * @returns
 */
class LitterTagsCard extends Component {
    state = {
        animation: new Animated.Value(200),
        boxState: 'CLOSE'
    };

    boxAnimation = () => {
        if (this.state.boxState === 'CLOSE') {
            Animated.timing(this.state.animation, {
                toValue: SCREEN_HEIGHT / 2,
                duration: 200,
                useNativeDriver: false
            }).start(() => this.setState({ boxState: 'OPEN' }));
        } else {
            Animated.timing(this.state.animation, {
                toValue: 200,
                duration: 200,
                useNativeDriver: false
            }).start(() => this.setState({ boxState: 'CLOSE' }));
        }
    };
    render() {
        const boxStyle = {
            height: this.state.animation
        };
        const { tags, lang } = this.props;
        return (
            <>
                {/* Only show if atleast one tag is present */}
                {Object?.keys(tags)?.length !== 0 && (
                    <Animated.View style={[styles.card, boxStyle]}>
                        <Caption>Tags</Caption>

                        <ScrollView
                            alwaysBounceVertical={false}
                            style={{ marginTop: 8 }}>
                            {Object?.keys(tags)?.map(category => {
                                return (
                                    <View key={category}>
                                        <Body
                                            dictionary={`${lang}.litter.categories.${category}`}
                                        />
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                flexWrap: 'wrap'
                                            }}>
                                            {Object?.keys(tags[category])?.map(
                                                tag => {
                                                    const value =
                                                        tags[category][tag];
                                                    return (
                                                        <View
                                                            key={tag}
                                                            style={
                                                                styles.tagBadges
                                                            }>
                                                            <Caption
                                                                color="text"
                                                                dictionary={`${lang}.litter.${category}.${tag}`}
                                                            />
                                                            <Caption color="text">
                                                                : {value} &nbsp;
                                                            </Caption>
                                                        </View>
                                                    );
                                                }
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <Pressable
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={this.boxAnimation}>
                            <Icon
                                name={
                                    this.state.boxState === 'CLOSE'
                                        ? 'chevron-down-outline'
                                        : 'chevron-up-outline'
                                }
                                size={32}
                            />
                        </Pressable>
                    </Animated.View>
                )}
            </>
        );
    }
}

export default LitterTagsCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        width: SCREEN_WIDTH - 40,
        borderRadius: 12,
        padding: 20,
        paddingBottom: 0,
        minHeight: 100
    },
    tagBadges: {
        flexDirection: 'row',
        backgroundColor: Colors.accentLight,
        marginRight: 10,
        marginVertical: 4,
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 4
    }
});
