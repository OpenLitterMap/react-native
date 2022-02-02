import { StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { Colors, ColorType } from './theme';

const Button = ({
    style,
    buttonColor = 'accent',
    variant = 'default',
    onPress,
    children,
    disabled,
    loading,
    ...rest
}) => {
    let variantStyle;

    const buttonThemeColor = Colors[`${buttonColor}`];
    variant === 'default'
        ? (variantStyle = { backgroundColor: buttonThemeColor })
        : (variantStyle = {
              borderColor: buttonThemeColor,
              borderWidth: 1
          });

    let disabledStyle = disabled && {
        backgroundColor: `${buttonThemeColor}80` // adding 50% opacity to background
    };

    return (
        <Pressable
            disabled={disabled || loading}
            {...rest}
            onPress={onPress}
            style={[styles.buttonStyle, variantStyle, style, disabledStyle]}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'default' ? 'white' : buttonThemeColor}
                />
            ) : (
                <>{children}</>
            )}
        </Pressable>
    );
};

Button.propTypes = {
    style: PropTypes.any,
    color: PropTypes.oneOf(ColorType),
    children: PropTypes.node,
    variant: PropTypes.oneOf(['default', 'outline'])
};

export default Button;

const styles = StyleSheet.create({
    buttonStyle: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
    }
});
