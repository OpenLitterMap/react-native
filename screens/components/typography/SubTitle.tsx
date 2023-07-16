import React from 'react';
import {StyleProp, StyleSheet, TextStyle} from 'react-native';
import StyledText from './StyledText';
import {Colors, Fonts} from '../theme';

interface SubTitleProps {
    family?: keyof typeof Fonts;
    style?: StyleProp<TextStyle>;
    color?: keyof typeof Colors;
    children?: React.ReactNode;
    dictionary?: string;
    values?: object; // Record<string, any>; ?
}

const SubTitle: React.FC<SubTitleProps> = ({
    color = 'text',
    family = 'medium',
    style,
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
        fontSize: 20
    }
});

export default SubTitle;
