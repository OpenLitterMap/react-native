import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Body, Caption, Colors, Header, IconStatsCard, StatsGrid, SubTitle, Title } from '../components';
import { ProgressCircleCard } from './userComponents';
import { fetchUser } from "../../reducers/auth_reducer";
import { getStats } from "../../reducers/stats_reducer";
import { useDispatch, useSelector } from "react-redux";
import ShowMyUploadsButton from "./userComponents/ShowMyUploadsButton";

const UserStatsScreen = ({ navigation }) => {

    const dispatch = useDispatch();

    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const totalTags = useSelector(state => state.stats.totalTags);
    const totalImages = useSelector(state => state.stats.totalImages);
    const totalUsers = useSelector(state => state.stats.totalUsers);
    const newUsersToday = useSelector(state => state.stats.newUsersToday);
    const newUsersLast7Days = useSelector(state => state.stats.newUsersLast7Days);
    const newUsersLast30Days = useSelector(state => state.stats.newUsersLast30Days);

    const [xpStart, setXpStart] = useState(0);
    const [positionStart, setPositionStart] = useState(0);
    const [totalImagesStart, setTotalImagesStart] = useState(0);
    const [totalTagsStart, setTotalTagsStart] = useState(0);
    const [levelStart, setLevelStart] = useState(0);
    const [levelPercentageStart, setLevelPercentageStart] = useState(0);
    const [littercoinStart, setLittercoinStart] = useState(0);
    const [littercoinPercentageStart, setLittercoinPercentageStart] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                await getDataFromStorage();
                await dispatch(fetchUser(token));
                await dispatch(getStats());
                await fetchUserData();
            };

            fetchData();
        }, [token])
    );

    const getDataFromStorage = async () => {

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

            setXpStart(xp);
            setPositionStart(position);
            setTotalImagesStart(totalImages);
            setTotalTagsStart(totalTags);
            setLevelStart(level);
            setLevelPercentageStart(levelPercentage);
            setLittercoinStart(littercoin);
            setLittercoinPercentageStart(littercoinPercentage);
        }

        setIsLoading(false);
    }

    const fetchUserData = async () => {

        if (user)
        {
            const statsObj = {
                xp: user?.xp_redis,
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
            await AsyncStorage.setItem('previousUserStats', JSON.stringify(statsObj));
        }
    }

    const globalStatsData = [
        {
            value: totalTags || 0,
            title: `stats.total-litter`,
            icon: 'pricetags-outline',
            color: '#14B8A6',
            bgColor: '#CCFBF1'
        },
        {
            value: totalImages || 0,
            title: `stats.total-photos`,
            icon: 'images-outline',
            color: '#A855F7',
            bgColor: '#F3E8FF'
        },
        {
            value: totalUsers || 0,
            title: `stats.total-users`,
            icon: 'people-outline',
            color: '#F59E0B',
            bgColor: '#FEF9C3'
        },
        {
            value: newUsersToday || 0,
            title: `stats.new-today`,
            icon: 'person-add-outline',
            color: '#0EA5E9',
            bgColor: '#E0F2FE'
        },
        {
            value: newUsersLast7Days || 0,
            title: `stats.new-7-days`,
            icon: 'calendar-outline',
            color: '#EC4899',
            bgColor: '#FCE7F3'
        },
        {
            value: newUsersLast30Days || 0,
            title: `stats.new-30-days`,
            icon: 'calendar-outline',
            color: '#8B5CF6',
            bgColor: '#EDE9FE'
        }
    ];

    const statsData = [
        {
            value: user?.xp_redis || xpStart,
            startValue: xpStart,
            title: `user.XP`,
            icon: 'medal-outline',
            color: '#14B8A6',
            bgColor: '#CCFBF1'
        },
        {
            value: user?.position || positionStart,
            startValue: positionStart,
            title: `user.rank`,
            icon: 'podium-outline',
            color: '#A855F7',
            bgColor: '#F3E8FF',
            ordinal: true
        },
        {
            value: user?.total_images || totalImagesStart,
            startValue: totalImagesStart,
            title: `user.photos`,
            icon: 'images-outline',
            color: '#F59E0B',
            bgColor: '#FEF9C3'
        },
        {
            value: user?.totalTags || totalTagsStart,
            startValue: totalTagsStart,
            title: `user.tags`,
            icon: 'pricetags-outline',
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
                            dictionary={`user.welcome`}
                        />
                        <Body color="white">{user?.username}</Body>
                    </View>
                }
                leftContainerStyle={{flex: 3}}
                rightContent={
                    <Pressable>
                        <Icon
                            name="settings-outline"
                            color="white"
                            size={24}
                            onPress={() => { navigation.navigate('SETTING'); }}
                        />
                    </Pressable>
                }
                rightContainerStyle={{flex: 0}}
            />
            {user === null || user === undefined || isLoading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'white'
                    }}
                >
                    <ActivityIndicator
                        size="small"
                        color={Colors.accent}
                    />
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{paddingTop: 12}}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}
                >
                    <SubTitle style={styles.sectionTitle}>Global</SubTitle>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.globalRow}>
                        {globalStatsData.map(stat => (
                            <IconStatsCard
                                key={stat.title}
                                imageContent={
                                    <Icon
                                        name={stat.icon}
                                        size={20}
                                        color={stat.color}
                                    />
                                }
                                value={stat.value}
                                title={stat.title}
                                contentCenter
                                backgroundColor={stat.bgColor}
                                fontColor={stat.color}
                                width={120}
                            />
                        ))}
                    </ScrollView>

                    <SubTitle style={styles.sectionTitle}>Your Stats</SubTitle>
                    <ProgressCircleCard
                        level={user?.level}
                        levelStart={levelStart}
                        levelPercentage={user?.targetPercentage}
                        xpRequired={user?.xpRequired}
                    />

                    <StatsGrid
                        statsData={statsData}
                    />

                    <Caption
                        color="muted"
                        style={styles.littercoinText}>
                        Littercoin: {(user?.totalLittercoin || 0).toLocaleString()}
                    </Caption>

                    <ShowMyUploadsButton
                        navigation={navigation}
                    />
                </ScrollView>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    sectionTitle: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 4
    },
    globalRow: {
        paddingHorizontal: 10
    },
    littercoinText: {
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8
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

export default UserStatsScreen;
