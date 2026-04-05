import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {getCurrentLevel, fetchXpLevels} from '../../profile/helpers/xpLevels';
import {Colors} from '../../components/theme';
import {Body, Caption, Title} from '../../components/typography';
import useAnimatedCount from '../../components/useAnimatedCount';

const ImpactStat = React.memo(({value, label}) => {
    const display = useAnimatedCount(value);
    return (
        <View style={styles.stat}>
            <Title style={styles.statValue}>{display}</Title>
            <Caption style={styles.statLabel}>{label}</Caption>
        </View>
    );
});

const YourImpactSection = () => {
    const {t} = useTranslation();
    const user = useSelector(state => state.auth.user);
    const token = useSelector(state => state.auth.token);
    const [xpLevels, setXpLevels] = useState(null);
    const hasFetchedLevels = useRef(false);

    useEffect(() => {
        if (token && !hasFetchedLevels.current) {
            hasFetchedLevels.current = true;
            fetchXpLevels(token).then(setXpLevels).catch(() => {});
        }
    }, [token]);

    const totalImages = user?.totalImages ?? 0;
    const totalTags = user?.totalTags ?? 0;
    const xp = user?.xp ?? 0;
    const level = user?.level ?? 0;
    const streak = user?.streak ?? 0;

    if (!user) return null;

    const {currentLevel, nextLevel, progress, xpToNext} = getCurrentLevel(xp, xpLevels);
    const pct = Math.min(Math.max(progress, 0), 1);
    const pctDisplay = Math.round(pct * 100);

    return (
        <View style={styles.section}>
            <Body style={styles.sectionTitle}>{t('Your Impact')}</Body>
            <View style={styles.card}>
                <View style={styles.statsRow}>
                    <ImpactStat value={totalTags} label={t('Tags')} />
                    <ImpactStat value={totalImages} label={t('Photos')} />
                    <ImpactStat value={xp} label={t('XP (Points)')} />
                </View>

                <Caption style={styles.levelLabel}>
                    {t('Level')} {level}: {currentLevel.name}
                </Caption>

                <View style={styles.barRow}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, {width: `${pctDisplay}%`}]} />
                    </View>
                    <Caption style={styles.pctText}>{pctDisplay}%</Caption>
                </View>

                {nextLevel ? (
                    <>
                        <Caption style={styles.xpFraction}>
                            {t('{{current}} / {{target}} XP', {current: xp.toLocaleString(), target: nextLevel.xp.toLocaleString()})}
                        </Caption>
                        <Caption style={styles.xpToNext}>
                            {t('{{count}} XP to reach {{level}}', {count: xpToNext.toLocaleString(), level: nextLevel.name})}
                        </Caption>
                    </>
                ) : (
                    <Caption style={styles.xpFraction}>
                        {t('{{count}} XP earned', {count: xp.toLocaleString()})}
                    </Caption>
                )}

                {streak > 0 && (
                    <Body style={styles.streak}>
                        {t('{{count}}-day streak', {count: streak})}
                    </Body>
                )}
            </View>
        </View>
    );
};

export default YourImpactSection;

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 16,
        paddingTop: 8,
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
        marginBottom: 16
    },
    stat: {
        alignItems: 'center'
    },
    statValue: {
        fontSize: 20,
        color: Colors.accent,
        fontWeight: '700'
    },
    statLabel: {
        fontSize: 12,
        color: Colors.muted,
        marginTop: 2
    },
    levelLabel: {
        fontSize: 13,
        color: Colors.muted,
        marginBottom: 8
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accentLight,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent
    },
    pctText: {
        fontSize: 12,
        color: Colors.accent,
        fontWeight: '600',
        marginLeft: 8,
        minWidth: 32
    },
    xpFraction: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500'
    },
    xpToNext: {
        fontSize: 13,
        color: Colors.muted,
        marginTop: 2
    },
    streak: {
        fontSize: 14,
        color: Colors.accent,
        marginTop: 12,
        fontWeight: '600'
    }
});
