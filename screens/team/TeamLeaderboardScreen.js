import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, FlatList, ActivityIndicator} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header, Colors, Body, SubTitle } from '../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { MemberCard, TeamTitle } from './teamComponents';
import { getTeamMembers } from "../../reducers/team_reducer";
import { useDispatch, useSelector } from "react-redux";

const TeamLeaderboardScreen = ({ navigation }) => {

    const dispatch = useDispatch();
    const {t} = useTranslation();

    const [isLoading, setIsLoading] = useState(false);

    // useSelected
    const selectedTeam = useSelector(state => state.teams.selectedTeam);
    const teamMembers = useSelector(state => state.teams.teamMembers);
    const memberNextPage = useSelector(state => state.teams.memberNextPage);

    useEffect(() => {
        if (memberNextPage === 1) {
            loadTeamMembers();
        }
    }, []);

    const renderItem = ({ item, index }) => {
        return (
            <MemberCard
                data={item}
                teamId={selectedTeam?.id}
                index={index}
            />
        );
    };

    const loadTeamMembers = async () => {
        setIsLoading(true);

        try {
            await dispatch(getTeamMembers({
                teamId: selectedTeam?.id,
                page: memberNextPage
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header
                leftContent={
                    <Pressable
                        onPress={() => navigation.goBack()}>
                        <Icon
                            name="chevron-back-outline"
                            color={Colors.white}
                            size={24}
                        />
                    </Pressable>
                }
                centerContent={
                    <SubTitle color="white">{t('Leaderboard')}</SubTitle>
                }
                centerContainerStyle={{ flex: 2 }}
            />
            <View style={styles.container}>
                <TeamTitle
                    teamName={selectedTeam?.name}
                    identifier={selectedTeam.identifier}
                />
                <FlatList
                    contentContainerStyle={styles.flatListStyle}
                    alwaysBounceVertical={false}
                    data={teamMembers}
                    showsVerticalScrollIndicator={false}
                    renderItem={ ({ item, index }) => renderItem({ item, index }) }
                    keyExtractor={item => `team-${item.id}`}
                    ListFooterComponent={
                        <>
                            {memberNextPage && (
                                <>
                                    <Pressable
                                        disabled={isLoading}
                                        style={{ alignItems: 'center' }}
                                        onPress={loadTeamMembers}>
                                        {isLoading ? (
                                            <ActivityIndicator
                                                color={Colors.accent}
                                            />
                                        ) : (
                                            <Body color="accent">
                                                {t('Load More')}
                                            </Body>
                                        )}
                                    </Pressable>
                                </>
                            )}
                        </>
                    }
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        paddingTop: 0,
        padding: 20
    },
    flatListStyle: {
        marginVertical: 20,
        paddingBottom: 20
    }
});

export default TeamLeaderboardScreen;
