import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {CountUp} from 'use-count-up';
import {Caption, Title} from '../typography';
import {Colors} from '../theme';

const {width} = Dimensions.get('window');

interface IconStatsCardProps {
    value: number;
    family?: string;
    startValue?: number;
    title: string;
    style?: any;

    fontColor?: string;
    backgroundColor?: string;
    contentCenter?: boolean;
    ordinal?: boolean;
    imageContent?: React.ReactNode; // was element
    width: number;
}

// fn to get ordinal of number
export const getOrdinal = (number: number) => {
    const b = number % 10;
    return Math.floor((number % 100) / 10) === 1
        ? 'th'
        : b === 1
        ? 'st'
        : b === 2
        ? 'nd'
        : b === 3
        ? 'rd'
        : 'th';
};

const IconStatsCard: React.FC<IconStatsCardProps> = ({
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
                contentCenter && {alignItems: 'center', width: width},
                {
                    backgroundColor
                },
                style
            ]}>
            {imageContent && (
                <View style={{marginBottom: 6}}>{imageContent}</View>
            )}

            <Title
                style={[
                    contentCenter && {textAlign: 'center'},
                    {color: fontColor, fontSize: 24}
                ]}>
                <CountUp
                    isCounting={startValue !== value}
                    start={startValue}
                    end={value}
                    duration={5}
                    formatter={value => value.toLocaleString()}
                    decimalPlaces={0}
                />
                {ordinal &&
                    value !== 0 &&
                    value !== undefined &&
                    getOrdinal(value)}
            </Title>

            <Caption
                family="regular"
                style={[
                    contentCenter && {textAlign: 'center'},
                    {color: fontColor}
                ]}
                dictionary={title}
            />
        </View>
    );
};

export default IconStatsCard;

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
