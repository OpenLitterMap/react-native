import React, { Component } from 'react';
import { Button, TextInput, View } from 'react-native';
import { Formik } from 'formik';

class AuthTest extends Component {
    render() {
        return (
            <Formik
                initialValues={{ email: '' }}
                onSubmit={values => console.log(values)}>
                {({ handleChange, handleBlur, handleSubmit, values }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <TextInput
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            value={values.email}
                            style={{ backgroundColor: 'pink', height: 48 }}
                        />
                        <Button onPress={handleSubmit} title="Submit" />
                    </View>
                )}
            </Formik>
        );
    }
}

export default AuthTest;
