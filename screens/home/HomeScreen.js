import React, { Component } from 'react';
import {
    Text,
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    Image,
    FlatList
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

class HomeScreen extends Component {
    constructor(props) {
        super(props);
        console.log(JSON.stringify(this.props.user, null, '\t'));
    }

    render() {
        const user = this.props.user;

        return (
            <>
                <Header
                    leftContent={
                        <View>
                            <Title color="white">Welcome</Title>
                            <Body color="white">{user.username}</Body>
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
                        paddingBottom: 100,
                        paddingTop: 20
                    }}
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}>
                    <AnimatedCircle
                        strokeWidth={30}
                        percentage={50}
                        color={`${Colors.accent}`}
                        value={4}
                        delay={500}
                        radius={150}
                        tagline="Level"
                    />

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
                                value={`${
                                    user?.littercoin_owed !== null
                                        ? user?.littercoin_owed
                                        : 0
                                }`}
                                title="Littercoins"
                                backgroundColor="#DEFFF8"
                                fontColor="#1F6E5D"
                            />
                        </View>
                    </View>
                    {/* ======= */}
                    {/* latest reward container */}
                    <View style={[styles.statsContainer, { padding: 20 }]}>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}>
                            <SubTitle>Latest Rewards</SubTitle>
                            <Caption>View All</Caption>
                        </View>
                        <RewardsList />
                    </View>

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
)(HomeScreen);
