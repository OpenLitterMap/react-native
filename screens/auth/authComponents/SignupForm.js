import React, { Component } from 'react';
import { Button, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import { Body, Colors, SubTitle } from '../../components';
import * as Yup from 'yup';

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
                        <TextInput
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            value={values.email}
                            style={styles.inputStyle}
                            name="email"
                        />
                        {errors.email && touched.email ? (
                            <Body>{errors.email}</Body>
                        ) : null}
                        {/* <TextInput
                            onChangeText={handleChange('password')}
                            onBlur={handleBlur('password')}
                            value={values.email}
                            style={styles.inputStyle}
                        /> */}
                        {/* <Button onPress={handleSubmit} title="Submit" /> */}
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
    }
});
