import React, { Component } from 'react';
import { Text, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    Body,
    Title,
    SubTitle,
    Caption,
    AnimatedCircle,
    Header
} from '../components';
import { StatsCard } from './_components';

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
                            <SubTitle>Welcome</SubTitle>
                            <Caption>{user.username}</Caption>
                        </View>
                    }
                    rightContent={
                        <Pressable>
                            <Icon
                                name="ios-settings-outline"
                                color="#000"
                                size={24}
                                onPress={() => {
                                    this.props.navigation.navigate('SETTING');
                                }}
                            />
                        </Pressable>
                    }
                />
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}>
                    <AnimatedCircle
                        strokeWidth={30}
                        percentage={50}
                        color="#2C45FF"
                        value={4}
                        delay={500}
                        radius={150}
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
                                value="105"
                                title="Littercoins"
                                backgroundColor="#DEFFF8"
                                fontColor="#1F6E5D"
                            />
                        </View>
                    </View>
                </ScrollView>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
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
