import {
    ActivityIndicator,
    StyleSheet,
    Pressable,
    View,
    TextInput
} from 'react-native';
import React, { Component, createRef } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import { Body, Colors, Caption, SubTitle } from '../../components';
import StatusModal from './StatusModal';

const JoinTeamSchema = Yup.object().shape({
    identifier: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long'),
    name: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(100, 'Maximum 100 characters long')
});
class CreateTeamForm extends Component {
    constructor(props) {
        super(props);

        this.identifierRef = React.createRef();
    }
    render() {
        const { user, teamsFormError, token } = this.props;
        return (
            <View>
                <Formik
                    initialValues={{ name: '', identifier: '' }}
                    validationSchema={JoinTeamSchema}
                    onSubmit={values => {
                        console.log('called');
                        this.props.createTeam(
                            values.name,
                            values.identifier,
                            token
                        );
                    }}>
                    {({
                        isSubmitting,
                        handleSubmit,
                        setFieldValue,
                        values,
                        errors,
                        touched,
                        handleChange
                    }) => (
                        <>
                            {user?.remaining_teams === 0 ? (
                                <StatusModal
                                    text="You have already created the maximum
                                allowed number of teams."
                                    type="ERROR"
                                />
                            ) : (
                                <>
                                    <SubTitle>Create a Team</SubTitle>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 8,
                                            marginBottom: 20
                                        }}>
                                        <Icon
                                            name="ios-information-circle-sharp"
                                            style={{ marginRight: 8 }}
                                            size={18}
                                            color={Colors.muted}
                                        />
                                        <Caption>
                                            You are allowed to create{' '}
                                            {user?.remaining_teams} team(s)
                                        </Caption>
                                    </View>
                                    <Body>Team Name</Body>
                                    <TextInput
                                        name="name"
                                        autoFocus={false}
                                        autoCorrect={false}
                                        autoCapitalize={'none'}
                                        autoCompleteType="off"
                                        textContentType="none"
                                        onChangeText={handleChange('name')}
                                        style={styles.input}
                                        onSubmitEditing={() =>
                                            this.identifierRef.current.focus()
                                        }
                                        returnKeyType="next"
                                        placeholder="My Litterpicker Team"
                                    />
                                    {touched.name && errors.name && (
                                        <Caption color="error">
                                            {errors.name}
                                        </Caption>
                                    )}
                                    <Body style={{ marginTop: 20 }}>
                                        Unique Team Identifier
                                    </Body>
                                    <Caption>
                                        Anyone with this ID will be able to join
                                        your team.
                                    </Caption>
                                    <TextInput
                                        ref={this.identifierRef}
                                        name="identifier"
                                        autoFocus={false}
                                        autoCorrect={false}
                                        autoCapitalize={'none'}
                                        autoCompleteType="off"
                                        textContentType="none"
                                        onChangeText={handleChange(
                                            'identifier'
                                        )}
                                        style={styles.input}
                                        onSubmitEditing={handleSubmit}
                                        returnKeyType="go"
                                        placeholder="LitterTeam2022"
                                    />
                                    {touched.identifier &&
                                        errors.identifier && (
                                            <Caption color="error">
                                                {errors.identifier}
                                            </Caption>
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

                                    <Pressable
                                        onPress={handleSubmit}
                                        style={[
                                            styles.buttonStyle,
                                            {
                                                backgroundColor: Colors.accent,
                                                marginVertical: 20
                                            }
                                        ]}>
                                        <Body color="white">CREATE TEAM</Body>
                                    </Pressable>
                                </>
                            )}
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
        teamsFormError: state.teams.teamsFormError,
        token: state.auth.token,
        user: state.auth.user
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    actions
)(CreateTeamForm);
