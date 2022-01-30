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

    variant === 'default'
        ? (variantStyle = { backgroundColor: Colors[`${buttonColor}`] })
        : (variantStyle = {
              borderColor: Colors[`${buttonColor}`],
              borderWidth: 1
          });

    return (
        <Pressable
            disabled={disabled || loading}
            {...rest}
            onPress={onPress}
            style={[styles.buttonStyle, variantStyle, style]}>
            {loading ? <ActivityIndicator color="white" /> : <>{children}</>}
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
