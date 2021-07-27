import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import { TransText } from 'react-native-translation';
import { Colors, ColorType } from '../../theme';

const StyledText = ({
    family = 'semiBold',
    style,
    color = 'text',
    children,
    dictionary,
    ...rest
}) => {
    const textColor = Colors[`${color}`];
    if (dictionary) {
        return (
            <TransText
                dictionary={dictionary}
                style={[styles.text, { color: textColor }, style]}
            />
        );
    }
    return (
        <Text {...rest} style={[styles.text, { color: textColor }, style]}>
            {children}
        </Text>
    );
};

StyledText.propTypes = {
    family: PropTypes.string,
    style: PropTypes.object,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    dictionary: PropTypes.string
};

const styles = StyleSheet.create({
    text: {
        textAlign: 'left'
    }
});

export default StyledText;
