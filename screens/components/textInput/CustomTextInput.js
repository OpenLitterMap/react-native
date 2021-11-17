import React from 'react';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    StyleSheet,
    Text,
    View,
    StyleProp,
    TextStyle,
    TextInput,
    ViewPropTypes
} from 'react-native';
import { Body } from '../typography';
import { Colors } from '../theme';

const CustomTextInput = ({
    label,
    defaultValue,
    style,
    inputStyle,
    labelStyle,
    editable = true,
    name,
    value,
    touched,
    error,
    placeholder,
    leftIconName,
    ...rest
}) => {
    return (
        <>
            <View
                style={[
                    styles.textfieldContainer,
                    touched && error && styles.errorBorder
                ]}>
                <Icon
                    style={styles.textfieldIcon}
                    name={leftIconName}
                    size={28}
                    color={touched && error ? Colors.error : Colors.muted}
                />
                <TextInput
                    {...rest}
                    style={[styles.input, touched && error && styles.errorText]}
                    placeholder={placeholder}
                    // onChangeText={handleChange(`${name}`)}
                    value={value}
                    underlineColorAndroid="transparent"
                    name={name}
                />
            </View>
            {touched && error && <Body>{error}</Body>}
        </>
    );
};

CustomTextInput.prototypes = {
    label: PropTypes.string,
    defaultValue: PropTypes.string,
    style: ViewPropTypes ? ViewPropTypes.style : View.propTypes?.style,
    inputStyle: Text.propTypes?.style,
    labelStyle: TextStyle,
    editable: PropTypes.bool,
    touched: PropTypes.bool,
    error: PropTypes.string,
    value: PropTypes.string,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    leftIconName: PropTypes.string
};

export default CustomTextInput;

const styles = StyleSheet.create({
    textfieldContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 60,
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: Colors.white
    },
    textfieldIcon: {
        padding: 10
    },
    input: {
        flex: 1,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 0,
        backgroundColor: '#fff',
        color: '#424242'
    },
    errorBorder: {
        borderColor: Colors.error
    },
    errorText: {
        color: Colors.error
    }
});
