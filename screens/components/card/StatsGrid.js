import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';

import IconStatsCard from './IconStatsCard';

const { width } = Dimensions.get('window');

const StatsGrid = ({ statsData }) => {
    // console.log(statsData);
    return (
        <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
                {statsData.map(stat => (
                    <IconStatsCard
                        key={`${stat.title}`}
                        imageContent={
                            stat.icon && (
                                <Icon
                                    name={stat.icon}
                                    size={36}
                                    color={stat.color}
                                />
                            )
                        }
                        value={stat.value}
                        startValue={stat.startValue}
                        title={stat.title}
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

StatsGrid.propTypes = {
    statsData: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
            startValue: PropTypes.number,
            icon: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired,
            bgColor: PropTypes.string.isRequired,
            ordinal: PropTypes.bool
        })
    )
};

export default StatsGrid;

const styles = StyleSheet.create({
    statsContainer: {
        marginTop: 20,
        padding: 10
    },
    statsRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        flexWrap: 'wrap'
    }
});
