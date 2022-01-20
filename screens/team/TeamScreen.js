import React, { Component } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Header, Title } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import { TopTeamsList, UserTeamsList } from './teamComponents';

class TeamScreen extends Component {
    componentDidMount() {
        this.props.getTopTeams();
        this.props.getUserTeams(this.props.token);
    }
    render() {
        const { user, userTeams, topTeams } = this.props;
        return (
            <>
                <Header leftContent={<Title color="white">Teams</Title>} />
                <ScrollView
                    style={styles.container}
                    alwaysBounceVertical={false}>
                    <TopTeamsList topTeams={topTeams.slice(0, 5)} />
                    <UserTeamsList
                        userTeams={userTeams}
                        activeTeam={user?.active_team}
                    />
                </ScrollView>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        topTeams: state.teams.topTeams,
        token: state.auth.token,
        user: state.auth.user,
        userTeams: state.teams.userTeams
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamScreen);
