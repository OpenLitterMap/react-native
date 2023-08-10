import React, {Component, createRef} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    View
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {getTranslation, TransText} from 'react-native-translation';
// import {Icon as ElementIcon} from '@rneui/base';
import {connect} from 'react-redux';
import {
    Body,
    Colors,
    CustomTextInput,
    Header,
    SubTitle
} from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class SettingsComponent extends Component {
    constructor(props) {
        super(props);
        this._getTextInputValue();
        this.formikRef = createRef();
        this.state = {
            password: ''
        };
    }

    render() {
        const {lang, dataToEdit} = this.props;

        return (
            <>
                <Header
                    leftContent={
                        <Pressable onPress={() => this._closeModal()}>
                            <Icon
                                name="ios-close-outline"
                                size={32}
                                color="white"
                            />
                        </Pressable>
                    }
                    centerContent={
                        <SubTitle
                            color="white"
                            style={{
                                textAlign: 'center'
                            }}>
                            {this._getHeaderName()}
                        </SubTitle>
                    }
                    rightContent={
                        dataToEdit.key !== 'delete-account' ? (
                            <Pressable onPress={() => this._saveSettings()}>
                                <Body
                                    color="white"
                                    dictionary={`${lang}.settings.save`}
                                />
                            </Pressable>
                        ) : (
                            ''
                        )
                    }
                />

                {this.getForm(dataToEdit, lang)}

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.props.secondSettingsModalVisible}>
                    <View style={styles.modalContainer}>
                        {this.renderStatusMessage(
                            this.props.updateSettingsStatusMessage,
                            lang
                        )}
                        {this.props.updatingSettings &&
                            this.props.updateSettingsStatusMessage === '' && (
                                <ActivityIndicator />
                            )}
                    </View>
                </Modal>
            </>
        );
    }

    getForm = (dataToEdit, lang) => {
        const key = ['name', 'username', 'email'];

        // get conditional validation schema
        const validationSchema = Yup.object().shape(
            this.getSchema(dataToEdit.key)
        );
        // form for name, username, email
        if (key.includes(dataToEdit.key)) {
            return (
                <Formik
                    initialValues={{
                        [dataToEdit.key]: this.props.settingsEditProp
                    }}
                    innerRef={this.formikRef}
                    validationSchema={validationSchema}
                    onSubmit={values => {
                        this.props.saveSettings(
                            this.props.dataToEdit,
                            this.props.settingsEditProp,
                            this.props.token
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
                            <Body
                                dictionary={`${lang}.${this.props.dataToEdit.title}`}
                            />

                            <CustomTextInput
                                style={styles.content}
                                // ref={this.usernameRef}
                                onChangeText={text => {
                                    setFieldValue(`${dataToEdit.key}`, text);
                                    this.props.updateSettingsProp({text});
                                }}
                                value={this.props.settingsEditProp}
                                name={`${dataToEdit.key}`}
                                autoCapitalize="none"
                                error={
                                    errors[`${dataToEdit.key}`] &&
                                    `${this.props.lang}.auth.${
                                        errors[`${dataToEdit.key}`]
                                    }`
                                }
                                touched={touched[`${dataToEdit.key}`]}
                            />
                        </View>
                    )}
                </Formik>
            );
        } else if (dataToEdit.key === 'social') {
            const formFields = [
                'twitter',
                'facebook',
                'instagram',
                'linkedin',
                'reddit',
                'personal'
            ];
            const placeholders = [
                'https://twitter.com/olm',
                'https://www.facebook.com/olm',
                'https://www.instagram.com/olm',
                'https://www.linkedin.com/olm',
                'https://www.reddit.com/user/olm/',
                'https://www.openlittermap.com'
            ];
            return (
                <Formik
                    initialValues={{
                        twitter: this.props.settingsEditProp?.social_twitter,
                        facebook: this.props.settingsEditProp?.social_facebook,
                        instagram:
                            this.props.settingsEditProp?.social_instagram,
                        linkedin: this.props.settingsEditProp?.social_linkedin,
                        reddit: this.props.settingsEditProp?.social_reddit,
                        personal: this.props.settingsEditProp?.social_personal
                    }}
                    innerRef={this.formikRef}
                    validationSchema={validationSchema}
                    onSubmit={values => {
                        this.props.saveSocialAccounts(
                            this.props.dataToEdit,
                            this.props.settingsEditProp,
                            this.props.token
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

                                            this.props.updateSettingsProp(
                                                {
                                                    ...this.props
                                                        .settingsEditProp,
                                                    [`social_${field}`]: text
                                                },
                                                'social'
                                            );
                                        }}
                                        value={
                                            this.props.settingsEditProp &&
                                            this.props.settingsEditProp[
                                                `social_${field}`
                                            ]
                                        }
                                        name={`${field}`}
                                        autoCapitalize="none"
                                        error={
                                            errors[`${field}`] &&
                                            `${this.props.lang}.settings.${
                                                errors[`${field}`]
                                            }`
                                        }
                                        touched={touched[`${field}`]}
                                        placeholder={`${placeholders[index]}`}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </Formik>
            );
        } else if (dataToEdit.key === 'delete-account') {
            return (
                <View style={styles.deleteAccountContainer}>
                    <Text style={styles.deleteAccountTitle}>
                        Are you sure you want to delete your account?
                    </Text>
                    <Text style={styles.deleteAccountSubtitle}>
                        All of your data will be deleted.
                    </Text>
                    <Text style={styles.deleteAccountSubtitle}>
                        This cannot be undone.
                    </Text>

                    <TextInput
                        placeholder="Please enter your password"
                        placeholderTextColor="grey"
                        style={{
                            height: 40,
                            borderColor: 'gray',
                            borderWidth: 1,
                            paddingHorizontal: 8
                        }}
                        onChangeText={this.changeTextHandler}
                        value={this.state.password}
                        secureTextEntry={true}
                    />

                    <Pressable
                        style={styles.deleteAccountButton}
                        onPress={this.submitDeleteAccount}>
                        <Text style={styles.deleteButtonText}>
                            Delete account
                        </Text>
                    </Pressable>

                    {this.props.deleteAccountError !== '' ? (
                        <View>
                            <TransText
                                style={styles.wrongPasswordText}
                                dictionary={`${lang}.${this.props.deleteAccountError}`}
                            />
                        </View>
                    ) : (
                        ''
                    )}
                </View>
            );
        }
    };

    changeTextHandler = txt => {
        this.setState({
            password: txt
        });

        if (this.props.deleteAccountError !== '') {
            this.props.setDeleteAccountError('');
        }
    };

    /**
     * Fn to return Validation schema
     */
    getSchema = key => {
        /**
         * Form field validation with keys for translation
         * using Yup for validation
         */
        const NameSchema = {
            name: Yup.string()
                .min(3, 'name-min-max')
                .max(20, 'name-min-max')
                .required('enter-name')
        };

        const UsernameSchema = {
            username: Yup.string()
                .min(3, 'username-min-max')
                .max(20, 'username-min-max')
                .required('enter-username')
        };

        const EmailSchema = {
            email: Yup.string().email('email-not-valid').required('enter-email')
        };

        const SocialSchema = {
            twitter: Yup.string().url('url-not-valid'),
            facebook: Yup.string().url('url-not-valid'),
            instagram: Yup.string().url('url-not-valid'),
            linkedin: Yup.string().url('url-not-valid'),
            reddit: Yup.string().url('url-not-valid'),
            personal: Yup.string().url('url-not-valid')
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
     * render modal messages based on vale of updateSettingsStatusMessage
     * ERROR || SUCCESS
     */

    renderStatusMessage(status, lang) {
        let success = status === 'SUCCESS';
        let error = status === 'ERROR';
        if (success || error) {
            return (
                <View style={styles.innerModalSuccess}>
                    {/*<ElementIcon*/}
                    {/*    reverse*/}
                    {/*    name={success ? 'done' : 'close'}*/}
                    {/*    color={success ? '#2ecc71' : '#E25B69'}*/}
                    {/*    size={40}*/}
                    {/*    containerStyle={styles.iconContainer}*/}
                    {/*/>*/}
                    <TransText
                        style={styles.innerModalHeader}
                        dictionary={
                            success
                                ? `${lang}.settings.success`
                                : `${lang}.settings.error`
                        }
                    />
                    <TransText
                        dictionary={
                            success
                                ? `${lang}.settings.value-updated`
                                : `${lang}.settings.value-not-updated`
                        }
                    />
                    <TouchableHighlight
                        style={styles.successButton}
                        activeOpacity={0.9}
                        underlayColor="#00aced"
                        onPress={() => this._goBack()}>
                        <TransText
                            style={styles.buttonText}
                            dictionary={`${lang}.settings.go-back`}
                        />
                    </TouchableHighlight>
                </View>
            );
        }
        return <></>;
    }

    /**
     * Custom Functions
     */
    _closeModal() {
        this.props.toggleSettingsModal();
    }

    /**
     * Header title
     *
     * eg Edit Name
     */
    _getHeaderName() {
        const text = getTranslation(
            `${this.props.lang}.${this.props.dataToEdit.title}`
        );

        if (this.props.dataToEdit.key === 'delete-account') {
            return getTranslation(`${this.props.lang}.settings.warning`);
        }

        const edit = getTranslation(`${this.props.lang}.settings.edit`);

        return edit + ' ' + text;
    }

    /**
     * Save the settings within a component
     *
     * settings_actions.js
     */
    _saveSettings() {
        if (this.formikRef.current) {
            this.formikRef.current.handleSubmit();
        }
    }

    _goBack() {
        this.props.closeSecondSettingModal();

        // Parent modal only closes with timeout
        setTimeout(() => {
            this.props.toggleSettingsModal();
        }, 500);
    }

    /**
     * Initialize Settings Value to edit / update
     */
    _getTextInputValue() {
        const key = this.props.dataToEdit.key;

        switch (key) {
            case 'name':
                return this.props.initalizeSettingsValue(this.props.user.name);
            case 'username':
                return this.props.initalizeSettingsValue(
                    this.props.user.username
                );
            case 'email':
                return this.props.initalizeSettingsValue(this.props.user.email);
            case 'social':
                return this.props.initalizeSettingsValue(
                    this.props.user.settings
                );
        }
    }

    /**
     * Send a request to delete the account and all associated data
     */
    submitDeleteAccount = () => {
        this.props.deleteAccount(this.state.password, this.props.token);
    };
}

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
        height: SCREEN_HEIGHT * 0.05,
        width: SCREEN_WIDTH * 0.8,
        marginTop: 20,
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    deleteButtonText: {
        color: 'white',
        fontSize: SCREEN_HEIGHT * 0.02
    },
    deleteAccountContainer: {
        padding: SCREEN_WIDTH * 0.1
    },
    deleteAccountTitle: {
        fontSize: SCREEN_HEIGHT * 0.045,
        marginBottom: SCREEN_HEIGHT * 0.025
    },
    deleteAccountSubtitle: {
        fontSize: SCREEN_HEIGHT * 0.035,
        marginBottom: SCREEN_HEIGHT * 0.025
    },
    row: {
        alignItems: 'center',
        // flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'white',
        height: SCREEN_HEIGHT * 0.06
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    innerModalSuccess: {
        // height: SCREEN_HEIGHT * 0.2,
        paddingVertical: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        width: SCREEN_WIDTH * 0.8
    },
    innerModalHeader: {
        textAlign: 'center',
        fontSize: 28,
        marginBottom: 10
    },
    iconContainer: {
        marginTop: -70
    },
    successButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#2189dc',
        // backgroundColor: '#2ecc71',
        height: SCREEN_HEIGHT * 0.05,
        marginTop: 20,
        width: '80%'
    },
    title: {
        paddingLeft: 10,
        fontSize: SCREEN_HEIGHT * 0.02,
        width: SCREEN_WIDTH * 0.25
    },
    wrongPasswordText: {
        marginTop: 20,
        color: Colors.error
    }
});

const mapStateToProps = state => {
    return {
        dataToEdit: state.settings.dataToEdit,
        lang: state.auth.lang,
        secondSettingsModalVisible: state.settings.secondSettingsModalVisible,
        settingsEditProp: state.settings.settingsEditProp,
        token: state.auth.token,
        updatingSettings: state.settings.updatingSettings,
        updateSettingsStatusMessage: state.settings.updateSettingsStatusMessage,
        user: state.auth.user,
        deleteAccountError: state.settings.deleteAccountError
    };
};

export default connect(mapStateToProps, actions)(SettingsComponent);
