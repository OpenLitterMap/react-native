import { StyleSheet, Pressable, View, TextInput } from 'react-native';
import React, { Component } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import { Body, Button, Colors, Caption } from '../../components';

const JoinTeamSchema = Yup.object().shape({
    id: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long')
});
class JoinTeamForm extends Component {
    render() {
        const { teamsFormError } = this.props;
        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 20
                    }}>
                    <Body>Join team by identifier</Body>
                    <Pressable onPress={this.props.backPress}>
                        <Body color="accent">Back</Body>
                    </Pressable>
                </View>

                <Formik
                    initialValues={{ id: '' }}
                    validationSchema={JoinTeamSchema}
                    onSubmit={async values => {
                        await this.props.joinTeam(this.props.token, values.id);
                    }}>
                    {({
                        isValid,
                        isSubmitting,
                        handleSubmit,
                        errors,
                        touched,
                        handleChange
                    }) => (
                        <>
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

                            <View
                                style={{
                                    height: 30,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Caption color="error">
                                    {teamsFormError}
                                </Caption>
                            </View>

                            <Button
                                disabled={!isValid}
                                loading={isSubmitting}
                                onPress={handleSubmit}
                                style={{
                                    marginVertical: 20
                                }}>
                                <Body color="white">JOIN TEAM</Body>
                            </Button>
                        </>
                    )}
                </Formik>
            </View>
        );
    }
}

// export default JoinTeamForm;

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
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        teamsFormError: state.teams.teamsFormError,
        token: state.auth.token
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    actions
)(JoinTeamForm);
