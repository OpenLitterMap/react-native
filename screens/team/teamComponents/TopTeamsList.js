import { StyleSheet, Text, View, Dimensions } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { SubTitle, Body, Caption, Colors } from '../../components';
import RankingMedal from './RankingMedal';

const { width } = Dimensions.get('window');
const TopTeamsList = ({ topTeams }) => {
    return (
        <>
            {topTeams.map((team, index) => (
                <View key={`${team.name}${index}`} style={styles.itemContainer}>
                    <View
                        style={{
                            flexDirection: 'row',
                            marginRight: 10,
                            flexShrink: 1
                        }}>
                        <RankingMedal index={index} />

                        <View
                            style={{
                                marginLeft: 20
                            }}>
                            <Body style={{ flexShrink: 1 }} numberOfLines={2}>
                                {team.name}
                            </Body>

                            <Caption>
                                {team.total_images.toLocaleString()} PHOTOS
                            </Caption>
                        </View>
                    </View>
                    <View>
                        <Caption style={styles.alignRight}>
                            {team.total_litter.toLocaleString()}
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
    itemContainer: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    alignRight: {
        textAlign: 'right'
    }
});
