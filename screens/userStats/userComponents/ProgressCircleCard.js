import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CountUp } from 'use-count-up';
import { Body, Caption, Title } from '../../components';

const ProgressCircleCard = ({
    level,
    levelStart,
    levelPercentage,
    xpToNextLevel
}) => {
    const clampedPercent = Math.min(Math.max(levelPercentage || 0, 0), 100);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Title style={styles.levelText}>
                    <CountUp
                        isCounting={levelStart !== level}
                        start={levelStart}
                        end={level}
                        duration={3}
                        formatter={val => `Level ${Math.floor(val)}`}
                        decimalPlaces={0}
                    />
                </Title>
                <Caption color="muted">
                    {Math.round(clampedPercent)}%
                </Caption>
            </View>

            <View style={styles.barBackground}>
                <View
                    style={[
                        styles.barFill,
                        { width: `${clampedPercent}%` }
                    ]}
                />
            </View>

            <Caption color="muted" style={styles.xpText}>
                {(xpToNextLevel || 0).toLocaleString()} XP to next level
            </Caption>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        paddingVertical: 16
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8
    },
    levelText: {
        color: '#e268b3',
        fontSize: 22
    },
    barBackground: {
        height: 10,
        backgroundColor: '#f3e8ff',
        borderRadius: 5,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: '#e268b3',
        borderRadius: 5
    },
    xpText: {
        marginTop: 6
    }
});

export default ProgressCircleCard;
