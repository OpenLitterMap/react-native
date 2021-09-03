import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { Title, SubTitle, Colors } from '../../components';
const { width } = Dimensions.get('window');

const StatsCard = ({
    style,
    value,
    title,
    fontColor,
    backgroundColor = Colors.accent
}) => {
    return (
        <View style={[styles.container, { backgroundColor }, style]}>
            <Title style={{ color: fontColor }}>{value}</Title>
            <SubTitle family="regular" style={{ color: fontColor }}>
                {title}
            </SubTitle>
        </View>
    );
};

export default StatsCard;

StatsCard.propTypes = {
    value: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    style: PropTypes.any,
    fontColor: PropTypes.string,
    backgroundColor: PropTypes.string
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
