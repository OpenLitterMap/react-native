import React from 'react';
import { FlatList, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useSelector } from "react-redux";
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Header, Title, Body, Colors } from '../components';
import { TeamListCard } from './teamComponents';

const TopTeamsScreen = ({ navigation }) => {

    const {t} = useTranslation();
    const topTeams = useSelector(state => state.teams.topTeams);
    const topTeamsStatus = useSelector(state => state.teams.topTeamsStatus);
    const loading = topTeamsStatus === 'loading' || topTeamsStatus === 'idle';

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
                centerContent={<Title color="white">{t('All Teams')}</Title>}
                centerContainerStyle={{ flex: 2 }}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.accent} />
                </View>
            ) : !topTeams.length ? (
                <View style={styles.emptyContainer}>
                    <Body color="muted">{t('No teams found')}</Body>
                </View>
            ) : (
                <FlatList
                    data={topTeams}
                    keyExtractor={(item, index) => `${item?.id || item?.name}${index}`}
                    renderItem={({ item, index }) => (
                        <TeamListCard team={item} index={index} />
                    )}
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    initialNumToRender={15}
                />
            )}
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
        alignItems: 'center',
        backgroundColor: 'white'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    }
});

export default TopTeamsScreen;
