import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import {Header} from '../components';
import {JoinTeamForm, CreateTeamForm} from './teamComponents';
import StatusModal from './teamComponents/StatusModal';
import LocationsTeamsWrapper from './teamComponents/LocationsTeamsWrapper';
import {useDispatch, useSelector} from 'react-redux';
import {getTopTeams, clearTeamsForm} from '../../reducers/team_reducer';

const TeamScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const actionSheetRef = useRef(null);

    const [showFormType, setShowFormType] = useState(null);

    const teamFormStatus = useSelector(state => state.teams.teamFormStatus);
    const successMessage = useSelector(state => state.teams.successMessage);

    useEffect(() => {
        dispatch(getTopTeams());
    }, []);

    const actionSheetOnClose = () => {
        setShowFormType(null);
        dispatch(clearTeamsForm());
    };

    const onBackPress = () => {
        setShowFormType(null);
        dispatch(clearTeamsForm());
    };

    const openCreateForm = () => {
        setShowFormType('CREATE');
        actionSheetRef.current?.show();
    };

    const openJoinForm = () => {
        setShowFormType('JOIN');
        actionSheetRef.current?.show();
    };

    return (
        <>
            <Header />

            <LocationsTeamsWrapper
                onCreateTeam={openCreateForm}
                onJoinTeam={openJoinForm}
            />

            <ActionSheet
                onClose={actionSheetOnClose}
                gestureEnabled
                ref={actionSheetRef}>
                <View style={{padding: 20}}>
                    {teamFormStatus !== null ? (
                        <StatusModal
                            text={successMessage}
                            type="SUCCESS"
                        />
                    ) : showFormType === 'JOIN' ? (
                        <JoinTeamForm backPress={onBackPress} />
                    ) : showFormType === 'CREATE' ? (
                        <CreateTeamForm backPress={onBackPress} />
                    ) : null}
                </View>
            </ActionSheet>
        </>
    );
};

export default TeamScreen;
