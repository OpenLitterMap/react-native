import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import IconStatsCard from './IconStatsCard';

const {width} = Dimensions.get('window');

interface StatData {
    title?: string;
    value?: number;
    startValue?: number;
    icon?: string;
    color?: string;
    bgColor?: string;
    ordinal?: boolean;
}

interface StatsGridProps {
    statsData: StatData[];
    style?: object;
}

const StatsGrid: React.FC<StatsGridProps> = ({statsData, style}) => {
    return (
        <View style={styles.statsContainer}>
            <View style={[styles.statsRow, style]}>
                {statsData.map(stat => (
                    <IconStatsCard
                        key={`${stat.title}`}
                        imageContent={
                            stat.icon && (
                                <Icon
                                    name={stat.icon}
                                    size={24}
                                    color={stat.color}
                                />
                            )
                        }
                        value={stat?.value ? stat.value : 0}
                        startValue={stat.startValue}
                        title={stat.title ? stat.title : ''}
                        contentCenter
                        backgroundColor={stat.bgColor}
                        fontColor={stat.color}
                        ordinal={stat.ordinal}
                        width={width / 2 - 30}
                    />
                ))}
            </View>
        </View>
    );
};

export default StatsGrid;

const styles = StyleSheet.create({
    statsContainer: {
        // marginTop: 20,
        padding: 10
    },
    statsRow: {
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap'
    }
});
