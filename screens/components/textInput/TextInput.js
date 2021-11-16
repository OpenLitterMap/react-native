import React from 'react';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';
import {
    StyleSheet,
    Text,
    View,
    StyleProp,
    TextStyle,
    TextInput as RNTextInput,
    ViewPropTypes
} from 'react-native';
import { Body } from '../typography';

const TextInput = ({
    label,
    value,
    defaultValue,
    style,
    inputStyle,
    labelStyle,
    editable,
    ...rest
}) => {
    return (
        <View>
            {label ? <Body style={labelStyle}>{label}</Body> : null}

            <RNTextInput
                {...rest}
                autoFocus={false}
                autoCorrect={false}
                autoCapitalize={'none'}
                autoCompleteType={'off'}
                style={{
                    height: 60,
                    backgroundColor: 'white',
                    borderRadius: 8
                }}
            />
        </View>
    );
};

TextInput.prototypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    style: ViewPropTypes ? ViewPropTypes.style : View.propTypes?.style,
    inputStyle: Text.propTypes?.style,
    labelStyle: TextStyle,
    editable: PropTypes.bool
};

export default TextInput;

const styles = StyleSheet.create({});
