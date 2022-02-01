import React, { Component, createRef } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Dimensions,
    Pressable,
    Animated,
    Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-community/clipboard';
import ActionSheet from 'react-native-actions-sheet';
import {
    Header,
    Title,
    Colors,
    Body,
    StatsGrid,
    Button,
    Caption
} from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
class TeamDetailsScreen extends Component {
    constructor(props) {
        super(props);
        this.actionSheetRef = createRef();

        this.state = {
            opacityAnimation: new Animated.Value(0)
        };
    }
    leave = async () => {
        await this.props.leaveTeam(
            this.props.token,
            this.props.selectedTeam.id
        );

        this.actionSheetRef.current.hide();
        this.props.navigation.navigate('TEAM_HOME');
    };

    copyIdentifier = async () => {
        Clipboard.setString(this.props.selectedTeam?.identifier);
        this.opacityAnmiation();
    };

    opacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start(this.returnOpacityAnmiation);
    };

    returnOpacityAnmiation = async () => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.elastic(1)
        }).start();
    };

    render() {
        const opacityStyle = {
            opacity: this.state.opacityAnimation
        };

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
                    <Pressable
                        onPress={this.copyIdentifier}
                        style={styles.titleContainer}>
                        <Title>{selectedTeam?.name}</Title>
                        <View style={{ flexDirection: 'row' }}>
                            <Body color="accent" style={{ marginRight: 10 }}>
                                {selectedTeam.identifier}
                            </Body>
                            <Icon
                                name="ios-copy-outline"
                                color={Colors.accent}
                                size={18}
                            />
                        </View>
                    </Pressable>
                    {/* Copied message */}
                    <Animated.View style={opacityStyle}>
                        <Caption color="accent" style={{ textAlign: 'center' }}>
                            Copied
                        </Caption>
                    </Animated.View>

                    <StatsGrid statsData={teamStats} />

                    {selectedTeam?.members > 1 && (
                        <Button
                            style={{ margin: 20 }}
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
                        <View style={styles.buttonContainer}>
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
    titleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    },
    actionButtonStyle: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 40,
        width: SCREEN_WIDTH - 40
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
