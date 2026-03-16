import React, {useState, useEffect, useRef} from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useTranslation} from 'react-i18next';
import {
    Body,
    Colors,
    CustomTextInput,
    Header,
    SubTitle
} from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    closeSaveResultModal,
    deleteAccount,
    saveSettings,
    saveSocialAccounts,
    setDeleteAccountError,
    setEditValue,
    toggleEditModal
} from '../../../reducers/settings_reducer';

const SettingsComponent = () => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();

    const formikRef = useRef(null);
    const [password, setPassword] = useState('');

    useEffect(() => {
        // This will initialize the settings.editValue
        initEditValue();
    }, []);

    const editValue = useSelector(
        state => state.settings.editValue
    );
    const editField = useSelector(state => state.settings.editField);
    const user = useSelector(state => state.auth.user);

    const saveResultModalVisible = useSelector(
        state => state.settings.saveResultModalVisible
    );
    const saveResultMessage = useSelector(
        state => state.settings.saveResultMessage
    );
    const isSaving = useSelector(
        state => state.settings.saveStatus === 'loading'
    );
    const deleteAccountError = useSelector(
        state => state.settings.deleteAccountError
    );

    const getForm = formField => {
        if (!formField) return null;

        const key = ['name', 'username', 'email'];

        // get conditional validation schema
        const validationSchema = Yup.object().shape(
            getSchema(formField.key)
        );

        // form for name, username, email
        if (key.includes(formField.key)) {
            return (
                editValue && (
                    <Formik
                        initialValues={{[formField.key]: editValue}}
                        enableReinitialize={true}
                        innerRef={formikRef}
                        validationSchema={validationSchema}
                        onSubmit={values => {
                            dispatch(
                                saveSettings({
                                    dataKey: formField.key,
                                    dataValue: values[formField.key]
                                })
                            );
                        }}>
                        {({
                            handleChange,
                            handleBlur,
                            setFieldValue,
                            handleSubmit,
                            values,
                            errors,
                            touched
                        }) => (
                            <View style={styles.container}>
                                <Body dictionary={`${formField.title}`} />

                                <CustomTextInput
                                    style={styles.content}
                                    onChangeText={text => {
                                        setFieldValue(
                                            `${formField.key}`,
                                            text
                                        );
                                    }}
                                    value={values[`${formField.key}`]}
                                    name={`${formField.key}`}
                                    autoCapitalize="none"
                                    error={errors[`${formField.key}`]}
                                    touched={touched[`${formField.key}`]}
                                />
                            </View>
                        )}
                    </Formik>
                )
            );
        } else if (formField.key === 'social') {
            const formFields = [
                'social_twitter',
                'social_facebook',
                'social_instagram',
                'social_linkedin',
                'social_reddit',
                'social_personal'
            ];
            const placeholders = [
                'https://twitter.com/openlittermap',
                'https://facebook.com/openlittermap',
                'https://instagram.com/openlittermap',
                'https://linkedin.com/openlittermap',
                'https://reddit.com/r/openlittermap/',
                'https://openlittermap.com'
            ];
            return (
                <Formik
                    initialValues={{
                        social_twitter: editValue?.social_twitter,
                        social_facebook: editValue?.social_facebook,
                        social_instagram: editValue?.social_instagram,
                        social_linkedin: editValue?.social_linkedin,
                        social_reddit: editValue?.social_reddit,
                        social_personal: editValue?.social_personal
                    }}
                    enableReinitialize={true}
                    innerRef={formikRef}
                    validationSchema={validationSchema}
                    onSubmit={values => {
                        dispatch(
                            saveSocialAccounts({
                                values
                            })
                        );
                    }}>
                    {({setFieldValue, setFieldTouched, errors, touched}) => (
                        <ScrollView
                            alwaysBounceVertical={false}
                            showsVerticalScrollIndicator={false}
                            style={styles.container}>
                            {formFields.map((field, index) => (
                                <View key={field}>
                                    <Body>{field.toLocaleUpperCase()}</Body>
                                    <CustomTextInput
                                        style={styles.content}
                                        onEndEditing={() =>
                                            setFieldTouched(`${field}`, true)
                                        }
                                        onChangeText={text => {
                                            setFieldValue(`${field}`, text);
                                        }}
                                        value={
                                            editValue &&
                                            editValue[`${field}`]
                                        }
                                        name={`${field}`}
                                        autoCapitalize="none"
                                        error={errors[`${field}`]}
                                        touched={touched[`${field}`]}
                                        placeholder={`${placeholders[index]}`}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </Formik>
            );
        } else if (formField.key === 'delete-account') {
            return (
                <View style={[styles.deleteAccountContainer, {padding: SCREEN_WIDTH * 0.1}]}>
                    <Text style={[styles.deleteAccountTitle, {fontSize: SCREEN_HEIGHT * 0.045, marginBottom: SCREEN_HEIGHT * 0.025}]}>
                        {t('Are you sure you want to delete your account?')}
                    </Text>
                    <Text style={[styles.deleteAccountSubtitle, {fontSize: SCREEN_HEIGHT * 0.035, marginBottom: SCREEN_HEIGHT * 0.025}]}>
                        {t('All of your data will be deleted.')}
                    </Text>
                    <Text style={[styles.deleteAccountSubtitle, {fontSize: SCREEN_HEIGHT * 0.035, marginBottom: SCREEN_HEIGHT * 0.025}]}>
                        {t('This cannot be undone.')}
                    </Text>

                    <TextInput
                        placeholder={t('Please enter your password')}
                        placeholderTextColor="grey"
                        style={{
                            height: 40,
                            borderColor: 'gray',
                            borderWidth: 1,
                            paddingHorizontal: 8
                        }}
                        onChangeText={changeTextHandler}
                        value={password}
                        secureTextEntry={true}
                    />

                    <Pressable
                        style={[styles.deleteAccountButton, {height: SCREEN_HEIGHT * 0.05, width: SCREEN_WIDTH * 0.8}, isSaving && {opacity: 0.5}]}
                        onPress={submitDeleteAccount}
                        disabled={isSaving}>
                        <Text style={[styles.deleteButtonText, {fontSize: SCREEN_HEIGHT * 0.02}]}>
                            {isSaving ? t('Deleting...') : t('Delete Account')}
                        </Text>
                    </Pressable>

                    {deleteAccountError !== '' ? (
                        <View>
                            <Text style={styles.wrongPasswordText}>
                                {t(deleteAccountError)}
                            </Text>
                        </View>
                    ) : (
                        ''
                    )}
                </View>
            );
        }
    };

    const changeTextHandler = txt => {
        setPassword(txt);

        if (deleteAccountError !== '') {
            dispatch(setDeleteAccountError(''));
        }
    };

    /**
     * Fn to return Validation schema
     */
    const getSchema = key => {
        /**
         * Form field validation with keys for translation
         * using Yup for validation
         */
        const NameSchema = {
            name: Yup.string()
                .min(3, 'Name should be between 3-20 characters')
                .max(20, 'Name should be between 3-20 characters')
                .required('Please enter a name')
        };

        const UsernameSchema = {
            username: Yup.string()
                .min(3, 'Username should be between 3-20 characters')
                .max(20, 'Username should be between 3-20 characters')
                .required('Please enter a username')
        };

        const EmailSchema = {
            email: Yup.string()
                .email('This is not a valid email address')
                .required('Please enter an email address')
        };

        const SocialSchema = {
            social_twitter: Yup.string().url('Please enter a valid url'),
            social_facebook: Yup.string().url('Please enter a valid url'),
            social_instagram: Yup.string().url('Please enter a valid url'),
            social_linkedin: Yup.string().url('Please enter a valid url'),
            social_reddit: Yup.string().url('Please enter a valid url'),
            social_personal: Yup.string().url('Please enter a valid url')
        };

        switch (key) {
            case 'name':
                return NameSchema;
            case 'username':
                return UsernameSchema;
            case 'email':
                return EmailSchema;
            case 'social':
                return SocialSchema;
        }
    };

    /**
     * render modal messages based on vale of saveResultMessage
     * ERROR || SUCCESS
     */
    const renderStatusMessage = status => {
        const success = status === 'SUCCESS';
        const error = status === 'ERROR';

        const successTitle = t('Success!');
        const successMessage = t('Value updated');
        const errorTitle = t('Error!');
        const errorMessage = t('Value not updated');

        const goBackMessage = t('Go Back');

        if (success || error) {
            return (
                <View style={[styles.innerModalSuccess, {width: SCREEN_WIDTH * 0.8}]}>
                    <Text style={styles.innerModalHeader}>
                        {success ? successTitle : errorTitle}
                    </Text>

                    <Text>{success ? successMessage : errorMessage}</Text>

                    <Pressable
                        style={[styles.successButton, {height: SCREEN_HEIGHT * 0.05}]}
                        onPress={goBack}>
                        <Text style={styles.buttonText}>{goBackMessage}</Text>
                    </Pressable>
                </View>
            );
        }
        return <></>;
    };

    const closeModal = () => {
        dispatch(toggleEditModal());
    };

    /**
     * Header title
     *
     * eg Edit Name
     */
    const getHeaderName = () => {
        if (!editField) {
            return '';
        }
        const text = t(`${editField.title}`);

        if (editField.key === 'delete-account') {
            return t('Warning');
        }

        const edit = t('Edit');

        return edit + ' ' + text;
    };

    const handleSaveSettings = () => {
        if (formikRef.current) {
            formikRef.current.handleSubmit();
        }
    };

    const goBack = () => {
        dispatch(closeSaveResultModal());
    };

    /**
     * Initialize Settings Value to edit / update
     */
    const initEditValue = () => {
        const key = editField?.key;
        if (!key || !user) {
            return;
        }

        switch (key) {
            case 'name':
                return dispatch(setEditValue(user.name));
            case 'username':
                return dispatch(setEditValue(user.username));
            case 'email':
                return dispatch(setEditValue(user.email));
            case 'social':
                return dispatch(setEditValue(user.settings));
        }
    };

    /**
     * Send a request to delete the account and all associated data
     */
    const submitDeleteAccount = async () => {
        const result = await dispatch(deleteAccount({password}));
        if (result.meta?.requestStatus === 'rejected') {
            setPassword('');
        }
    };

    return (
        <>
            <Header
                leftContent={
                    <Pressable onPress={closeModal}>
                        <Icon name="close-outline" size={32} color="white" />
                    </Pressable>
                }
                centerContent={
                    <SubTitle
                        color="white"
                        style={{
                            textAlign: 'center'
                        }}>
                        {getHeaderName()}
                    </SubTitle>
                }
                rightContent={
                    editField?.key !== 'delete-account' ? (
                        <Pressable onPress={handleSaveSettings}>
                            <Body color="white" dictionary={'Save'} />
                        </Pressable>
                    ) : (
                        ''
                    )
                }
            />

            {getForm(editField)}

            <Modal
                animationType="slide"
                transparent={true}
                visible={saveResultModalVisible}
                onRequestClose={goBack}>
                <View style={styles.modalContainer}>
                    {renderStatusMessage(saveResultMessage)}
                    {isSaving && saveResultMessage === '' && (
                        <ActivityIndicator />
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    buttonText: {
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: '#f7f7f7'
    },
    content: {
        marginTop: 10,
        paddingLeft: 10,
        height: 48,
        maxHeight: 48
    },
    deleteAccountButton: {
        marginTop: 20,
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    deleteButtonText: {
        color: 'white'
    },
    deleteAccountContainer: {},
    deleteAccountTitle: {},
    deleteAccountSubtitle: {},
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    innerModalSuccess: {
        paddingVertical: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    innerModalHeader: {
        textAlign: 'center',
        fontSize: 28,
        marginBottom: 10
    },
    successButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#2189dc',
        marginTop: 20,
        width: '80%'
    },
    wrongPasswordText: {
        marginTop: 20,
        color: Colors.error
    }
});

export default SettingsComponent;
