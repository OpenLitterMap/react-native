import { StyleSheet, Pressable, View, TextInput } from 'react-native';
import React, { Component } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import DropDownPicker from 'react-native-dropdown-picker';
import { Body, CustomTextInput, Colors, Caption } from '../../components';

const JoinTeamSchema = Yup.object().shape({
    identifier: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long'),
    name: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(100, 'Maximum 15 characters long'),
    teamType: Yup.number().required()
});
class CreateTeamForm extends Component {
    componentDidMount() {
        this.props.getTeamTypes(this.props.token);
    }
    render() {
        return (
            <View>
                <Formik
                    initialValues={{ id: '' }}
                    validationSchema={JoinTeamSchema}
                    onSubmit={values => {
                        console.log('called');
                        // this.props.sendResetPasswordRequest(values.email);
                        // this.props.joinTeam(this.props.token, values.id);
                    }}>
                    {({
                        handleSubmit,
                        setFieldValue,
                        values,
                        errors,
                        touched,
                        handleChange
                    }) => (
                        <>
                            {/* <DropDownPicker
                                // open={open}
                                // value={value}
                                items={[
                                    { label: 'Apple', value: 'apple' },
                                    { label: 'Banana', value: 'banana' }
                                ]}
                                setOpen={false}
                                // setValue={setValue}
                                setItems={[
                                    { label: 'Apple', value: 'apple' },
                                    { label: 'Banana', value: 'banana' }
                                ]}
                            /> */}
                            <Body>Team Name</Body>
                            <TextInput
                                name="id"
                                autoFocus={false}
                                autoCorrect={false}
                                autoCapitalize={'none'}
                                autoCompleteType="off"
                                textContentType="none"
                                onChangeText={handleChange('id')}
                                style={styles.input}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="go"
                                placeholder="Enter ID to join a team"
                            />
                            {touched.id && errors.id && (
                                <Caption color="error">{errors.id}</Caption>
                            )}
                            <Body style={{ marginTop: 20 }}>
                                Unique Team Identifier
                            </Body>
                            <Caption>
                                Anyone with this ID will be able to join your
                                team.
                            </Caption>
                            <TextInput
                                name="id"
                                autoFocus={false}
                                autoCorrect={false}
                                autoCapitalize={'none'}
                                autoCompleteType="off"
                                textContentType="none"
                                onChangeText={handleChange('id')}
                                style={styles.input}
                                onSubmitEditing={handleSubmit}
                                returnKeyType="go"
                                placeholder="Enter ID to join a team"
                            />
                            {touched.id && errors.id && (
                                <Caption color="error">{errors.id}</Caption>
                            )}

                            <Pressable
                                onPress={handleSubmit}
                                style={[
                                    styles.buttonStyle,
                                    {
                                        backgroundColor: Colors.accent,
                                        marginVertical: 40
                                    }
                                ]}>
                                <Body color="white">CREATE TEAM</Body>
                            </Pressable>
                        </>
                    )}
                </Formik>
            </View>
        );
    }
}

// export default CreateTeamForm;

const styles = StyleSheet.create({
    input: {
        marginTop: 10,
        padding: 10,
        fontSize: 16,
        letterSpacing: 0.5,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.muted,
        borderRadius: 8,
        color: Colors.text,
        fontFamily: 'Poppins-Regular',
        textAlignVertical: 'top',
        height: 60
    },
    buttonStyle: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 20
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        token: state.auth.token
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    actions
)(CreateTeamForm);
