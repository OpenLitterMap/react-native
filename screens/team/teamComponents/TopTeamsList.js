import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { SubTitle, Body, Caption, Colors } from '../../components';
import RankingMedal from './RankingMedal';

const TopTeamsList = ({ topTeams }) => {
    return (
        <>
            {/* Top Teams */}
            <View style={styles.headingRow}>
                <SubTitle>Top Teams</SubTitle>
                <Caption color="accent">View All</Caption>
            </View>
            {topTeams.map((team, index) => (
                <View key={`${team.name}${index}`} style={styles.itemContainer}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                        <RankingMedal index={index} />

                        <View style={{ marginLeft: 20 }}>
                            <Body>{team.name}</Body>
                            <Caption>{team.total_images} PHOTOS</Caption>
                        </View>
                    </View>
                    <View>
                        <Caption style={styles.alignRight}>
                            {team.total_litter}
                        </Caption>
                        <Caption style={styles.alignRight}>LITTER</Caption>
                    </View>
                </View>
            ))}
        </>
    );
};

export default TopTeamsList;

const styles = StyleSheet.create({
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    itemContainer: {
        height: 60,
        // backgroundColor: Colors.accentLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    alignRight: {
        textAlign: 'right'
    }
});
