import React, {useState, useRef} from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Dimensions,
    Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import {useTranslation} from 'react-i18next';
import {Header, Colors, Body, StatsGrid, Button} from '../components';
import {TeamTitle} from './teamComponents';
import {useDispatch, useSelector} from 'react-redux';
import {
    changeActiveTeam,
    inactivateTeam,
    leaveTeam
} from '../../reducers/team_reducer';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const TeamDetailsScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const actionSheetRef = useRef();
    const [isLoading, setIsLoading] = useState(false);

    const user = useSelector(state => state.auth.user);
    const selectedTeam = useSelector(state => state.teams.selectedTeam);

    /**
     * activate team
     */
    const activateDisableTeam = async (teamId, isActiveTeam) => {
        setIsLoading(true);

        try {
            isActiveTeam
                ? await dispatch(inactivateTeam())
                : await dispatch(changeActiveTeam({teamId}));
        } finally {
            setIsLoading(false);
        }
    };
    /**
     * fn to leave a team and navigate back to Teams Home screen
     */
    const leave = async () => {
        await dispatch(leaveTeam({teamId: selectedTeam.id}));

        actionSheetRef.current.hide();

        navigation.navigate('TEAM_HOME');
    };

    const isActiveTeam = user?.active_team === selectedTeam?.id;

    const teamStats = [
        {
            value: selectedTeam?.total_images || 0,
            title: t('Total Photos'),
            icon: 'images-outline',
            color: '#A855F7',
            bgColor: '#F3E8FF'
        },
        {
            value: selectedTeam?.total_tags || 0,
            title: t('Total Tags'),
            icon: 'trash-outline',
            color: '#14B8A6',
            bgColor: '#CCFBF1'
        },
        {
            value: selectedTeam?.total_members || 0,
            title: t('Total People'),
            icon: 'person-outline',
            color: '#F59E0B',
            bgColor: '#FEF9C3'
        }
    ];

    return (
        <>
            <Header
                leftContent={
                    <Pressable onPress={() => navigation.goBack()}>
                        <Icon
                            name="chevron-back-outline"
                            color={Colors.white}
                            size={24}
                        />
                    </Pressable>
                }
            />
            <ScrollView style={styles.container} alwaysBounceVertical={false}>
                <TeamTitle
                    teamName={selectedTeam?.name}
                    identifier={selectedTeam?.identifier}
                />

                <StatsGrid statsData={teamStats} />

                <View style={styles.buttonContainer}>
                    {/* Disable/Activate team button */}
                    <Button
                        color="info"
                        loading={isLoading}
                        variant="outline"
                        onPress={() => {
                            activateDisableTeam(selectedTeam?.id, isActiveTeam);
                        }}>
                        <Body color="accent">
                            {isActiveTeam
                                ? t('Disable Active Team')
                                : t('Set Active Team')}
                        </Body>
                    </Button>

                    {(selectedTeam?.total_members || 0) > 1 && (
                        <Button onPress={() => actionSheetRef.current?.show()}>
                            <Body color="white">{t('Leave Team')}</Body>
                        </Button>
                    )}
                    <Button
                        buttonColor="info"
                        onPress={() => navigation.navigate('TEAM_LEADERBOARD')}>
                        <Body color="white">{t('See Leaderboard')}</Body>
                    </Button>
                </View>
            </ScrollView>
            <ActionSheet
                gestureEnabled
                ref={actionSheetRef}>
                <View style={{padding: 20}}>
                    <Body style={{textAlign: 'center'}}>{t('Are you sure?')}</Body>
                    <Body style={{textAlign: 'center'}}>
                        {t('You can always rejoin and your contribution will be saved.')}
                    </Body>
                    <View style={styles.actionButtonContainer}>
                        <Pressable
                            onPress={() => actionSheetRef.current?.hide()}
                            style={[styles.actionButtonStyle]}>
                            <Body dictionary={'Cancel'} />
                        </Pressable>
                        <Pressable
                            onPress={leave}
                            style={[
                                styles.actionButtonStyle,
                                {backgroundColor: Colors.error}
                            ]}>
                            <Body color="white">{t('Yes, Leave')}</Body>
                        </Pressable>
                    </View>
                </View>
            </ActionSheet>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    actionButtonStyle: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 40,
        width: SCREEN_WIDTH - 40
    },
    buttonContainer: {
        margin: 20
    }
});

export default TeamDetailsScreen;
