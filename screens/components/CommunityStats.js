import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Colors} from './theme';
import {Body, Caption, Title} from './typography';

const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
    if (n >= 1000) return `${Math.floor(n / 1000).toLocaleString()}k+`;
    return n.toLocaleString();
};

const StatCell = ({value, label, color, exact, active, onPress}) => (
    <Pressable style={[styles.stat, active && styles.statActive]} onPress={onPress}>
        <Title style={[styles.statValue, {color}]}>
            {exact ? value.toLocaleString() : formatCount(value)}
        </Title>
        <Caption style={[styles.statLabel, active && {color}]}>{label}</Caption>
    </Pressable>
);

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

const CommunityStats = () => {
    const {t} = useTranslation();
    const [activeMode, setActiveMode] = useState(MODES.people);

    const totalTags = useSelector(state => state.stats.totalTags);
    const totalImages = useSelector(state => state.stats.totalImages);
    const totalUsers = useSelector(state => state.stats.totalUsers);

    // Growth metrics per category
    const growth = {
        [MODES.tags]: {
            today: useSelector(state => state.stats.newTagsToday),
            week: useSelector(state => state.stats.newTagsLast7Days),
            month: useSelector(state => state.stats.newTagsLast30Days)
        },
        [MODES.photos]: {
            today: useSelector(state => state.stats.newPhotosToday),
            week: useSelector(state => state.stats.newPhotosLast7Days),
            month: useSelector(state => state.stats.newPhotosLast30Days)
        },
        [MODES.people]: {
            today: useSelector(state => state.stats.newUsersToday),
            week: useSelector(state => state.stats.newUsersLast7Days),
            month: useSelector(state => state.stats.newUsersLast30Days)
        }
    };

    const active = growth[activeMode];

    return (
        <View style={styles.section}>
            <Body style={styles.sectionTitle}>{t('Community Progress')}</Body>
            <View style={styles.card}>
                <View style={styles.statsRow}>
                    <StatCell
                        value={totalTags}
                        label={t('Litter Tagged')}
                        color="#14b8a6"
                        active={activeMode === MODES.tags}
                        onPress={() => setActiveMode(MODES.tags)}
                    />
                    <StatCell
                        value={totalImages}
                        label={t('Photos Uploaded')}
                        color="#8b5cf6"
                        active={activeMode === MODES.photos}
                        onPress={() => setActiveMode(MODES.photos)}
                    />
                    <StatCell
                        value={totalUsers}
                        label={t('Contributors')}
                        color="#f59e0b"
                        exact
                        active={activeMode === MODES.people}
                        onPress={() => setActiveMode(MODES.people)}
                    />
                </View>
                <View style={styles.badgeRow}>
                    <GrowthBadge value={active.today} label={t('today')} />
                    <GrowthBadge value={active.week} label={t('this week')} />
                    <GrowthBadge value={active.month} label={t('this month')} />
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
