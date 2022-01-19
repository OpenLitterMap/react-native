import React, { Component } from 'react';
import { Image, View, StyleSheet, ScrollView } from 'react-native';
import { Header, Title, SubTitle, Caption, Colors, Body } from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import RankingMedal from './teamComponents/RankingMedal';

class TeamScreen extends Component {
    componentDidMount() {
        this.props.getTopTeams();
        this.props.getUserTeams(this.props.token);
        console.log(this.props.user);
    }
    render() {
        const { user, userTeams, topTeams } = this.props;
        return (
            <>
                <Header leftContent={<Title color="white">Teams</Title>} />
                <ScrollView style={styles.container}>
                    {/* Top Teams */}
                    <View style={styles.headingRow}>
                        <SubTitle>Top Teams</SubTitle>
                        <Caption color="accent">View All</Caption>
                    </View>
                    {topTeams.map((team, index) => (
                        <View
                            key={`${team.name}${index}`}
                            style={styles.itemContainer}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                <RankingMedal index={index} />
                                {/* <Image
                                    source={require('../../assets/icons/gold-medal.png')}
                                    style={{ height: 24, width: 24 }}
                                    resizeMethod="resize"
                                    resizeMode="contain"
                                /> */}
                                {/* <Body>1</Body> */}
                                <View style={{ marginLeft: 20 }}>
                                    <Body>{team.name}</Body>
                                    <Caption>
                                        {team.total_images} PHOTOS
                                    </Caption>
                                </View>
                            </View>
                            <View>
                                <Caption style={styles.alignRight}>
                                    {team.total_litter}
                                </Caption>
                                <Caption style={styles.alignRight}>
                                    LITTER
                                </Caption>
                            </View>
                        </View>
                    ))}

                    {/* Users Teams */}
                    <View style={[styles.headingRow, { marginTop: 20 }]}>
                        <SubTitle>My Teams</SubTitle>
                        {/* <Caption color="accent">View All</Caption> */}
                    </View>
                    {userTeams.map((team, index) => (
                        <View
                            key={`${team.name}${index}`}
                            style={styles.itemContainer}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                {user?.active_team === team.id && (
                                    <Icon
                                        name="ios-star-sharp"
                                        size={24}
                                        color={Colors.accent}
                                    />
                                )}
                                <View
                                    style={{
                                        marginLeft:
                                            user?.active_team !== team.id
                                                ? 44
                                                : 20
                                    }}>
                                    <Body>{team.name}</Body>
                                    <Caption>
                                        {team.total_images} PHOTOS
                                    </Caption>
                                </View>
                            </View>
                            <View>
                                <Caption style={styles.alignRight}>
                                    {team.total_litter}
                                </Caption>
                                <Caption style={styles.alignRight}>
                                    LITTER
                                </Caption>
                            </View>
                        </View>
                    ))}
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
    },
    headingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    },
    itemContainer: {
        height: 60,
        // backgroundColor: Colors.accentLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    alignRight: {
        textAlign: 'right'
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
