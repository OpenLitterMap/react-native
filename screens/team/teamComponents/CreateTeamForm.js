import React, { useRef } from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { createTeam } from "../../../reducers/team_reducer";
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Colors, Caption, SubTitle, Button } from '../../components';
import StatusModal from './StatusModal';

const CreateTeamSchema = Yup.object().shape({
    identifier: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long'),
    name: Yup.string()
        .required('Enter team name')
        .min(3, 'Minimum 3 characters long')
        .max(100, 'Maximum 100 characters long')
});

const CreateTeamForm = ({ backPress }) => {

    const dispatch = useDispatch();
    const identifierRef = useRef(null);
    const user = useSelector(state => state.auth.user);
    const token = useSelector(state => state.auth.token);
    const teamsFormError = useSelector(state => state.teams.teamsFormError);

    return (
        <View>
            <Formik
                initialValues={{ name: '', identifier: '' }}
                validationSchema={CreateTeamSchema}
                onSubmit={async values => {
                    await dispatch(createTeam({
                        name: values.name,
                        identifier: values.identifier,
                        token
                    }));
                }}
            >
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
                                text="You have already created the maximum allowed number of teams."
                                type="ERROR"
                            />
                        ) : (
                            <>
                                <View style={styles.headerRow}>
                                    <SubTitle>Create a Team</SubTitle>
                                    <Pressable
                                        onPress={backPress}
                                        style={styles.closeButton}>
                                        <Icon
                                            name="close"
                                            size={22}
                                            color={Colors.text}
                                        />
                                    </Pressable>
                                </View>

                                <View style={styles.infoRow}>
                                    <Icon
                                        name="information-circle-outline"
                                        size={16}
                                        color={Colors.muted}
                                    />
                                    <Caption color="muted">
                                        {user?.remaining_teams} team{user?.remaining_teams !== 1 ? 's' : ''} remaining
                                    </Caption>
                                </View>

                                <Body style={styles.label}>Team Name</Body>
                                <TextInput
                                    name="name"
                                    autoFocus={false}
                                    autoCorrect={false}
                                    autoCapitalize={'none'}
                                    autoCompleteType="off"
                                    textContentType="none"
                                    onChangeText={handleChange('name')}
                                    style={styles.input}
                                    onSubmitEditing={() => identifierRef.current.focus()}
                                    returnKeyType="next"
                                    placeholder="e.g. Beach Cleanup Crew"
                                    placeholderTextColor={Colors.muted}
                                />
                                {touched.name && errors.name && (
                                    <Caption color="error" style={styles.errorText}>
                                        {errors.name}
                                    </Caption>
                                )}

                                <Body style={styles.identifierLabel}>
                                    Unique Identifier
                                </Body>
                                <Caption color="muted" style={styles.identifierHint}>
                                    Share this with others so they can join your team.
                                </Caption>
                                <TextInput
                                    ref={identifierRef}
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
                                    placeholder="e.g. BeachCrew"
                                    placeholderTextColor={Colors.muted}
                                />
                                {touched.identifier &&
                                    errors.identifier && (
                                        <Caption color="error" style={styles.errorText}>
                                            {errors.identifier}
                                        </Caption>
                                    )}

                                {teamsFormError ? (
                                    <Caption color="error" style={styles.serverError}>
                                        {teamsFormError}
                                    </Caption>
                                ) : null}

                                <Button
                                    disabled={!isValid}
                                    loading={isSubmitting}
                                    onPress={handleSubmit}
                                    style={styles.submitButton}
                                >
                                    <Body color="white">Create Team</Body>
                                </Button>
                            </>
                        )}
                    </>
                )}
            </Formik>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f1f3',
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20
    },
    label: {
        marginBottom: 6
    },
    identifierLabel: {
        marginTop: 20,
        marginBottom: 2
    },
    identifierHint: {
        marginBottom: 6
    },
    input: {
        padding: 14,
        fontSize: 16,
        letterSpacing: 0.3,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        color: Colors.text,
        fontFamily: 'Poppins-Regular'
    },
    errorText: {
        marginTop: 6
    },
    serverError: {
        textAlign: 'center',
        marginTop: 12
    },
    submitButton: {
        marginTop: 20,
        marginBottom: 10
    }
});

export default CreateTeamForm;
