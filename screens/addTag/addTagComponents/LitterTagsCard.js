import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Dimensions } from 'react-native';
import { Colors, Body, Caption } from '../../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Card component to show added tags on image when AddTags screen is opened
 * shown below Litter Status card
 *
 * @param {Object} tag -- > Object of tags
 * @param {String} lang --> Selected Global Language
 */

const LitterTagsCard = ({ tags, customTags, lang }) => {
    const isTagged =
        (customTags && customTags.length > 0) ||
        (tags && Object.keys(tags)?.length !== 0);
    return (
        <>
            {/* Only show if atleast one tag or one custom tag is present */}
            {isTagged && (
                <View style={[styles.card]}>
                    <Caption>Tags</Caption>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}
                        style={{ marginTop: 8 }}>
                        {customTags && (
                            <RenderCustomTags customTags={customTags} />
                        )}

                        <RenderTags tags={tags} lang={lang} />
                    </ScrollView>
                </View>
            )}
        </>
    );
};

/**
 * Component to render tags
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
 */

const RenderTags = ({ tags, lang }) => {
    return (
        <>
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
                            {Object?.keys(tags[category])?.map(tag => {
                                const value = tags[category][tag];
                                return (
                                    <View key={tag} style={styles.tagBadges}>
                                        <Caption
                                            color="text"
                                            dictionary={`${lang}.litter.${category}.${tag}`}
                                        />
                                        <Caption color="text">
                                            : {value} &nbsp;
                                        </Caption>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </>
    );
};

/**
 * component to render custom tags
 * @param {Array<string>} customTags
 */
const RenderCustomTags = ({ customTags }) => {
    return (
        <>
            <View>
                <Body>Custom Tags</Body>
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap'
                    }}>
                    {customTags?.map(tag => {
                        return (
                            <View key={tag} style={styles.tagBadges}>
                                <Caption color="text">{tag}</Caption>
                            </View>
                        );
                    })}
                </View>
            </View>
        </>
    );
};

export default LitterTagsCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        width: SCREEN_WIDTH - 40,
        borderRadius: 12,
        padding: 20,
        maxHeight: SCREEN_HEIGHT / 2
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
