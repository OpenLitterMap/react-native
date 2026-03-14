import { StyleSheet, Pressable, View, TextInput } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Body, Button, Colors, Caption, SubTitle } from '../../components';
import { useDispatch, useSelector } from "react-redux";
import { joinTeam } from "../../../reducers/team_reducer";

const JoinTeamSchema = Yup.object().shape({
    id: Yup.string()
        .required('Enter identifier')
        .min(3, 'Minimum 3 characters long')
        .max(15, 'Maximum 15 characters long')
});

const JoinTeamForm = ({ backPress }) => {

    const dispatch = useDispatch();
    const {t} = useTranslation();

    const teamsFormError = useSelector(state => state.teams.teamsFormError);

    return (
        <View>
            <View style={styles.headerRow}>
                <SubTitle>{t('Join a Team')}</SubTitle>
                <Pressable onPress={backPress} style={styles.closeButton}>
                    <Icon name="close" size={22} color={Colors.text} />
                </Pressable>
            </View>

            <Caption color="muted" style={styles.description}>
                {t('Enter the team identifier shared by your team leader.')}
            </Caption>

            <Formik
                initialValues={{ id: '' }}
                validationSchema={JoinTeamSchema}
                onSubmit={async values => {
                    await dispatch(joinTeam({ identifier: values.id }));
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
                        <Body style={styles.label}>{t('Team Identifier')}</Body>
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
                            placeholder="e.g. CleanUpCrew"
                            placeholderTextColor={Colors.muted}
                        />
                        {touched.id && errors.id && (
                            <Caption color="error" style={styles.errorText}>
                                {errors.id}
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
                            <Body color="white">{t('Join Team')}</Body>
                        </Button>
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
    description: {
        marginBottom: 20
    },
    label: {
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

export default JoinTeamForm;
