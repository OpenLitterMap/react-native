import { ScrollView, Pressable, StyleSheet } from 'react-native';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Header, Title, Colors, Body } from '../components';
import { TopTeamsList } from './teamComponents';

export class TopTeamsScreen extends Component {
    render() {
        const { topTeams } = this.props;
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
                    centerContent={<Title color="white">Top Teams</Title>}
                    centerContainerStyle={{ flex: 2 }}
                />
                <ScrollView
                    style={styles.container}
                    alwaysBounceVertical={false}
                    contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* list of top 5 teams  */}
                    <TopTeamsList topTeams={topTeams} />
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
        topTeams: state.teams.topTeams
    };
};

export default connect(
    mapStateToProps,
    null
)(TopTeamsScreen);
