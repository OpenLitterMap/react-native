import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Title, Header, Colors, StatsGrid } from '../components';
import { ProgressCircleCard } from './userComponents';

class UserStatsScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            xpStart: 0,
            positionStart: 0,
            totalImagesStart: 0,
            totalTagsStart: 0,
            levelStart: 0,
            levelPercentageStart: 0,
            littercoinStart: 0,
            littercoinPercentageStart: 0,
            isLoading: true
        };
    }

    async componentDidMount() {
        await this.getDataFromStorage();
    }

    async getDataFromStorage() {
        // data of previously viewd stats by user
        const previousStats = await AsyncStorage.getItem('previousUserStats');

        if (previousStats !== undefined && previousStats !== null) {
            const {
                xp,
                position,
                totalImages,
                totalTags,
                level,
                levelPercentage,
                littercoin,
                littercoinPercentage
            } = JSON.parse(previousStats);
            this.setState({
                xpStart: xp,
                positionStart: position,
                totalImagesStart: totalImages,
                totalTagsStart: totalTags,
                levelStart: level,
                levelPercentageStart: levelPercentage,
                littercoinStart: littercoin,
                littercoinPercentageStart: littercoinPercentage
            });
        }
        this.setState({ isLoading: false });
        this.fetchUserData();
    }

    async fetchUserData() {
        await this.props.fetchUser(this.props.token);
        const user = this.props.user;
        const statsObj = {
            xp: user?.xp,
            position: user?.position,
            totalImages: user?.total_images || 0,
            totalTags: user?.totalTags,
            level: user?.level,
            levelPercentage: user?.targetPercentage,
            littercoin: user?.totalLittercoin,
            littercoinPercentage: user?.total_images % 100
        };
        // INFO: previous stats saved for animation purpose
        // so value animates from previous viewd and current
        AsyncStorage.setItem('previousUserStats', JSON.stringify(statsObj));
    }

    render() {
        const user = this.props.user;
        const lang = this.props.lang;

        const statsData = [
            {
                value: user?.xp || this.state.xpStart,
                startValue: this.state.xpStart,
                title: `${lang}.user.XP`,
                icon: 'ios-medal-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: user?.position || this.state.positionStart,
                startValue: this.state.positionStart,
                title: `${lang}.user.rank`,
                icon: 'ios-podium-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF',
                ordinal: true
            },
            {
                value: user?.total_images || this.state.totalImagesStart,
                startValue: this.state.totalImagesStart,
                title: `${lang}.user.photos`,
                icon: 'ios-images-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: user?.totalTags || this.state.totalTagsStart,
                startValue: this.state.totalTagsStart,
                title: `${lang}.user.tags`,
                icon: 'ios-pricetags-outline',
                color: '#0EA5E9',
                bgColor: '#E0F2FE'
            }
        ];

        return (
            <>
                <Header
                    leftContent={
                        <View>
                            <Title
                                color="white"
                                dictionary={`${lang}.user.welcome`}
                            />
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
                {user === null || user === undefined || this.state.isLoading ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'white'
                        }}>
                        <ActivityIndicator size="small" color={Colors.accent} />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.container}
                        showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}>
                        <ProgressCircleCard
                            lang={lang}
                            level={user?.level}
                            levelStart={this.state.levelStart}
                            levelPercentage={user?.targetPercentage}
                            levelPercentageStart={
                                this.state.levelPercentageStart
                            }
                            xpRequired={user?.xpRequired}
                            totalLittercoin={user?.totalLittercoin}
                            littercoinStart={this.state.littercoinStart}
                            littercoinPercentage={user?.total_images % 100}
                            littercoinPercentageStart={
                                this.state.littercoinPercentageStart
                            }
                        />

                        <StatsGrid statsData={statsData} />
                    </ScrollView>
                )}
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

const mapStateToProps = (state) => {
    return {
        lang: state.auth.lang,
        token: state.auth.token,
        user: state.auth.user
    };
};

export default connect(mapStateToProps, actions)(UserStatsScreen);
