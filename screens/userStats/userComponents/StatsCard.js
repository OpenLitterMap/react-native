import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Colors, SubTitle, Title } from '../../components';

const StatsCard = ({
    style,
    value,
    title,
    fontColor,
    backgroundColor = Colors.accent
}) => {
    const { width } = useWindowDimensions();

    return (
        <View style={[styles.container, {backgroundColor, width: width / 2 - 30}, style]}>
            <Title style={{color: fontColor}}>{value}</Title>
            <SubTitle family="regular" style={{color: fontColor}}>
                {title}
            </SubTitle>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#cbd8ff',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 12,
        margin: 10
    }
});

export default StatsCard;
