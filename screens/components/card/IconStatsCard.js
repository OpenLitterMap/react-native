import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { CountUp } from 'use-count-up';
import PropTypes from 'prop-types';
import { Title, Caption } from '../typography';
import { Colors } from '../theme';
const { width } = Dimensions.get('window');

// fn to get ordinal of number
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

const IconStatsCard = ({
    style,
    value,
    startValue = 0,
    title,
    fontColor = Colors.accent,
    imageContent,
    contentCenter,
    ordinal,
    backgroundColor = Colors.accentLight,
    width
}) => {
    return (
        <View
            style={[
                styles.container,
                contentCenter && { alignItems: 'center', width: width },
                {
                    backgroundColor
                },
                style
            ]}>
            {imageContent && (
                <View style={{ marginBottom: 6 }}>{imageContent}</View>
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
    imageContent: PropTypes.element,
    width: PropTypes.number
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 10,
        borderRadius: 12,
        margin: 10
        // width: width / 2 - 30,
        // height: width / 3
        // flex: 1
    }
});
