import React, { Component, createRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableHighlight,
    Pressable,
    View,
    StyleSheet
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { getTranslation, TransText } from 'react-native-translation';
import { Icon as ElementIcon } from 'react-native-elements';
import { connect } from 'react-redux';
import {
    Header,
    SubTitle,
    Body,
    Caption,
    CustomTextInput
} from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SocialAccountsForm = () => {
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
                    <SubTitle color="white" style={{ textAlign: 'center' }}>
                        {this._getHeaderName()}
                    </SubTitle>
                }
                rightContent={
                    <Pressable onPress={() => this._saveSettings()}>
                        <Body
                            color="white"
                            dictionary={`${lang}.settings.save`}
                        />
                    </Pressable>
                }
            />
        </>
    );
};

const styles = StyleSheet.create({});

const mapStateToProps = state => {
    return {
        dataToEdit: state.settings.dataToEdit,
        lang: state.auth.lang,
        secondSettingsModalVisible: state.settings.secondSettingsModalVisible,
        settingsEditProp: state.settings.settingsEditProp,
        token: state.auth.token,
        updatingSettings: state.settings.updatingSettings,
        updateSettingsStatusMessage: state.settings.updateSettingsStatusMessage,
        user: state.auth.user
    };
};

export default connect(
    mapStateToProps,
    actions
)(SocialAccountsForm);
