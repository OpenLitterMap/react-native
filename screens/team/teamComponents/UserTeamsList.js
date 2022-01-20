import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { SubTitle, Body, Caption, Colors } from '../../components';

const UserTeamsList = ({ userTeams, activeTeam }) => {
    return (
        <>
            {/* Users Teams */}
            <View style={[styles.headingRow, { marginTop: 20 }]}>
                <SubTitle>My Teams</SubTitle>
                {/* <Caption color="accent">View All</Caption> */}
            </View>
            {userTeams.map((team, index) => (
                <View key={`${team.name}${index}`} style={styles.itemContainer}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                        {activeTeam === team.id && (
                            <Icon
                                name="ios-star-sharp"
                                size={24}
                                color={Colors.accent}
                            />
                        )}
                        <View
                            style={{
                                marginLeft: activeTeam !== team.id ? 44 : 20
                            }}>
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

export default UserTeamsList;
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
