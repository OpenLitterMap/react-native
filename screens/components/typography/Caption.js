import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import StyledText from './StyledText';
import { ColorType, FontType } from '../theme';

const Caption = ({
    family = 'regular',
    style,
    color = 'muted',
    children,
    dictionary,
    ...rest
}) => {
    return (
        <StyledText
            style={[styles.text, style]}
            family={family}
            color={color}
            dictionary={dictionary}
            {...rest}>
            {children}
        </StyledText>
    );
};

Caption.propTypes = {
    family: PropTypes.oneOf(FontType),
    style: PropTypes.any,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    dictionary: PropTypes.string
};

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        letterSpacing: 1
    }
});

export default Caption;
