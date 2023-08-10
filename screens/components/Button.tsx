import {ActivityIndicator, Pressable, StyleSheet} from 'react-native';
import React from 'react';
import {Colors} from './theme';

interface ButtonProps {
    style?: any;
    color: keyof typeof Colors;
    children: React.ReactNode;
    variant?: 'default' | 'outline';
    buttonColor?: keyof typeof Colors;
    disabled?: boolean;
    loading?: boolean;
    onPress?: () => void; // Added onPress property
}

const Button: React.FC<ButtonProps> = ({
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
        ? (variantStyle = {backgroundColor: buttonThemeColor})
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

export default Button;

const styles = StyleSheet.create({
    buttonStyle: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
    }
});
