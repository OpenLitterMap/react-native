import React, { Component } from 'react';
import { Button, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import { Body, Colors, SubTitle } from '../../components';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

const SignupSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email')
        .required('Required')
});

class AuthTest extends Component {
    render() {
        return (
            <Formik
                initialValues={{ email: '' }}
                validationSchema={SignupSchema}
                onSubmit={values => console.log(values)}>
                {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={styles.textfieldContainer}>
                            <Icon
                                style={styles.textfieldIcon}
                                name="ios-person-circle"
                                size={28}
                                color={Colors.muted}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Unique Username"
                                underlineColorAndroid="transparent"
                                name="username"
                            />
                        </View>

                        <View style={styles.textfieldContainer}>
                            <Icon
                                style={styles.textfieldIcon}
                                name="ios-mail"
                                size={28}
                                color={Colors.muted}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                underlineColorAndroid="transparent"
                            />
                        </View>
                        <View style={styles.textfieldContainer}>
                            <Icon
                                style={styles.textfieldIcon}
                                name="ios-key"
                                size={28}
                                color={Colors.muted}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                underlineColorAndroid="transparent"
                            />
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            style={styles.buttonStyle}>
                            <SubTitle color="accentLight">
                                Create Account
                            </SubTitle>
                        </Pressable>
                    </View>
                )}
            </Formik>
        );
    }
}

export default AuthTest;

const styles = StyleSheet.create({
    inputStyle: {
        height: 60,
        backgroundColor: 'white',
        borderRadius: 8,
        marginVertical: 10
    },
    buttonStyle: {
        alignItems: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 6,
        height: 60,
        opacity: 1,
        marginBottom: 10,
        justifyContent: 'center',
        width: '100%',
        marginTop: 20
    },
    textfieldContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 60,
        borderRadius: 8,
        marginVertical: 10
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
    }
});
