import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import RankingMedal from './RankingMedal';
import { Body, Caption } from '../../components';

const TeamListCard = ({ team, index, showRanking = true, leftContent }) => {
    return (
        <View key={`${team.name}${index}`} style={styles.itemContainer}>
            <View style={styles.titleRow}>
                {showRanking ? <RankingMedal index={index} /> : leftContent}

                <View style={styles.centerContainer}>
                    <Body style={{ flexShrink: 1 }} numberOfLines={2}>
                        {team.name}
                    </Body>

                    <Caption>
                        {team.total_images.toLocaleString()} PHOTOS
                    </Caption>
                </View>
            </View>
            <View style={styles.rightContainer}>
                <Caption style={styles.alignRight}>
                    {team.total_litter.toLocaleString()}
                </Caption>
                <Caption style={styles.alignRight}>LITTER</Caption>
            </View>
        </View>
    );
};

export default TeamListCard;

const styles = StyleSheet.create({
    itemContainer: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    titleRow: {
        flexDirection: 'row',
        flexShrink: 1
    },
    alignRight: {
        textAlign: 'right'
    },
    centerContainer: {
        marginHorizontal: 20
    },
    rightContainer: { marginLeft: 20 }
});
