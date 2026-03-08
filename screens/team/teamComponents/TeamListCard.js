import {StyleSheet, View} from 'react-native';
import React from 'react';
import RankingMedal from './RankingMedal';
import {Body, Caption} from '../../components';
import dayjs from '../../../utils/dayjs';

const TeamListCard = ({team, index, showRanking = true, leftContent}) => {
    const people = team.total_members || 0;

    return (
        <View style={styles.cardContainer}>
            <View style={styles.leftSection}>
                {showRanking ? <RankingMedal index={index} /> : leftContent}
                <View style={styles.nameContainer}>
                    <Body style={{flexShrink: 1}} numberOfLines={2}>
                        {team.name}
                    </Body>
                    <View style={styles.statsRow}>
                        <Caption>
                            {(team.total_images || 0).toLocaleString()} Photos
                        </Caption>
                        <Caption style={styles.statDivider}>|</Caption>
                        <Caption>
                            {(team.total_tags || 0).toLocaleString()} Tags
                        </Caption>
                        <Caption style={styles.statDivider}>|</Caption>
                        <Caption>
                            {people.toLocaleString()} People
                        </Caption>
                    </View>
                    {team.updated_at && (
                        <Caption style={styles.updatedAt}>
                            Updated {dayjs(team.updated_at).fromNow()}
                        </Caption>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginVertical: 6
    },
    leftSection: {
        flexDirection: 'row',
        flexShrink: 1,
        alignItems: 'center'
    },
    nameContainer: {
        marginLeft: 12,
        flexShrink: 1
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 4,
        alignItems: 'center',
        gap: 6
    },
    statDivider: {
        opacity: 0.3
    },
    updatedAt: {
        marginTop: 2,
        opacity: 0.5
    }
});

export default TeamListCard;
