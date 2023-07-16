import React from 'react';
import {StyleSheet} from 'react-native';
import StyledText from './StyledText';
import {Colors, Fonts} from '../theme';

interface BodyProps {
    family?: keyof typeof Fonts;
    style?: any;
    color?: keyof typeof Colors;
    children?: React.ReactNode;
    dictionary?: string;
    values?: object;
}

const Body: React.FC<BodyProps> = ({
    family = 'regular',
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

Body.propTypes = {};

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        letterSpacing: 0.5
    }
});

export default Body;
