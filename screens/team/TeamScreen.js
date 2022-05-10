import React, { Component, createRef } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Text,
    Pressable,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import {
    Header,
    Title,
    Colors,
    Body,
    SubTitle,
    Caption,
    Button
} from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import {
    CreateTeamForm,
    JoinTeamForm,
    TopTeamsList,
    UserTeamsList
} from './teamComponents';
import StatusModal from './teamComponents/StatusModal';

class TeamScreen extends Component {
    constructor(props) {
        super(props);
        this.actionSheetRef = createRef();

        this.state = {
            showFormType: null,
            isLoading: true
        };
    }
    componentDidMount() {
        this.getTeams();
    }

    getTeams = async () => {
        await this.props.getTopTeams(this.props.token);
        this.setState({ isLoading: false });
    };

    actionSheetOnClose = () => {
        this.setState({ showFormType: null });
        this.props.clearTeamsFormError();
    };

    onBackPress = () => {
        this.setState({ showFormType: null });
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
                {/* loading state */}
                {this.state.isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={Colors.accent} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 20 }}
                        style={styles.container}
                        alwaysBounceVertical={false}
                        showsVerticalScrollIndicator={false}>
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
                        <TopTeamsList topTeams={topTeams?.slice(0, 5)} />
                        {/* list of users teams */}
                        <UserTeamsList navigation={this.props.navigation} />
                    </ScrollView>
                )}

                <ActionSheet
                    onClose={this.actionSheetOnClose}
                    gestureEnabled
                    ref={this.actionSheetRef}>
                    <View style={{ padding: 20 }}>
                        {teamFormStatus === null ? (
                            <>
                                {!this.state.showFormType ? (
                                    <>
                                        <Button
                                            onPress={() =>
                                                this.setState({
                                                    showFormType: 'JOIN'
                                                })
                                            }>
                                            <Body color="white">
                                                JOIN A TEAM
                                            </Body>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onPress={() =>
                                                this.setState({
                                                    showFormType: 'CREATE'
                                                })
                                            }>
                                            <Body color="accent">
                                                CREATE A TEAM
                                            </Body>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {this.state.showFormType === 'JOIN' ? (
                                            <JoinTeamForm
                                                backPress={this.onBackPress}
                                            />
                                        ) : (
                                            <CreateTeamForm
                                                backPress={this.onBackPress}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <StatusModal text={successMessage} type="SUCCESS" />
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
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
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
