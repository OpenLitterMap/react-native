import React from 'react';
import { ScrollView, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSelector } from "react-redux";
import Icon from 'react-native-vector-icons/Ionicons';
import { Header, Title, Colors } from '../components';
import { TopTeamsList } from './teamComponents';

const TopTeamsScreen = ({ navigation }) => {

    const topTeams = useSelector(state => state.teams.topTeams);
    const isLoading = !topTeams || topTeams.length === 0;

    return (
        <>
            <Header
                leftContent={
                    <Pressable onPress={() => navigation.navigate('TEAM_HOME')}>
                        <Icon
                            name="chevron-back-outline"
                            color={Colors.white}
                            size={24}
                        />
                    </Pressable>
                }
                centerContent={<Title color="white">All Teams</Title>}
                centerContainerStyle={{ flex: 2 }}
            />

            {
                isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={Colors.accent} />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.container}
                        alwaysBounceVertical={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {/* list of top 5 teams */}
                        <TopTeamsList
                            topTeams={topTeams}
                        />
                    </ScrollView>
                )
            }
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default TopTeamsScreen;
