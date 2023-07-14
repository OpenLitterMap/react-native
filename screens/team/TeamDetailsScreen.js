import React, { Component, createRef } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Dimensions,
    Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import { Header, Colors, Body, StatsGrid, Button } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import { TeamTitle } from './teamComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
class TeamDetailsScreen extends Component {
    constructor(props) {
        super(props);
        this.actionSheetRef = createRef();

        this.state = {
            isLoading: false
        };
    }

    /**
     * activate team
     */
    activateDisableTeam = async (teamId, isActiveTeam) => {
        this.setState({ isLoading: true });
        isActiveTeam
            ? await this.props.inactivateTeam(this.props.token)
            : await this.props.changeActiveTeam(this.props.token, teamId);

        this.setState({ isLoading: false });
    };
    /**
     * fn to leave a team and navigate back to Teams Home screen
     */
    leave = async () => {
        await this.props.leaveTeam(
            this.props.token,
            this.props.selectedTeam.id
        );

        this.actionSheetRef.current.hide();
        this.props.navigation.navigate('TEAM_HOME');
    };

    render() {
        const { lang, selectedTeam, user, token } = this.props;
        const isActiveTeam = user.active_team === selectedTeam?.id;
        const teamStats = [
            {
                value: selectedTeam?.total_images || 0,
                title: `${lang}.stats.total-photos`,
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: selectedTeam?.total_litter || 0,
                title: `${lang}.stats.total-litter`,
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: selectedTeam?.members || 0,
                title: `${lang}.team.total-members`,
                icon: 'ios-person-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            }
        ];

        return (
            <>
                <Header
                    leftContent={
                        <Pressable
                            onPress={() => this.props.navigation.goBack()}>
                            <Icon
                                name="ios-chevron-back-outline"
                                color={Colors.white}
                                size={24}
                            />
                        </Pressable>
                    }
                />
                <ScrollView
                    style={styles.container}
                    alwaysBounceVertical={false}>
                    <TeamTitle
                        teamName={selectedTeam?.name}
                        identifier={selectedTeam.identifier}
                    />

                    <StatsGrid statsData={teamStats} />
                    <View style={styles.buttonContainer}>
                        {/* Disbale/Activate team button */}
                        <Button
                            loading={this.state.isLoading}
                            variant="outline"
                            onPress={() => {
                                this.activateDisableTeam(
                                    selectedTeam.id,
                                    isActiveTeam
                                );
                            }}>
                            <Body color="accent">
                                {isActiveTeam
                                    ? 'DISABLE ACTIVE TEAM'
                                    : 'SET ACTIVE TEAM'}
                            </Body>
                        </Button>
                        {selectedTeam?.members > 1 && (
                            <Button
                                onPress={() =>
                                    this.actionSheetRef.current?.setModalVisible()
                                }>
                                <Body color="white">LEAVE TEAM</Body>
                            </Button>
                        )}
                        <Button
                            buttonColor="info"
                            onPress={
                                () => {
                                    this.props.navigation.navigate(
                                        'TEAM_LEADERBOARD'
                                    );
                                }
                                // this.props.getTeamMembers(
                                //     token,
                                //     selectedTeam.id
                                // )
                            }>
                            <Body color="white">SEE LEADERBOARD</Body>
                        </Button>
                    </View>
                </ScrollView>
                <ActionSheet
                    // onClose={() => this.setState({ showFormType: undefined })}
                    gestureEnabled
                    ref={this.actionSheetRef}>
                    <View style={{ padding: 20 }}>
                        <Body style={{ textAlign: 'center' }}>
                            Are you sure?
                        </Body>
                        <Body style={{ textAlign: 'center' }}>
                            You can always rejoin and your contribution will be
                            saved.
                        </Body>
                        <View style={styles.actionButtonContainer}>
                            <Pressable
                                onPress={() =>
                                    this.actionSheetRef.current?.hide()
                                }
                                style={[styles.actionButtonStyle]}>
                                <Body dictionary={`${lang}.tag.cancel`} />
                            </Pressable>
                            <Pressable
                                onPress={this.leave}
                                style={[
                                    styles.actionButtonStyle,
                                    { backgroundColor: Colors.error }
                                ]}>
                                <Body color="white">Yes, Leave</Body>
                            </Pressable>
                        </View>
                    </View>
                </ActionSheet>
            </>
        );
    }
}

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

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        topTeams: state.teams.topTeams,
        token: state.auth.token,
        user: state.auth.user,
        userTeams: state.teams.userTeams,
        selectedTeam: state.teams.selectedTeam
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamDetailsScreen);
