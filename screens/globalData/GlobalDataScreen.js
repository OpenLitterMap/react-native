import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimatedCircle, Body, Colors, Header, StatsGrid, Title } from '../components';
import { useDispatch, useSelector} from "react-redux";
import { getStats } from "../../reducers/stats_reducer";

// interface GlobalDataScreenProps {
//     totalLitter: number;
//     totalPhotos: number;
//     totalUsers: number;
//     totalLittercoin: number;
//     litterTarget: any; // Replace 'any' with the type for 'litterTarget'
//     targetPercentage: number;
//     statsErrorMessage: string | null;
//     lang: string;
//     getStats: () => void;
//     navigation: any; // Replace 'any' with the type for 'navigation'
// }
//
// interface GlobalDataScreenState {
//     isFocused: boolean;
//     litterStart: number;
//     photosStart: number;
//     littercoinStart: number;
//     usersStart: number;
//     targetPercentageStart: number;
// }

const GlobalDataScreen = ({ navigation }) => {

    const dispatch = useDispatch();

    const totalLitter = useSelector(state => state.stats.totalLitter);
    const totalPhotos = useSelector(state => state.stats.totalPhotos);
    const totalUsers = useSelector(state => state.stats.totalUsers);
    const totalLittercoin = useSelector(state => state.stats.totalLittercoin);
    const litterTarget = useSelector(state => state.stats.litterTarget);
    const targetPercentage = useSelector(state => state.stats.targetPercentage);
    const statsErrorMessage = useSelector(state => state.stats.statsErrorMessage);

    const [isFocused, setIsFocused] = useState(false);
    const [litterStart, setLitterStart] = useState(0);
    const [photosStart, setPhotosStart] = useState(0);
    const [littercoinStart, setLittercoinStart] = useState(0);
    const [usersStart, setUsersStart] = useState(0);
    const [targetPercentageStart, setTargetPercentageStart] = useState(0);

    useEffect(() => {
        const focusListener = navigation.addListener('focus', () => {
            setIsFocused(true);
        });

        getDataFromStorage();

        async function getStatsFunction () {
            await dispatch(getStats());
        }

        getStatsFunction();

        return () => {
            if (focusListener) {
                focusListener();
            }
        };
    }, []);

    const getDataFromStorage = async () => {
        const stats = await AsyncStorage.getItem('globalStats');

        if (stats !== undefined && stats !== null)
        {
            const {
                totalLitter,
                totalPhotos,
                totalUsers,
                targetPercentage,
                totalLittercoin
            } = JSON.parse(stats);

            setLitterStart(totalLitter);
            setPhotosStart(totalPhotos);
            setUsersStart(totalUsers);
            setLittercoinStart(totalLittercoin);
            setTargetPercentageStart(targetPercentage);
        }
    };

    const statsData = [
        {
            value: totalLitter || litterStart,
            startValue: litterStart,
            title: 'Total Tags',
            icon: 'trash-outline',
            color: '#14B8A6',
            bgColor: '#CCFBF1'
        },
        {
            value: totalPhotos || photosStart,
            startValue: photosStart,
            title: 'Total Photos',
            icon: 'images-outline',
            color: '#A855F7',
            bgColor: '#F3E8FF'
        },
        {
            value: totalLittercoin || littercoinStart,
            startValue: littercoinStart,
            title: 'Total Littercoin',
            icon: 'server-outline',
            color: '#F59E0B',
            bgColor: '#FEF9C3'
        },
        {
            value: totalUsers || usersStart,
            startValue: usersStart,
            title: 'Total Users',
            icon: 'people-outline',
            color: '#0EA5E9',
            bgColor: '#E0F2FE'
        }
    ];

    if (statsErrorMessage !== null) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20
                }}>
                <Body style={{ textAlign: 'center' }}>
                    {statsErrorMessage}
                </Body>
                <Pressable
                    onPress={() => dispatch(getStats())}
                    style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderRadius: 4,
                        marginTop: 20
                    }}
                >
                    <Body>Try again</Body>
                </Pressable>
            </View>
        );
    }

    return (
        <>
            <Header
                leftContent={
                    <Title
                        color="white"
                        dictionary={'Global Data'}
                    />
                }
            />

            {/* INFO: showing loader when there is no previous value in
            asyncstore -- only shown on first app load after login */}
            {
                (litterStart === 0 && totalLitter === 0) || !isFocused ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: Colors.white
                        }}>
                        <ActivityIndicator size="small" color={Colors.accent} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ paddingTop: 20 }}
                        style={styles.container}
                        showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}
                    >
                        <AnimatedCircle
                            strokeWidth={30}
                            percentage={targetPercentage}
                            startPercentage={targetPercentageStart}
                            color={`${Colors.accent}`}
                            value={targetPercentage}
                            startValue={targetPercentageStart}
                            delay={0}
                            duration={5000}
                            radius={160}
                            tagline={'Next Target\n{{count}} Litter'}
                            nextTarget={litterTarget.nextTarget.toLocaleString()}
                            valueSuffix="%"
                        />

                        <StatsGrid
                            statsData={statsData}
                        />
                    </ScrollView>
                )
            }
        </>
    );
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

export default GlobalDataScreen;
