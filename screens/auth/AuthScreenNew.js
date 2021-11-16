import React, { Component } from 'react';
import {
    Button,
    TextInput,
    View,
    ScrollView,
    StyleSheet,
    Image,
    Dimensions
} from 'react-native';
import { Formik } from 'formik';
import { Colors } from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export class AuthScreen extends Component {
    render() {
        return (
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={'handled'}>
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/logo/logo.png')}
                        style={styles.logo}
                        // resizeMethod="auto"
                        resizeMode="contain"
                    />
                </View>
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
            </ScrollView>
        );
    }
}
const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: '#3498db'
    },
    scrollContainer: {
        flexGrow: 1,
        flexDirection: 'column'
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80
    },
    logo: {
        height: 200,
        width: SCREEN_WIDTH - 60
    }
});

export default AuthScreen;
