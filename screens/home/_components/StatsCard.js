import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { Title, SubTitle } from '../../components';
const { width } = Dimensions.get('window');

const StatsCard = ({ style, value, title }) => {
    return (
        <View style={[styles.container, style]}>
            <Title>{value}</Title>
            <SubTitle family="regular">{title}</SubTitle>
        </View>
    );
};

export default StatsCard;

StatsCard.propTypes = {
    value: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    style: PropTypes.any
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
