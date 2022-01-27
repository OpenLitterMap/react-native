import React, { Component, createRef } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import { Header, Title, Colors, Body, SubTitle, Caption } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import {
    CreateTeamForm,
    JoinTeamForm,
    TopTeamsList,
    UserTeamsList
} from './teamComponents';
import SuccessModal from './teamComponents/SuccessModal';

class TeamScreen extends Component {
    constructor(props) {
        super(props);
        this.actionSheetRef = createRef();

        this.state = {
            showFormType: undefined
        };
    }
    componentDidMount() {
        this.props.getTopTeams(this.props.token);
        // this.props.getUserTeams(this.props.token);
    }

    actionSheetOnClose = () => {
        this.setState({ showFormType: undefined });
        this.props.clearTeamsFormError();
    };
    render() {
        const { topTeams, teamFormStatus, successMessage } = this.props;
        return (
            <>
                <Header
                    leftContent={<Title color="white">Teams</Title>}
                    rightContent={
                        <Pressable
                            onPress={() => {
                                this.actionSheetRef.current?.setModalVisible();
                            }}>
                            <Icon
                                color={Colors.white}
                                size={32}
                                name="ios-add-outline"
                            />
                        </Pressable>
                    }
                />
                <ScrollView
                    style={styles.container}
                    alwaysBounceVertical={false}>
                    {/* list of top 5 teams  */}
                    {/* Top Teams */}
                    <View style={styles.headingRow}>
                        <SubTitle>Top Teams</SubTitle>
                        <Pressable
                            onPress={() =>
                                this.props.navigation.navigate('TOP_TEAMS')
                            }>
                            <Caption color="accent">View All</Caption>
                        </Pressable>
                    </View>
                    <TopTeamsList topTeams={topTeams} />
                    {/* list of users teams */}
                    <UserTeamsList navigation={this.props.navigation} />
                </ScrollView>
                <ActionSheet
                    onClose={this.actionSheetOnClose}
                    gestureEnabled
                    ref={this.actionSheetRef}>
                    <View style={{ padding: 20 }}>
                        {teamFormStatus === null ? (
                            <>
                                {!this.state.showFormType ? (
                                    <>
                                        <Pressable
                                            onPress={() =>
                                                this.setState({
                                                    showFormType: 'JOIN'
                                                })
                                            }
                                            style={[
                                                styles.buttonStyle,
                                                {
                                                    backgroundColor:
                                                        Colors.accent
                                                }
                                            ]}>
                                            <Body color="white">
                                                JOIN A TEAM
                                            </Body>
                                        </Pressable>
                                        <Pressable
                                            onPress={() =>
                                                this.setState({
                                                    showFormType: 'CREATE'
                                                })
                                            }
                                            style={styles.buttonStyle}>
                                            <Body color="accent">
                                                CREATE A TEAM
                                            </Body>
                                        </Pressable>
                                    </>
                                ) : (
                                    <>
                                        {this.state.showFormType === 'JOIN' ? (
                                            <JoinTeamForm />
                                        ) : (
                                            <CreateTeamForm />
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <SuccessModal text={successMessage} />
                        )}
                        {/* <SuccessModal text="Congrats! you have joined a new team" /> */}
                    </View>
                </ActionSheet>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20
    },
    buttonStyle: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
    },
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        successMessage: state.teams.successMessage,
        topTeams: state.teams.topTeams,
        teamFormStatus: state.teams.teamFormStatus,
        token: state.auth.token
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamScreen);
