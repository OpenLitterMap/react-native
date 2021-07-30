import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { Colors, Title, Caption } from '../../components';
const { width } = Dimensions.get('window');

const IconStatsCard = ({
    style,
    value,
    title,
    fontColor,
    imageContent,
    contentCenter,
    backgroundColor = Colors.accent
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
                <View style={{ marginBottom: 20 }}>{imageContent}</View>
            )}

            <Title
                style={[
                    contentCenter && { textAlign: 'center' },
                    { color: fontColor }
                ]}>
                {value}
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
    value: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    style: PropTypes.any,
    fontColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    contentCenter: PropTypes.bool,
    imageContent: PropTypes.element
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#cbd8ff',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 12,
        margin: 10,
        width: width / 2 - 30
        // flex: 1
    }
});
