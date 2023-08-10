import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native';
import {Colors, Fonts} from '../theme';
import {TransText} from 'react-native-translation';

interface StyledTextProps {
    family?: keyof typeof Fonts;
    style?: StyleProp<TextStyle>;
    color?: keyof typeof Colors;
    children?: React.ReactNode;
    dictionary?: string;
    values?: Record<string, any>;
}

const StyledText: React.FC<StyledTextProps> = ({
    family = 'semiBold',
    style,
    color = 'text',
    children,
    dictionary,
    values,
    ...rest
}) => {
    const textColor = Colors[color as keyof typeof Colors];
    const font = Fonts[family as keyof typeof Fonts];

    if (dictionary) {
        return (
            <TransText
                values={values}
                dictionary={dictionary}
                style={[styles.text, {color: textColor}, font, style]}
            />
        );
    }
    return (
        <Text {...rest} style={[styles.text, {color: textColor}, font, style]}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        textAlign: 'left'
    }
});

export default StyledText;
