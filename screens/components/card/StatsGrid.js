import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';

import IconStatsCard from './IconStatsCard';

/**
 * @typedef  StatsDataType
 * @type {Object}
 * @property {string} title -- the title of the stats card (Rank , XP, Total Tags etc)
 * @property {number} value -- the end value for animation / actual value
 * @property {number} startValue -- the starting value for animation
 * @property {string} icon -- the name of the icon -- Ionicons from react-native-vector-icons
 * @property {string} color - color of the text
 * @property {string} bgColor -- background color of card
 * @property {boolean} ordinal -- if true adds ordinal to the number (eg- 1st, 2nd, 28th etc)
 */

/**
 * component that creates a grid to show stats
 * used in GlobalStatsScreen and USerStatsScreen
 * @param {Array.<StatsDataType>} statsData Array<{@link StatsDataType}>
 */
const StatsGrid = ({ statsData }) => {
    return (
        <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
                {statsData.map(stat => (
                    <IconStatsCard
                        key={`${stat.title}`}
                        imageContent={
                            <Icon
                                name={stat.icon}
                                size={36}
                                color={stat.color}
                            />
                        }
                        value={stat.value}
                        startValue={stat.startValue}
                        title={stat.title}
                        contentCenter
                        backgroundColor={stat.bgColor}
                        fontColor={stat.color}
                        ordinal={stat.ordinal}
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
