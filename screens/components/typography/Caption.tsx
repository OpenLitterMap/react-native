import React from 'react';
import {StyleProp, StyleSheet, TextStyle} from 'react-native';
import StyledText from './StyledText';
import {Colors, Fonts} from '../theme';

interface CaptionProps {
    family?: keyof typeof Fonts;
    style?: StyleProp<TextStyle>;
    color?: keyof typeof Colors;
    children?: React.ReactNode; //  PropTypes.node,
    dictionary?: string;
    values?: object;
}

const Caption: React.FC<CaptionProps> = ({
    family = 'regular',
    style,
    color = 'muted',
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
            values={values}
            dictionary={dictionary}
            {...rest}>
            {children}
        </StyledText>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        letterSpacing: 1
    }
});

export default Caption;
