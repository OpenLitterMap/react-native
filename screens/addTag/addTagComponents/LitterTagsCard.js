import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Colors, Body, Caption } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
const LitterTagsCard = ({ tags, lang }) => {
    return (
        <>
            {/* Only show if atleast one tag is present */}
            {Object?.keys(tags)?.length !== 0 && (
                <View style={styles.card}>
                    <Caption>Tags</Caption>

                    <View style={{ marginTop: 8 }}>
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
                    </View>
                </View>
            )}
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
        marginBottom: 20
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
