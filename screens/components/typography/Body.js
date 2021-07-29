import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, TextStyle } from 'react-native';
import StyledText from './StyledText';
import { ColorType, FontType } from '../theme';

const Body = ({
    family = 'regular',
    style,
    color = 'text',
    children,
    dictionary,
    ...rest
}) => {
    return (
        <StyledText
            style={[styles.text, style]}
            family={family}
            color={color}
            {...rest}>
            {children}
        </StyledText>
    );
};

Body.propTypes = {
    family: PropTypes.oneOf(FontType),
    style: PropTypes.Text,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    dictionary: PropTypes.string
};

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        letterSpacing: 0.5
    }
});

export default Body;
