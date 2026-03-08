import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useCountUp } from 'use-count-up';

import { Header } from '../components';
import { fetchUser } from '../../reducers/auth_reducer';
import { getStats } from '../../reducers/stats_reducer';
import { fetchXpLevels } from './helpers/xpLevels';

import LevelHero from './components/LevelHero';
import StatsGrid from './components/StatsGrid';
import DeltaBlock from './components/DeltaBlock';

const CACHE_KEY = 'profile_stats_cache';
const GLOBAL_CACHE_KEY = 'profile_global_stats_cache';
const BRAND = '#27ae60';
const TEXT_SECONDARY = '#888888';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const totalUsers = useSelector(state => state.stats.totalUsers);
    const totalTags = useSelector(state => state.stats.totalTags);
    const totalImages = useSelector(state => state.stats.totalImages);
    const newUsersToday = useSelector(state => state.stats.newUsersToday);
    const newUsersLast7Days = useSelector(state => state.stats.newUsersLast7Days);
    const newUsersLast30Days = useSelector(state => state.stats.newUsersLast30Days);

    const [prev, setPrev] = useState(null);
    const [prevGlobal, setPrevGlobal] = useState(null);
    const [xpLevels, setXpLevels] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    const prevLoadedRef = useRef(false);

    // Check reduce-motion preference
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }, []);

    // Load cached data + fetch fresh data on tab focus
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const [cached, cachedGlobal] = await Promise.all([
                    AsyncStorage.getItem(CACHE_KEY),
                    AsyncStorage.getItem(GLOBAL_CACHE_KEY)
                ]);
                try {
                    if (cached) setPrev(JSON.parse(cached));
                    if (cachedGlobal) setPrevGlobal(JSON.parse(cachedGlobal));
                } catch (e) {
                    // Corrupted cache — ignore
                }
                prevLoadedRef.current = true;
                setInitialLoad(false);

                fetchXpLevels(token)
                    .then(setXpLevels)
                    .catch(() => {});

                try {
                    setFetchError(false);
                    await Promise.all([
                        dispatch(fetchUser(token)),
                        dispatch(getStats())
                    ]);
                } catch {
                    setFetchError(true);
                }
            };

            load();
        }, [token])
    );

    // Save current user stats for next visit
    useEffect(() => {
        if (!user || !prevLoadedRef.current) return;

        AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                xp: user.xp_redis,
                position: user.position,
                totalImages: user.total_images || 0,
                totalTags: user.totalTags,
                littercoin: user.totalLittercoin
            })
        );
    }, [user]);

    // Save current global stats for next visit
    useEffect(() => {
        if (!totalTags || !prevLoadedRef.current) return;

        AsyncStorage.setItem(
            GLOBAL_CACHE_KEY,
            JSON.stringify({
                totalTags,
                totalImages,
                totalUsers
            })
        );
    }, [totalTags, totalImages, totalUsers]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setFetchError(false);

        try {
            await Promise.all([
                dispatch(fetchUser(token)),
                dispatch(getStats())
            ]);
        } catch {
            setFetchError(true);
        }

        setRefreshing(false);
    }, [token]);

    // Compute deltas
    const isFirstVisit = prev === null;
    const deltas =
        prev && user
            ? [
                {
                    value: (user.totalTags || 0) - (prev.totalTags || 0),
                    label: 'more tags'
                },
                {
                    value:
                        (user.total_images || 0) - (prev.totalImages || 0),
                    label: 'more photos'
                }
            ]
            : [];

    // Resolve display values: prefer live, fall back to cached
    const xp = user?.xp_redis ?? prev?.xp ?? 0;
    const level = user?.level ?? 0;
    const rank = user?.position ?? prev?.position ?? null;
    const tags = user?.totalTags ?? prev?.totalTags ?? 0;
    const photos = user?.total_images ?? prev?.totalImages ?? 0;
    const littercoin = user?.totalLittercoin ?? prev?.littercoin ?? 0;

    const hasNoData = initialLoad && !user && !prev;

    // ——— Skeleton (first-time, no cache, API loading) ———
    if (hasNoData) {
        return (
            <>
                <ProfileHeader navigation={navigation} username="" />
                <View style={styles.skeletonContainer}>
                    <View style={styles.skeletonBar} />
                    <View style={styles.skeletonBarWide} />
                    <View style={styles.skeletonRow}>
                        <View style={styles.skeletonBlock} />
                        <View style={styles.skeletonBlock} />
                    </View>
                    <View style={styles.skeletonRow}>
                        <View style={styles.skeletonBlock} />
                        <View style={styles.skeletonBlock} />
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <ProfileHeader
                navigation={navigation}
                username={user?.username || ''}
            />

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={BRAND}
                        colors={[BRAND]}
                    />
                }
            >
                {/* Error banner */}
                {fetchError && prev && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>
                            Showing saved data. Pull to refresh.
                        </Text>
                    </View>
                )}

                {/* Error — no cache, API failed */}
                {fetchError && !prev && !user && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>
                            Couldn't load your profile
                        </Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={onRefresh}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </Pressable>
                    </View>
                )}

                {/* Community stats */}
                <Text style={styles.sectionTitle}>Community</Text>
                <View style={styles.communityGrid}>
                    <CommunityCell
                        value={totalTags}
                        startValue={prevGlobal?.totalTags}
                        label="total litter"
                        color="#14b8a6"
                        reduceMotion={reduceMotion}
                    />
                    <CommunityCell
                        value={totalImages}
                        startValue={prevGlobal?.totalImages}
                        label="total photos"
                        color="#8b5cf6"
                        reduceMotion={reduceMotion}
                    />
                    <CommunityCell
                        value={totalUsers}
                        startValue={prevGlobal?.totalUsers}
                        label="total users"
                        color="#f59e0b"
                        reduceMotion={reduceMotion}
                    />
                </View>

                <View style={styles.newUsersRow}>
                    <NewUsersBadge
                        value={newUsersToday}
                        label="today"
                    />
                    <NewUsersBadge
                        value={newUsersLast7Days}
                        label="this week"
                    />
                    <NewUsersBadge
                        value={newUsersLast30Days}
                        label="this month"
                    />
                </View>

                <View style={styles.divider} />

                {/* Level hero */}
                <LevelHero xp={xp} level={level} levels={xpLevels} />

                <View style={styles.divider} />

                {/* Your stats */}
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <StatsGrid
                    rank={rank}
                    prevRank={prev?.position}
                    totalUsers={totalUsers}
                    tags={tags}
                    prevTags={prev?.totalTags}
                    photos={photos}
                    prevPhotos={prev?.totalImages}
                    littercoin={littercoin}
                    prevLittercoin={prev?.littercoin}
                    reduceMotion={reduceMotion}
                />

                {/* Deltas */}
                <DeltaBlock
                    deltas={deltas}
                    isFirstVisit={isFirstVisit}
                />

                <View style={styles.divider} />

                {/* Action button */}
                <Pressable
                    style={[
                        styles.actionButton,
                        photos === 0 && styles.actionButtonDisabled
                    ]}
                    onPress={() => navigation.navigate('MY_UPLOADS')}
                    disabled={photos === 0}
                >
                    <Text
                        style={[
                            styles.actionText,
                            photos === 0 && styles.actionTextDisabled
                        ]}
                    >
                        View My Uploads
                    </Text>
                    <Icon
                        name="chevron-forward"
                        size={18}
                        color={photos === 0 ? '#cccccc' : BRAND}
                        style={{ marginLeft: 4 }}
                    />
                </Pressable>
            </ScrollView>
        </>
    );
};

// ——— Sub-components ———

const ProfileHeader = ({ navigation, username }) => (
    <Header
        leftContent={
            <Text style={styles.headerUsername}>{username}</Text>
        }
        leftContainerStyle={{ flex: 3 }}
        rightContent={
            <Pressable
                onPress={() => navigation.navigate('SETTING')}
                hitSlop={12}
            >
                <Icon name="settings-outline" color="white" size={24} />
            </Pressable>
        }
        rightContainerStyle={{ flex: 0 }}
    />
);

const CommunityCell = ({ value, startValue, label, color, reduceMotion }) => {
    const hasValue = value > 0;
    const hasStart = startValue != null && startValue > 0;

    // Only count when we have both values and the new one is higher
    const shouldCount = !reduceMotion && hasValue && hasStart && value > startValue;

    const { value: displayValue } = useCountUp({
        isCounting: shouldCount,
        start: shouldCount ? startValue : value,
        end: value,
        duration: 3,
        decimalPlaces: 0,
        formatter: v => Math.floor(v).toLocaleString()
    });

    let text;
    if (!hasValue && !hasStart) {
        text = '\u2013';
    } else if (shouldCount) {
        text = displayValue;
    } else {
        text = (hasValue ? value : startValue).toLocaleString();
    }

    return (
        <View style={styles.communityCell}>
            <Text style={[styles.communityNumber, { color }]}>{text}</Text>
            <Text style={styles.communityLabel}>{label}</Text>
        </View>
    );
};

const NewUsersBadge = ({ value, label }) => (
    <View style={styles.newUsersBadge}>
        <Text style={styles.newUsersValue}>
            +{(value || 0).toLocaleString()}
        </Text>
        <Text style={styles.newUsersLabel}>{label}</Text>
    </View>
);

// ——— Styles ———

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    headerUsername: {
        fontSize: 24,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#ffffff'
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#bbbbbb',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 4
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 24
    },

    // Action button
    actionButton: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 40,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: BRAND,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    actionButtonDisabled: {
        borderColor: '#cccccc'
    },
    actionText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: BRAND
    },
    actionTextDisabled: {
        color: '#cccccc'
    },

    // Community stats
    communityGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16
    },
    communityCell: {
        flex: 1
    },
    communityNumber: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600'
    },
    communityLabel: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#888888',
        marginTop: 2
    },
    newUsersRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 8
    },
    newUsersBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20
    },
    newUsersValue: {
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: BRAND,
        marginRight: 4
    },
    newUsersLabel: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#888888'
    },

    // Error states
    errorBanner: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 24,
        paddingVertical: 10
    },
    errorText: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#92400e'
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80
    },
    errorTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: TEXT_SECONDARY,
        marginBottom: 16
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: BRAND,
        minHeight: 48
    },
    retryText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#ffffff'
    },

    // Skeleton
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 32
    },
    skeletonBar: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginBottom: 12,
        width: '50%'
    },
    skeletonBarWide: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginBottom: 40,
        width: '100%'
    },
    skeletonRow: {
        flexDirection: 'row',
        marginBottom: 28
    },
    skeletonBlock: {
        flex: 1,
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        marginRight: 16
    }
});

export default ProfileScreen;
