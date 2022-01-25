import React, { Component, createRef } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import { Header, Title, Colors, Body, CustomTextInput } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import {
    CreateTeamForm,
    JoinTeamForm,
    TopTeamsList,
    UserTeamsList
} from './teamComponents';

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
    render() {
        const { topTeams } = this.props;
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
                    <TopTeamsList topTeams={topTeams.slice(0, 5)} />
                    {/* list of users teams */}
                    <UserTeamsList navigation={this.props.navigation} />
                </ScrollView>
                <ActionSheet
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
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        topTeams: state.teams.topTeams,
        token: state.auth.token
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamScreen);
