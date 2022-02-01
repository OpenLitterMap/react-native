import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import React, { Component } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../../actions';
import { connect } from 'react-redux';
import { Body, Colors, Caption, SubTitle, Button } from '../../components';
import StatusModal from './StatusModal';

const JoinTeamSchema = Yup.object().shape({
    identifier: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long'),
    name: Yup.string()
        .required('Enter team name')
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
                    onSubmit={async values => {
                        await this.props.createTeam(
                            values.name,
                            values.identifier,
                            token
                        );
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
                            {user?.remaining_teams <= 0 ? (
                                <StatusModal
                                    text="You have already created the maximum
                                allowed number of teams."
                                    type="ERROR"
                                />
                            ) : (
                                <>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between'
                                        }}>
                                        <SubTitle>Create a Team</SubTitle>
                                        <Pressable
                                            onPress={this.props.backPress}>
                                            <Body color="accent">Back</Body>
                                        </Pressable>
                                    </View>
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

                                    <Button
                                        disabled={!isValid}
                                        loading={isSubmitting}
                                        onPress={handleSubmit}
                                        style={{
                                            backgroundColor: Colors.accent,
                                            marginVertical: 20
                                        }}>
                                        <Body color="white">CREATE TEAM</Body>
                                    </Button>
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
