import React from 'react';
// import PropTypes from 'prop-types';
// import stylePropType from 'react-style-proptype';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import {Colors} from '../theme';

interface CustomTextInputProps {
    label?: string;
    defaultValue?: string;
    inputStyle?: TextStyle;
    style?: StyleProp<ViewStyle>;
    labelStyle: TextStyle;
    editable?: boolean;
    touched?: boolean;
    error?: string;
    value?: string;
    name: string;
    placeholder?: string;
    leftIconName?: string;
    rightIconName?: string;
    rightContent?: React.ReactElement;
    leftContent?: React.ReactElement;
}

const CustomTextInput: React.ForwardRefRenderFunction<
    TextInput,
    CustomTextInputProps
> = (
    {
        // label,
        //defaultValue,
        style,
        inputStyle,
        // labelStyle,
        // editable = true,
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
    ref,
) => {
    return (
        <>
            <View
                style={[
                    styles.textfieldContainer,
                    style,
                    // touched && error && styles.errorBorder,
                ]}>
                {leftContent}
                {leftIconName && (
                    <Icon
                        style={styles.textfieldIcon}
                        name={leftIconName}
                        size={28}
                        color={touched && error ? Colors.error : Colors.muted}
                    />
                )}

                <TextInput
                    {...rest}
                    ref={ref}
                    style={[
                        styles.input,
                        inputStyle,
                        // touched && error && styles.errorText,
                    ]}
                    placeholder={placeholder}
                    value={value}
                    autoFocus={false}
                    autoCorrect={false}
                    autoCapitalize={'none'}
                    autoComplete="off"
                    textContentType="none"
                    underlineColorAndroid="transparent"
                    // name={name}
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
                {/*<View style={[touched && error && styles.errorContainer]}>*/}
                {/*    {touched && error && (*/}
                {/*        <Caption color="white" dictionary={error} />*/}
                {/*    )}*/}
                {/*</View>*/}
            </View>
        </>
    );
};

export default React.forwardRef<TextInput, CustomTextInputProps>(
    CustomTextInput,
);

const styles = StyleSheet.create({
    textfieldContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    textfieldIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingRight: 10,
        fontSize: 16,
        letterSpacing: 0.5,
        backgroundColor: Colors.white,
        color: Colors.text,
        fontFamily: 'Poppins-Regular',
        textAlignVertical: 'top',
    },
    errorBorder: {
        borderColor: Colors.error,
    },
    errorText: {
        color: Colors.error,
    },
    errorMessage: {
        height: 24,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    errorContainer: {
        backgroundColor: 'red',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 4,
    },
});
