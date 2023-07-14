import React from 'react';
import {StyleSheet} from 'react-native';
import StyledText from './StyledText';

interface SubTitleProps {
    color: any;
    children: any;
    dictionary: any;
    family: any;
    style: any;
    values: any;
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
        fontSize: 20,
    },
});

export default SubTitle;
