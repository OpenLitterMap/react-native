import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    ActivityIndicator
} from 'react-native';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    Body,
    Title,
    SubTitle,
    Caption,
    AnimatedCircle,
    Header,
    Colors
} from '../components';
import { StatsCard, RewardsList } from './_components';

class UserStatsScreen extends Component {
    constructor(props) {
        super(props);
        // console.log(JSON.stringify(this.props.user, null, '\t'));
    }

    render() {
        const user = this.props.user;

        // TODO: add a better loading screen add Skeleton Loading screen
        if (user === null || user === undefined) {
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <ActivityIndicator size="small" color={Colors.accent} />
                </View>
            );
        }
        return (
            <>
                <Header
                    leftContent={
                        <View>
                            <Title color="white">Welcome</Title>
                            <Body color="white">{user?.username}</Body>
                        </View>
                    }
                    rightContent={
                        <Pressable>
                            <Icon
                                name="ios-settings-outline"
                                color="white"
                                size={24}
                                onPress={() => {
                                    this.props.navigation.navigate('SETTING');
                                }}
                            />
                        </Pressable>
                    }
                />
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: 20
                    }}
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}>
                    <AnimatedCircle
                        strokeWidth={30}
                        percentage={user.targetPercentage}
                        color={`${Colors.accent}`}
                        value={user.level}
                        delay={500}
                        duration={5000}
                        radius={150}
                        tagline="Level"
                    />
                    <Body color="accent" style={{ textAlign: 'center' }}>
                        {user.xpRequired}XP more to level up
                    </Body>
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <StatsCard
                                value={`${user?.xp}`}
                                title="XP"
                                backgroundColor="#FDE5E5"
                                fontColor="#E12F2E"
                            />
                            <StatsCard
                                value={`${user?.level}`}
                                title="Level"
                                backgroundColor="#FDF2D3"
                                fontColor="#997028"
                            />
                        </View>
                        <View style={styles.statsRow}>
                            <StatsCard
                                value={`${user?.total_images}`}
                                title="Photos"
                                backgroundColor="#ECEEFF"
                                fontColor="#2C45FF"
                            />
                            <StatsCard
                                value={`${user?.total_brands +
                                    user?.total_tags}`}
                                title="Tags"
                                backgroundColor="#DEFFF8"
                                fontColor="#1F6E5D"
                            />
                        </View>
                    </View>
                    {/* ======= */}
                    {/* latest reward container */}
                    {/* <View style={[styles.statsContainer, { padding: 20 }]}>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}>
                            <SubTitle>Latest Rewards</SubTitle>
                            <Caption>View All</Caption>
                        </View>
                        <RewardsList />
                    </View> */}

                    {/* ======= */}
                </ScrollView>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    statsContainer: {
        marginTop: 20,
        padding: 10
    },
    statsRow: {
        justifyContent: 'space-between',
        flexDirection: 'row'
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        user: state.auth.user
    };
};

export default connect(
    mapStateToProps,
    actions
)(UserStatsScreen);