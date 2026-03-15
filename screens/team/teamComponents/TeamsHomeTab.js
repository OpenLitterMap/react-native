import React from 'react';
import {
    ScrollView,
    View,
    Pressable,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Colors, SubTitle, Caption, Body, Button} from '../../components';
import TopTeamsList from './TopTeamsList';
import UserTeamsList from './UserTeamsList';

const TeamsHomeTab = ({onCreateTeam, onJoinTeam}) => {
    const navigation = useNavigation();
    const {t} = useTranslation();
    const topTeams = useSelector(state => state.teams.topTeams);
    const userTeams = useSelector(state => state.teams.userTeams);
    const topTeamsStatus = useSelector(state => state.teams.topTeamsStatus);
    const isLoading = topTeamsStatus === 'loading' || topTeamsStatus === 'idle';

    const hasNoTeams = !userTeams || userTeams.length === 0;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.accent} />
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={{paddingBottom: 20}}
            style={styles.container}
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}>
            <View style={styles.headingRow}>
                <SubTitle>{t('Top Teams')}</SubTitle>
                <Pressable
                    onPress={() => navigation.navigate('TOP_TEAMS')}
                    style={{padding: 5}}>
                    <Caption color="accent">{t('View All')}</Caption>
                </Pressable>
            </View>
            <TopTeamsList topTeams={topTeams?.slice(0, 3)} />

            {hasNoTeams ? (
                <View style={styles.emptyTeamsContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Icon
                            name="people-outline"
                            size={32}
                            color={Colors.accent}
                        />
                    </View>
                    <Body style={styles.emptyTitle}>
                        {t('Join a team to get started')}
                    </Body>
                    <Caption color="muted" style={styles.emptyText}>
                        {t('Collaborate with others and track your collective impact on the environment.')}
                    </Caption>
                    <View style={styles.emptyButtonRow}>
                        <Pressable
                            onPress={onCreateTeam}
                            style={styles.emptyButton}>
                            <Icon
                                name="add-circle-outline"
                                size={20}
                                color={Colors.accent}
                            />
                            <Body color="accent" style={styles.emptyButtonText}>
                                {t('Create')}
                            </Body>
                        </Pressable>
                        <Pressable
                            onPress={onJoinTeam}
                            style={styles.emptyButton}>
                            <Icon
                                name="log-in-outline"
                                size={20}
                                color={Colors.accent}
                            />
                            <Body color="accent" style={styles.emptyButtonText}>
                                {t('Join')}
                            </Body>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <UserTeamsList
                    navigation={navigation}
                    onCreateTeam={onCreateTeam}
                    onJoinTeam={onJoinTeam}
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20
    },
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyTeamsContainer: {
        marginTop: 24,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center'
    },
    emptyIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    emptyTitle: {
        textAlign: 'center',
        marginBottom: 4
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 8
    },
    emptyButtonRow: {
        flexDirection: 'row',
        gap: 12
    },
    emptyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.accentLight,
        borderRadius: 10,
        paddingVertical: 12
    },
    emptyButtonText: {
        fontWeight: '600'
    }
});

export default TeamsHomeTab;
