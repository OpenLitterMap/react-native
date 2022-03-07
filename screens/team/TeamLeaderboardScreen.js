import { Pressable, StyleSheet, View, FlatList } from 'react-native';
import React, { Component } from 'react';
import { Header, Colors, Body, Caption, SubTitle, Title } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import RankingMedal from './teamComponents/RankingMedal';

const RenderCard = ({ data, teamId, index }) => {
    const isActiveTeam = teamId === data?.team?.id;
    return (
        <View
            style={{
                borderWidth: 1,
                borderColor: '#eee',
                padding: 8,
                borderRadius: 8,
                marginBottom: 20,
                backgroundColor: 'white'
            }}>
            <View style={{ flexDirection: 'row' }}>
                <RankingMedal index={index} />
                <View style={{ marginLeft: 10 }}>
                    <SubTitle>{data?.name || 'Anonymous'}</SubTitle>
                    <Caption>{data?.username}</Caption>
                </View>
            </View>
            <View
                style={{
                    marginTop: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body>{data?.pivot?.total_photos}</Body>
                    <Caption>PHOTOS</Caption>
                </View>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body>{data?.pivot?.total_litter}</Body>
                    <Caption>LITTER</Caption>
                </View>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Body color={isActiveTeam ? 'accent' : 'warn'}>
                        {isActiveTeam ? 'Active' : 'Inactive'}
                    </Body>
                    <Caption>STATUS</Caption>
                </View>
            </View>
        </View>
    );
};

class TeamLeaderboardScreen extends Component {
    componentDidMount() {
        this.props.getTeamMembers(this.props.token, this.props.selectedTeam.id);
    }

    renderItem = ({ item, index }) => {
        return (
            <RenderCard
                data={item}
                teamId={this.props.selectedTeam.id}
                index={index}
            />
        );
    };
    render() {
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
                    centerContent={
                        <SubTitle color="white">Leaderboard</SubTitle>
                    }
                    centerContainerStyle={{ flex: 2 }}
                />
                <View style={styles.container}>
                    <FlatList
                        data={this.props.teamMembers}
                        renderItem={({ item, index }) =>
                            this.renderItem({ item, index })
                        }
                        keyExtractor={item => `${item.id}`}
                    />
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        padding: 20
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        selectedTeam: state.teams.selectedTeam,
        teamMembers: state.teams.teamMembers
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamLeaderboardScreen);
