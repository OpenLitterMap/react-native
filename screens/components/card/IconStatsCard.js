import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { CountUp } from 'use-count-up';
import PropTypes from 'prop-types';
import { Title, Caption } from '../typography';
import { Colors } from '../theme';
const { width } = Dimensions.get('window');

/**
 * function to get ordinal of the number
 * eg - 1st , 2nd , 50th etc
 * @param {number} number
 * @returns {string} ordinal for the number passed as param
 */
export const getOrdinal = number => {
    const b = number % 10;
    const output =
        Math.floor((number % 100) / 10) === 1
            ? 'th'
            : b === 1
            ? 'st'
            : b === 2
            ? 'nd'
            : b === 3
            ? 'rd'
            : 'th';
    return output;
};

/**
 * props accepted by IconStatsCard
 * @typedef {Object} IconStatsCardProps
 * @property {number} value -- the end value for animation / actual value
 * @property {number} startValue -- the starting value for animation
 * @property {any} style -- styles to override default styles of container
 * @property {string} fontColor - color for the text of card
 * @property {string} backgroundColor
 * @property {boolean} contentCenter - if true content is center aligned or its left aligned
 * @property {boolean} ordinal -- if true adds ordinal to the number (eg- 1st, 2nd, 28th etc)
 * @property {any} imageContent -- content like icon thats to be shown in stats card (to visually explain the card content)
 *
 */
/**
 * the card component to show stats in GlobalStatsScreen and UserStatsScreen
 * @param {IconStatsCardProps} props - {@link IconStatsCardProps}
 * @returns
 */
const IconStatsCard = ({
    style,
    value,
    startValue = 0,
    title,
    fontColor = Colors.accent,
    imageContent,
    contentCenter,
    ordinal,
    backgroundColor = Colors.accentLight
}) => {
    return (
        <View
            style={[
                styles.container,
                contentCenter && { alignItems: 'center' },
                {
                    backgroundColor
                },
                style
            ]}>
            {imageContent && (
                <View style={{ marginBottom: 10 }}>{imageContent}</View>
            )}

            <Title
                style={[
                    contentCenter && { textAlign: 'center' },
                    { color: fontColor, fontSize: 24 }
                ]}>
                <CountUp
                    isCounting={startValue === value ? false : true}
                    start={startValue}
                    end={value}
                    duration={5}
                    shouldUseToLocaleString
                />
                {ordinal &&
                    value !== 0 &&
                    value !== undefined &&
                    getOrdinal(value)}
            </Title>

            <Caption
                family="regular"
                style={[
                    contentCenter && { textAlign: 'center' },
                    { color: fontColor }
                ]}
                dictionary={title}
            />
        </View>
    );
};

export default IconStatsCard;

IconStatsCard.propTypes = {
    value: PropTypes.number.isRequired,
    startValue: PropTypes.number,
    title: PropTypes.string.isRequired,
    style: PropTypes.any,
    fontColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    contentCenter: PropTypes.bool,
    ordinal: PropTypes.bool,
    imageContent: PropTypes.element
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 20,
        borderRadius: 12,
        margin: 10,
        width: width / 2 - 30,
        height: 140
        // flex: 1
    }
});
