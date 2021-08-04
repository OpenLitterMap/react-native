import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import StyledText from './StyledText';
import { ColorType, FontType } from '../theme';

const Title = ({
    family = 'semiBold',
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
            dictionary={dictionary}
            {...rest}>
            {children}
        </StyledText>
    );
};

Title.propTypes = {
    family: PropTypes.oneOf(FontType),
    style: PropTypes.any,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    dictionary: PropTypes.string
};

const styles = StyleSheet.create({
    text: {
        fontSize: 24
    }
});

export default Title;
