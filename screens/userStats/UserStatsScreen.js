import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { fetchUser } from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Title, Header, Colors, StatsGrid } from '../components';
import { ProgressCircleCard } from './userComponents';

class UserStatsScreen extends Component {
    constructor(props) {
        super(props);
        /**
         * saving the initial start position for animation
         * if user is viewing the screen for first time animation starts from 0
         * rest of the time it animates from last seen value (saved in AsyncStore)
         */
        this.state = {
            xpStart: 0,
            positionStart: 0,
            totalImagesStart: 0,
            totalTagsStart: 0
        };
    }

    componentDidMount() {
        this.getDataFromStorage();
    }

    /**
     * fn to fetch last seen value from AsyncStore
     * and if "previousUserStats" value exists in AsyncStore
     * set it to state to be used as starting point of animation
     *
     * then call fn {@link UserStatsScreen.fetchUserData}
     */

    async getDataFromStorage() {
        // data of previously viewd stats by user
        const previousStats = await AsyncStorage.getItem('previousUserStats');

        if (previousStats !== undefined && previousStats !== null) {
            const { xp, position, totalImages, totalTags } = JSON.parse(
                previousStats
            );
            this.setState({
                xpStart: xp,
                positionStart: position,
                totalImagesStart: totalImages,
                totalTagsStart: totalTags
            });
        }
        this.fetchUserData();
    }

    /**
     * fn to fetch currently authenticated user data from backend
     * {@link fetchUser} action is called
     * the new user data from redux state is stored in asyncstorage
     * to be used as previously viewed value next time
     */
    async fetchUserData() {
        await fetchUser(this.props.token);
        const user = this.props.user;
        const statsObj = {
            xp: user?.xp,
            position: user?.position,
            totalImages: user?.total_images || 0,
            totalTags: user?.totalTags
        };
        // INFO: previous stats saved for animation purpose
        // so value animates from previous viewd and current
        AsyncStorage.setItem('previousUserStats', JSON.stringify(statsObj));
    }

    render() {
        /**
         * Currently authenticated user data
         */
        const user = this.props.user;
        /**
         * language selected by user from WelcomeScreen
         */
        const lang = this.props.lang;

        /**
         * Array of data for {@link StatsGrid} props
         * 1 -> user XP
         * 2 -> user position/rank
         * 3 -> user total images
         * 4 -> user total tags (user.total_tags + user.total_brands added in reducer )
         */
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
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}>
                    <ProgressCircleCard
                        lang={lang}
                        level={user?.level}
                        levelPercentage={user?.targetPercentage}
                        xpRequired={user?.xpRequired}
                        totalLittercoin={user?.totalLittercoin}
                        littercoinPercentage={user?.total_images % 100}
                    />

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
    { fetchUser }
)(UserStatsScreen);
