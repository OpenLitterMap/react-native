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
    Colors,
    StatsGrid,
    AnimatedText
} from '../components';

class UserStatsScreen extends Component {
    constructor(props) {
        super(props);
        console.log('=========>');
        // console.log(JSON.stringify(this.props.user, null, '\t'));
    }

    render() {
        const user = this.props.user;

        const statsData = [
            {
                value: `${user?.xp.toLocaleString()}`,
                title: 'XP',
                icon: 'ios-medal-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: `${user?.position.toLocaleString()}`,
                title: 'Rank',
                icon: 'ios-podium-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: `${user?.total_images?.toLocaleString() || 0}`,
                title: 'Photos',
                icon: 'ios-images-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: `${(
                    user?.total_brands + user?.total_tags
                ).toLocaleString()}`,
                title: 'Tags',
                icon: 'ios-pricetags-outline',
                color: '#0EA5E9',
                bgColor: '#E0F2FE'
            }
        ];

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
                        radius={160}
                        tagline="Level"
                    />
                    <Body color="accent" style={{ textAlign: 'center' }}>
                        {user.xpRequired}XP more to level up
                    </Body>

                    <StatsGrid statsData={statsData} />
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
