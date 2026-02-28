import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getCurrentLevel } from '../helpers/xpLevels';

const BRAND = '#27ae60';
const TEXT_SECONDARY = '#888888';

const LevelHero = ({ xp = 0, level = 0, levels }) => {
    const { currentLevel, nextLevel, progress, xpToNext } =
        getCurrentLevel(xp, levels);
    const pct = Math.min(Math.max(progress, 0), 1);
    const pctDisplay = Math.round(pct * 100);

    const a11yLabel = nextLevel
        ? `Level ${currentLevel.name}, ${pctDisplay} percent progress to ${nextLevel.name}`
        : `Level ${currentLevel.name}, max level reached`;

    return (
        <View
            style={styles.container}
            accessible
            accessibilityLabel={a11yLabel}
            accessibilityRole="progressbar"
        >
            <Text style={styles.levelLabel}>Level {level}:</Text>
            <Text style={styles.levelName}>{currentLevel.name}</Text>

            <View style={styles.barRow}>
                <View style={styles.barTrack}>
                    <View
                        style={[
                            styles.barFill,
                            { width: `${pctDisplay}%` }
                        ]}
                    />
                </View>
                <Text style={styles.pctText}>{pctDisplay}%</Text>
            </View>

            {nextLevel ? (
                <>
                    <Text style={styles.xpFraction}>
                        {(xp || 0).toLocaleString()} /{' '}
                        {nextLevel.xp.toLocaleString()} XP
                    </Text>
                    <Text style={styles.xpToNext}>
                        {xpToNext.toLocaleString()} XP to{' '}
                        <Text style={styles.nextLevelName}>
                            {nextLevel.name}
                        </Text>
                    </Text>
                </>
            ) : (
                <Text style={styles.xpFraction}>
                    {(xp || 0).toLocaleString()} XP — Max level reached
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 28
    },
    levelLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: TEXT_SECONDARY,
        marginBottom: 2
    },
    levelName: {
        fontSize: 22,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: BRAND,
        marginBottom: 12
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    barTrack: {
        flex: 1,
        height: 10,
        backgroundColor: '#dcffeb',
        borderRadius: 5,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: BRAND,
        borderRadius: 5
    },
    pctText: {
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: BRAND,
        marginLeft: 10,
        minWidth: 36
    },
    xpFraction: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: '#1a1a1a'
    },
    xpToNext: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: TEXT_SECONDARY,
        marginTop: 2
    },
    nextLevelName: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: '#1a1a1a'
    }
});

export default LevelHero;
