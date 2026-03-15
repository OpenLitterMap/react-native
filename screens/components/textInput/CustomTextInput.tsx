import React from 'react';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import {Colors} from '../theme';

interface CustomTextInputProps {
    autoCorrect?: boolean;
    inputStyle?: TextStyle;
    style?: StyleProp<ViewStyle>;
    touched?: boolean;
    error?: string;
    errorText?: string;
    value?: string;
    name?: string;
    placeholder?: string;
    leftIconName?: string;
    rightIconName?: string;
    rightContent?: React.ReactElement;
    leftContent?: React.ReactElement;
    placeholderTextColor?: string;
    variant?: 'light' | 'dark';
    ref?: React.Ref<TextInput>;
}

const CustomTextInput = ({
    style,
    inputStyle,
    value,
    touched,
    error,
    errorText,
    placeholder,
    leftIconName,
    leftContent,
    rightIconName,
    rightContent,
    variant = 'dark',
    ref,
    ...rest
}: CustomTextInputProps) => {
    const hasError = touched && error;
    const isDark = variant === 'dark';

    const errorColor = isDark ? '#ff8a80' : Colors.error;
    const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : Colors.muted;
    const iconColor = hasError ? errorColor : mutedColor;

    return (
        <View style={[styles.wrapper, style]}>
            {hasError && (
                <View style={styles.errorLabelContainer}>
                    <Icon
                        name="alert-circle-outline"
                        size={14}
                        color={errorColor}
                    />
                    <Text
                        style={[
                            styles.errorLabel,
                            isDark && styles.errorLabelDark
                        ]}>
                        {errorText || error}
                    </Text>
                </View>
            )}
            <View
                style={[
                    styles.textFieldContainer,
                    isDark && styles.textFieldDark,
                    hasError &&
                        (isDark ? styles.errorBorderDark : styles.errorBorder)
                ]}>
                {leftContent}
                {leftIconName && (
                    <Icon
                        style={styles.textFieldIcon}
                        name={leftIconName}
                        size={22}
                        color={iconColor}
                    />
                )}

                <TextInput
                    {...rest}
                    ref={ref}
                    style={[
                        styles.input,
                        isDark && styles.inputDark,
                        inputStyle
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={
                        isDark ? 'rgba(255,255,255,0.4)' : Colors.muted
                    }
                    value={value}
                    autoFocus={false}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoComplete="off"
                    textContentType="none"
                    underlineColorAndroid="transparent"
                />
                {rightContent}
                {rightIconName && (
                    <Icon
                        style={styles.textFieldIcon}
                        name={rightIconName}
                        size={22}
                        color={mutedColor}
                    />
                )}
            </View>
        </View>
    );
};

export default CustomTextInput;

const styles = StyleSheet.create({
    wrapper: {},
    textFieldContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        height: 52
    },
    textFieldDark: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.2)'
    },
    textFieldIcon: {
        paddingHorizontal: 12
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingRight: 12,
        fontSize: 16,
        letterSpacing: 0.3,
        backgroundColor: 'transparent',
        color: Colors.text,
        fontFamily: 'Poppins-Regular'
    },
    inputDark: {
        color: Colors.white
    },
    errorBorder: {
        borderColor: Colors.error
    },
    errorBorderDark: {
        borderColor: '#ff8a80'
    },
    errorLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        marginBottom: 4
    },
    errorLabel: {
        color: Colors.error,
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        marginLeft: 4,
        letterSpacing: 0.3
    },
    errorLabelDark: {
        color: '#ff8a80'
    }
});
