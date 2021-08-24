import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { CountUp } from 'use-count-up';
import PropTypes from 'prop-types';
import { Title, Caption } from '../typography';
import { Colors } from '../theme';
const { width } = Dimensions.get('window');

const IconStatsCard = ({
    style,
    value,
    startValue = 0,
    title,
    fontColor = Colors.accent,
    imageContent,
    contentCenter,
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
            </Title>

            <Caption
                family="regular"
                style={[
                    contentCenter && { textAlign: 'center' },
                    { color: fontColor }
                ]}>
                {title}
            </Caption>
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
    imageContent: PropTypes.element
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 20,
        borderRadius: 12,
        margin: 10,
        width: width / 2 - 30
        // flex: 1
    }
});
