import {
    Pressable,
    StyleSheet,
    View,
    FlatList,
    ActivityIndicator
} from 'react-native';
import React, { Component } from 'react';
import { Header, Colors, Body, Title, SubTitle } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { MemberCard } from './teamComponents';

class TeamLeaderboardScreen extends Component {
    constructor(props) {
        super(props);
        this.state = { isLoading: false };
    }
    componentDidMount() {
        this.props.memberNextPage === 1 && this.loadTeamMembers();
    }

    renderItem = ({ item, index }) => {
        return (
            <MemberCard
                data={item}
                teamId={this.props.selectedTeam.id}
                index={index}
            />
        );
    };

    loadTeamMembers = async () => {
        this.setState({ isLoading: true });
        await this.props.getTeamMembers(
            this.props.token,
            this.props.selectedTeam.id,
            this.props.memberNextPage
        );
        this.setState({ isLoading: false });
    };
    render() {
        const { selectedTeam } = this.props;
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
                    <Title style={{ textAlign: 'center' }}>
                        {selectedTeam.identifier}
                    </Title>
                    <FlatList
                        contentContainerStyle={styles.flatListStyle}
                        alwaysBounceVertical={false}
                        data={this.props.teamMembers}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) =>
                            this.renderItem({ item, index })
                        }
                        keyExtractor={item => `${item.id}`}
                        ListFooterComponent={
                            <>
                                {this.props.memberNextPage && (
                                    <>
                                        <Pressable
                                            disabled={this.state.isLoading}
                                            style={{ alignItems: 'center' }}
                                            onPress={this.loadTeamMembers}>
                                            {this.state.isLoading ? (
                                                <ActivityIndicator
                                                    color={Colors.accent}
                                                />
                                            ) : (
                                                <Body color="accent">
                                                    Load More
                                                </Body>
                                            )}
                                        </Pressable>
                                    </>
                                )}
                            </>
                        }
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
    },
    flatListStyle: {
        marginVertical: 20,
        paddingBottom: 20
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        selectedTeam: state.teams.selectedTeam,
        teamMembers: state.teams.teamMembers,
        memberNextPage: state.teams.memberNextPage
    };
};

export default connect(
    mapStateToProps,
    actions
)(TeamLeaderboardScreen);
