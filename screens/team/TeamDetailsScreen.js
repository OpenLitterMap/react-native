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
import {
    Header,
    Title,
    Colors,
    Body,
    Caption,
    StatsGrid,
    IconStatsCard,
    Button
} from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
class TeamDetailsScreen extends Component {
    constructor(props) {
        super(props);
        this.actionSheetRef = createRef();
    }
    leave = async () => {
        console.log('called');
        await this.props.leaveTeam(
            this.props.token,
            this.props.selectedTeam.id
        );

        this.actionSheetRef.current.hide();
        this.props.navigation.navigate('TEAM_HOME');
    };

    render() {
        const { lang, selectedTeam } = this.props;
        const teamStats = [
            {
                value: selectedTeam?.total_litter || 0,
                title: `${lang}.stats.total-litter`,
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: selectedTeam?.total_images || 0,
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
                        title={`${lang}.team.total-members`}
                        contentCenter
                        backgroundColor="#FEF9C3"
                        fontColor="#F59E0B"
                        style={{ marginHorizontal: 20 }}
                    />
                    {selectedTeam?.members > 1 && (
                        <Button
                            onPress={() =>
                                this.actionSheetRef.current?.setModalVisible()
                            }>
                            <Body color="white">LEAVE TEAM</Body>
                        </Button>
                    )}
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
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-around',
                                marginVertical: 40,
                                width: SCREEN_WIDTH - 40
                            }}>
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
