import React from 'react';
import { View } from 'react-native';
import { Title, Body, Caption } from '../../components';

const ProgressStatCard = ({ value, title, tagline, color, style }) => {
    return (
        <View
            style={[
                style,
                {
                    // borderTopColor: color,
                    // borderTopWidth: 4,
                    borderRadius: 8,
                    paddingLeft: 10,
                    paddingVertical: 10
                }
            ]}>
            <Title style={{ color }}>{value}</Title>
            <Body style={{ color }}>{title}</Body>
            <Caption>{tagline}</Caption>
        </View>
    );
};

export default ProgressStatCard;
