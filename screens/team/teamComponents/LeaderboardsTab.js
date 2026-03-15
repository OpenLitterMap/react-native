import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {getLeaderboardData} from '../../../reducers/leaderboards_reducer';
import {flags} from '../../../assets/icons/flags';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../../components';

const FILTER_OPTIONS = [
    {label: 'Today', value: 'today'},
    {label: 'Yesterday', value: 'yesterday'},
    {label: 'This Month', value: 'this-month'},
    {label: 'Last Month', value: 'last-month'},
    {label: 'All Time', value: 'all-time'}
];

const LeaderboardsTab = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    const [selectedValue, setSelectedValue] = useState('today');

    const paginated = useSelector(state => state.leaderboard.paginated);
    const currentPage = useSelector(state => state.leaderboard.currentPage);
    const loading = useSelector(state => state.leaderboard.fetchStatus === 'loading');
    const loadingMore = useSelector(state => state.leaderboard.loadMoreStatus === 'loading');

    useEffect(() => {
        dispatch(getLeaderboardData({timeFilter: 'today', page: 1}));
    }, []);

    const onFilterChange = value => {
        setSelectedValue(value);
        dispatch(getLeaderboardData({timeFilter: value, page: 1}));
    };

    const loadMore = () => {
        if (loadingMore || !paginated.hasNextPage) return;
        dispatch(getLeaderboardData({timeFilter: selectedValue, page: currentPage + 1}));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}>
                    {FILTER_OPTIONS.map(item => {
                        const active = item.value === selectedValue;
                        return (
                            <Pressable
                                key={item.value}
                                onPress={() => onFilterChange(item.value)}
                                style={[
                                    styles.filterChip,
                                    active && styles.filterChipActive
                                ]}>
                                <Caption
                                    family="semiBold"
                                    color={active ? 'white' : 'muted'}>
                                    {t(item.label)}
                                </Caption>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {!paginated.users.length ? (
                <View style={styles.loadingContainer}>
                    <Body color="muted">{t('No data found')}</Body>
                </View>
            ) : (
                <FlatList
                    data={paginated.users}
                    keyExtractor={(user, i) =>
                        `${user.rank}-${user.username || user.name || i}`
                    }
                    renderItem={({item}) => (
                        <View style={styles.row}>
                            <Body
                                family="semiBold"
                                style={styles.rank}>
                                {item.rank}
                            </Body>

                            {item.global_flag ? (
                                <Image
                                    source={flags[item.global_flag]}
                                    resizeMode="cover"
                                    style={[styles.flag, {width: SCREEN_WIDTH * 0.05}]}
                                />
                            ) : (
                                <View style={[styles.flag, {width: SCREEN_WIDTH * 0.05}]} />
                            )}

                            <Body
                                style={styles.username}
                                numberOfLines={1}>
                                {item.username || item.name || 'Anon'}
                            </Body>
                            <Body
                                color="accent"
                                family="semiBold"
                                style={styles.xp}>
                                {(item.xp || 0).toLocaleString()} XP
                            </Body>
                        </View>
                    )}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.footer}>
                                <ActivityIndicator color={Colors.accent} />
                            </View>
                        ) : null
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    filterRow: {
        backgroundColor: '#f9fafb',
        paddingVertical: 10
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#f0f0f0'
    },
    filterChipActive: {
        backgroundColor: Colors.accent
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    rank: {
        width: 30,
        textAlign: 'center'
    },
    flag: {
        height: 16,
        borderRadius: 2,
        marginLeft: 4
    },
    username: {
        flex: 1,
        marginLeft: 10
    },
    xp: {
        marginLeft: 8
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center'
    }
});

export default LeaderboardsTab;
