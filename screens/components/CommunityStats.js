import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {selectStats} from '../../reducers/stats_reducer';
import {Colors} from './theme';
import {Body, Caption, Title} from './typography';
import useAnimatedCount from './useAnimatedCount';

const formatCount = (n) => {
    const rounded = Math.round(n);
    if (rounded >= 1000000) return `${(rounded / 1000000).toFixed(1)}M+`;
    if (rounded >= 1000) return `${Math.floor(rounded / 1000).toLocaleString()}k+`;
    return rounded.toLocaleString();
};

const exactFormatter = n => Math.round(n).toLocaleString();

const StatCell = React.memo(({value, label, color, exact, active, onPress}) => {
    const display = useAnimatedCount(value, {
        formatter: exact ? exactFormatter : formatCount
    });

    return (
        <Pressable style={[styles.stat, active && styles.statActive]} onPress={onPress}>
            <Title style={[styles.statValue, {color}]}>
                {display}
            </Title>
            <Caption style={[styles.statLabel, active && {color}]}>{label}</Caption>
        </Pressable>
    );
});

const GrowthBadge = ({value, label}) => (
    <View style={styles.badge}>
        <Body style={styles.badgeValue}>+{(value || 0).toLocaleString()}</Body>
        <Caption style={styles.badgeLabel}>{label}</Caption>
    </View>
);

const MODES = {
    tags: 'tags',
    photos: 'photos',
    people: 'people'
};

const GROWTH_KEYS = {
    [MODES.tags]: {today: 'newTagsToday', week: 'newTagsLast7Days', month: 'newTagsLast30Days'},
    [MODES.photos]: {today: 'newPhotosToday', week: 'newPhotosLast7Days', month: 'newPhotosLast30Days'},
    [MODES.people]: {today: 'newUsersToday', week: 'newUsersLast7Days', month: 'newUsersLast30Days'}
};

const CommunityStats = () => {
    const {t} = useTranslation();
    const [activeMode, setActiveMode] = useState(MODES.people);
    const stats = useSelector(selectStats);

    const keys = GROWTH_KEYS[activeMode];
    const active = {
        today: stats[keys.today],
        week: stats[keys.week],
        month: stats[keys.month]
    };

    const onPressTags = useCallback(() => setActiveMode(MODES.tags), []);
    const onPressPhotos = useCallback(() => setActiveMode(MODES.photos), []);
    const onPressPeople = useCallback(() => setActiveMode(MODES.people), []);

    return (
        <View style={styles.section}>
            <Body style={styles.sectionTitle}>{t('Global Impact')}</Body>
            <View style={styles.card}>
                <View style={styles.statsRow}>
                    <StatCell
                        value={stats.totalTags}
                        label={t('Tags')}
                        color="#14b8a6"
                        active={activeMode === MODES.tags}
                        onPress={onPressTags}
                    />
                    <StatCell
                        value={stats.totalImages}
                        label={t('Photos')}
                        color="#8b5cf6"
                        active={activeMode === MODES.photos}
                        onPress={onPressPhotos}
                    />
                    <StatCell
                        value={stats.totalUsers}
                        label={t('People')}
                        color="#f59e0b"
                        exact
                        active={activeMode === MODES.people}
                        onPress={onPressPeople}
                    />
                </View>
                <View style={styles.badgeRow}>
                    <GrowthBadge value={active.today} label={t('24h')} />
                    <GrowthBadge value={active.week} label={t('7d')} />
                    <GrowthBadge value={active.month} label={t('30d')} />
                </View>
            </View>
        </View>
    );
};

export default CommunityStats;

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 14
    },
    stat: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10
    },
    statActive: {
        backgroundColor: '#f0fdf4'
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700'
    },
    statLabel: {
        fontSize: 12,
        color: Colors.muted,
        marginTop: 2
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20
    },
    badgeValue: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.accent,
        marginRight: 4
    },
    badgeLabel: {
        fontSize: 12,
        color: Colors.muted
    }
});
