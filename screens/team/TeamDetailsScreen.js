import React, { Component, createRef } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import {
    Header,
    Title,
    Colors,
    Body,
    Caption,
    SubTitle,
    StatsGrid,
    IconStatsCard
} from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';

class TeamDetailsScreen extends Component {
    constructor(props) {
        super(props);
        // this.actionSheetRef = createRef();
    }

    render() {
        const { lang, selectedTeam } = this.props;
        const teamStats = [
            {
                value: selectedTeam?.total_litter,
                title: `${lang}.stats.total-litter`,
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: selectedTeam?.total_images,
                title: `${lang}.stats.total-photos`,
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            }
        ];

        return (
            <>
                <Header
                    leftContent={
                        <>
                            <Title color="white">{selectedTeam?.name}</Title>
                            <Caption color="white">
                                {selectedTeam.identifier}
                            </Caption>
                        </>
                    }
                    rightContent={
                        <Pressable>
                            <Icon
                                color={Colors.white}
                                size={24}
                                name="ios-settings-outline"
                            />
                        </Pressable>
                    }
                />
                <ScrollView
                    style={styles.container}
                    alwaysBounceVertical={false}>
                    {/* <Body style={{ paddingHorizontal: 20 }}>
                        {JSON.stringify(selectedTeam, null, 2)}
                    </Body> */}
                    <StatsGrid statsData={teamStats} />

                    <IconStatsCard
                        imageContent={
                            <Icon
                                name="ios-person-outline"
                                size={36}
                                color="#F59E0B"
                            />
                        }
                        value={selectedTeam?.member}
                        // startValue={stat.startValue}
                        title={`${lang}.team.total-members`}
                        contentCenter
                        backgroundColor="#FEF9C3"
                        fontColor="#F59E0B"
                        // ordinal={stat.ordinal}
                        // width={width / 2 - 30}
                        style={{ marginHorizontal: 20 }}
                    />

                    {/* <View
                        style={{
                            backgroundColor: '#FEF9C3',
                            marginHorizontal: 20,
                            borderRadius: 12,
                            height: 120,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                        <Body style={{ color: '#F59E0B' }}>
                            {selectedTeam?.members}
                        </Body>
                    </View> */}
                </ScrollView>
                {/* <ActionSheet
                    onClose={() => this.setState({ showFormType: undefined })}
                    gestureEnabled
                    ref={this.actionSheetRef}>
                    <View style={{ padding: 20 }}>
                        {!this.state.showFormType ? (
                            <>
                                <Pressable
                                    onPress={() =>
                                        this.setState({ showFormType: 'JOIN' })
                                    }
                                    style={[
                                        styles.buttonStyle,
                                        { backgroundColor: Colors.accent }
                                    ]}>
                                    <Body color="white">JOIN A TEAM</Body>
                                </Pressable>
                                <Pressable
                                    onPress={() =>
                                        this.setState({
                                            showFormType: 'CREATE'
                                        })
                                    }
                                    style={styles.buttonStyle}>
                                    <Body color="accent">CREATE A TEAM</Body>
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
                    </View>
                </ActionSheet> */}
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    buttonStyle: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
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
