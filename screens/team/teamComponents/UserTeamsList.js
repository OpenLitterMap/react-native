import { StyleSheet, Pressable, View } from 'react-native';
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { SubTitle, Body, Caption, Colors } from '../../components';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import TeamListCard from './TeamListCard';

class UserTeamsList extends Component {
    componentDidMount() {
        this.props.getUserTeams(this.props.token);
    }

    setTeam = team => {
        this.props.setSelectedTeam(team);
        this.props.navigation.navigate('TEAM_DETAILS');
    };

    render() {
        const { userTeams, user } = this.props;
        const activeTeam = user?.active_team;
        return (
            <>
                {/* Users Teams */}
                <View style={[styles.headingRow, { marginTop: 20 }]}>
                    <SubTitle>My Teams</SubTitle>
                    {/* <Caption color="accent">View All</Caption> */}
                </View>
                {userTeams?.map((team, index) => (
                    <Pressable
                        onPress={() => this.setTeam(team)}
                        key={`${team.name}${index}`}>
                        <TeamListCard
                            team={team}
                            index={index}
                            showRanking={false}
                            leftContent={
                                <View style={{ height: 24, width: 24 }}>
                                    {activeTeam === team.id && (
                                        <Icon
                                            name="ios-star-sharp"
                                            size={24}
                                            color={Colors.accent}
                                        />
                                    )}
                                </View>
                            }
                        />
                    </Pressable>
                ))}
            </>
        );
    }
}

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        user: state.auth.user,
        userTeams: state.teams.userTeams
    };
};

export default connect(
    mapStateToProps,
    actions
)(UserTeamsList);

const styles = StyleSheet.create({
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    alignRight: {
        textAlign: 'right'
    }
});
