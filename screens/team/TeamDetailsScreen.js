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
                        <Pressable
                            onPress={() => this.props.navigation.goBack()}>
                            <Icon
                                name="ios-chevron-back-outline"
                                color={Colors.white}
                                size={24}
                            />
                        </Pressable>
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
                    <View
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 20
                        }}>
                        <Title>{selectedTeam?.name}</Title>
                        <Caption>{selectedTeam.identifier}</Caption>
                    </View>
                    <StatsGrid statsData={teamStats} />

                    <IconStatsCard
                        imageContent={
                            <Icon
                                name="ios-person-outline"
                                size={36}
                                color="#F59E0B"
                            />
                        }
                        value={selectedTeam?.members}
                        // startValue={stat.startValue}
                        title={`${lang}.team.total-members`}
                        contentCenter
                        backgroundColor="#FEF9C3"
                        fontColor="#F59E0B"
                        // ordinal={stat.ordinal}
                        // width={width / 2 - 30}
                        style={{ marginHorizontal: 20 }}
                    />

                    <Pressable style={[styles.buttonStyle]}>
                        <Body color="white">LEAVE TEAM</Body>
                    </Pressable>
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
        marginTop: 60,
        margin: 20,
        backgroundColor: Colors.accent
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
