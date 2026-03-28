import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
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
import { useTranslation } from 'react-i18next';
import { Header } from '../components';
import { fetchUser, logout } from '../../reducers/auth_reducer';
import { getStats } from '../../reducers/stats_reducer';
import StatsGrid from './components/StatsGrid';
import DeltaBlock from './components/DeltaBlock';
import UploadsPreview from './components/UploadsPreview';

const CACHE_KEY = 'profile_stats_cache';
const BRAND = '#27ae60';
const TEXT_SECONDARY = '#888888';

const ProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const totalUsers = useSelector(state => state.stats.totalUsers);
    const [prev, setPrev] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const prevLoadedRef = useRef(false);

    // Load cached data + fetch fresh data on tab focus
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                try {
                    if (cached) setPrev(JSON.parse(cached));
                } catch (e) {
                    // Corrupted cache — ignore
                }
                prevLoadedRef.current = true;
                setInitialLoad(false);

                setFetchError(false);
                const [userResult, statsResult] = await Promise.all([
                    dispatch(fetchUser()),
                    dispatch(getStats())
                ]);
                if (userResult.meta?.requestStatus === 'rejected' ||
                    statsResult.meta?.requestStatus === 'rejected') {
                    setFetchError(true);
                }
            };

            load();
        }, [token, dispatch])
    );

    // Save current user stats for next visit
    useEffect(() => {
        if (!user || !prevLoadedRef.current) return;

        AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                xp: user.xp,
                position: user.position,
                totalImages: user.totalImages || 0,
                totalTags: user.totalTags,
                littercoin: user.totalLittercoin
            })
        );
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setFetchError(false);

        const [userResult, statsResult] = await Promise.all([
            dispatch(fetchUser()),
            dispatch(getStats())
        ]);
        if (userResult.meta?.requestStatus === 'rejected' ||
            statsResult.meta?.requestStatus === 'rejected') {
            setFetchError(true);
        }

        setRefreshing(false);
    }, [token, dispatch]);

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
                    value: (user.totalImages || 0) - (prev.totalImages || 0),
                    label: 'more photos'
                }
            ]
            : [];

    // Resolve display values
    const rank = user?.position ?? prev?.position ?? null;
    const tags = user?.totalTags ?? prev?.totalTags ?? 0;
    const handleLogout = useCallback(() => {
        Alert.alert(
            t('Logout'),
            t('Are you sure you want to log out?'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {text: t('Logout'), style: 'destructive', onPress: () => dispatch(logout())}
            ]
        );
    }, [dispatch, t]);

    const photos = user?.totalImages ?? prev?.totalImages ?? 0;
    const littercoin = user?.totalLittercoin ?? prev?.littercoin ?? 0;

    const hasNoData = initialLoad && !user && !prev;

    // ——— Skeleton (first-time, no cache, API loading) ———
    if (hasNoData) {
        return (
            <>
                <ProfileHeader onLogout={handleLogout} t={t} />
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
                onLogout={handleLogout}
                t={t}
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
                            {t('Showing saved data. Pull to refresh.')}
                        </Text>
                    </View>
                )}

                {/* Error — no cache, API failed */}
                {fetchError && !prev && !user && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>
                            {t("Couldn't load your profile")}
                        </Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={onRefresh}
                        >
                            <Text style={styles.retryText}>{t('Try Again')}</Text>
                        </Pressable>
                    </View>
                )}

                {/* Your stats */}
                <Text style={styles.sectionTitle}>{t('Your Stats')}</Text>
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
                />

                {/* Deltas */}
                <DeltaBlock
                    deltas={deltas}
                    isFirstVisit={isFirstVisit}
                />

                <View style={styles.divider} />

                <Pressable
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('SETTING')}
                >
                    <Text style={styles.settingsText}>
                        {t('Change Settings')}
                    </Text>
                    <Icon
                        name="chevron-forward"
                        size={18}
                        color={TEXT_SECONDARY}
                        style={{ marginLeft: 4 }}
                    />
                </Pressable>

                {photos === 0 && (
                    <Text style={styles.emptyUploadsHint}>
                        {t('Upload some photos to see your progress here')}
                    </Text>
                )}

                <View style={styles.divider} />

                <UploadsPreview navigation={navigation} />
            </ScrollView>
        </>
    );
};

// ——— Sub-components ———

const ProfileHeader = ({ onLogout, t }) => (
    <Header
        rightContent={
            <Pressable onPress={onLogout} hitSlop={12}>
                <Text style={styles.logoutText}>{t('Logout')}</Text>
            </Pressable>
        }
    />
);

// ——— Styles ———

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    logoutText: {
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
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

    settingsButton: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#cccccc',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    settingsText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: TEXT_SECONDARY
    },

    emptyUploadsHint: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: TEXT_SECONDARY,
        textAlign: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16
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
