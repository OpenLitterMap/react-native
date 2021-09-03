import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text } from 'react-native';
import { TransText } from 'react-native-translation';
import { Colors, ColorType, FontType, Fonts } from '../theme';

const StyledText = ({
    family = 'semiBold',
    style,
    color = 'text',
    children,
    dictionary,
    values,
    ...rest
}) => {
    const textColor = Colors[`${color}`];
    const font = Fonts[`${family}`];
    if (dictionary) {
        return (
            <TransText
                values={values}
                dictionary={dictionary}
                style={[styles.text, { color: textColor }, font, style]}
            />
        );
    }
    return (
        <Text
            {...rest}
            style={[styles.text, { color: textColor }, font, style]}>
            {children}
        </Text>
    );
};

StyledText.propTypes = {
    family: PropTypes.oneOf(FontType),
    style: PropTypes.any,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    dictionary: PropTypes.string,
    values: PropTypes.object
};

const styles = StyleSheet.create({
    text: {
        textAlign: 'left'
    }
});

export default StyledText;
