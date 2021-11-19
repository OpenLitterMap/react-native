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
import { Caption } from '../typography';
import { Colors, Fonts } from '../theme';

const CustomTextInput = React.forwardRef(
    (
        {
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
            leftContent,
            rightIconName,
            rightContent,
            ...rest
        },
        ref
    ) => {
        return (
            <>
                <View
                    style={[
                        styles.textfieldContainer,
                        touched && error && styles.errorBorder
                    ]}>
                    {leftContent}
                    {leftIconName && (
                        <Icon
                            style={styles.textfieldIcon}
                            name={leftIconName}
                            size={28}
                            color={
                                touched && error ? Colors.error : Colors.muted
                            }
                        />
                    )}

                    <TextInput
                        {...rest}
                        ref={ref}
                        style={[
                            styles.input,
                            touched && error && styles.errorText
                        ]}
                        placeholder={placeholder}
                        value={value}
                        autoFocus={false}
                        autoCorrect={false}
                        autoCapitalize={'none'}
                        underlineColorAndroid="transparent"
                        name={name}
                    />
                    {rightContent}
                    {rightIconName && (
                        <Icon
                            style={styles.textfieldIcon}
                            name={rightIconName}
                            size={28}
                            color={Colors.muted}
                        />
                    )}
                </View>
                <View style={styles.errorMessage}>
                    <View style={[touched && error && styles.errorContainer]}>
                        {touched && error && (
                            <Caption color="white" dictionary={error} />
                        )}
                    </View>
                </View>
            </>
        );
    }
);

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
    leftIconName: PropTypes.string,
    rightIconName: PropTypes.string,
    rightContent: PropTypes.element,
    leftContent: PropTypes.element
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
        fontSize: 16,
        letterSpacing: 0.5,
        backgroundColor: Colors.white,
        color: Colors.text,
        fontFamily: 'Poppins-Regular'
    },
    errorBorder: {
        borderColor: Colors.error
    },
    errorText: {
        color: Colors.error
    },
    errorMessage: {
        height: 24,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    errorContainer: {
        backgroundColor: 'red',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 4
    }
});
