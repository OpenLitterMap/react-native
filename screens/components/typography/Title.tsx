import React from 'react';
import {StyleProp, StyleSheet, TextStyle} from 'react-native';
import StyledText from './StyledText';
import {Colors, Fonts} from '../theme';

interface TitleProps {
    family?: keyof typeof Fonts;
    style?: StyleProp<TextStyle>;
    color?: keyof typeof Colors; // ColorType
    children?: React.ReactNode; // PropTypes.node,
    dictionary?: string;
    values?: object; // Record<string, any>; ?
}

const Title: React.FC<TitleProps> = ({
    family = 'semiBold',
    style,
    color = 'text',
    children,
    dictionary,
    values,
    ...rest
}) => {
    return (
        <StyledText
            style={[styles.text, style]}
            family={family}
            color={color}
            dictionary={dictionary}
            values={values}
            {...rest}>
            {children}
        </StyledText>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 24
    }
});

export default Title;
