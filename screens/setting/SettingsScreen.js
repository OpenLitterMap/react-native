import React, { Component, createRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    SectionList,
    Switch,
    View,
    Pressable,
    StyleSheet
} from 'react-native';
import { getTranslation, TransText } from 'react-native-translation';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import { Body, SubTitle, Title, Header, Colors, Caption } from '../components';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import SettingsComponent from './settingComponents/SettingsComponent';

class SettingsScreen extends Component {
    constructor(props) {
        super(props);

        this.actionSheetRef = createRef();
    }

    render() {
        const lang = this.props.lang;

        return (
            <View style={{ flex: 1 }}>
                <Header
                    leftContent={
                        <Pressable
                            onPress={() => this.props.navigation.goBack()}>
                            <Icon
                                name="ios-chevron-back-outline"
                                color={Colors.white}
                                size={24}
                            />
                        </Pressable>
                    }
                    centerContent={
                        <Title
                            color="white"
                            dictionary={`${lang}.settings.settings`}
                        />
                    }
                    centerContainerStyle={{ flex: 2 }}
                    rightContent={
                        <Pressable onPress={() => this.props.logout()}>
                            <Body
                                color="white"
                                dictionary={`${lang}.settings.logout`}
                            />
                        </Pressable>
                    }
                />
                <View style={{ flex: 1 }}>
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={this.props.settingsModalVisible}>
                        {this.props.wait && (
                            <View style={styles.waitModal}>
                                <ActivityIndicator />
                            </View>
                        )}
                        {this.props.settingsEdit && (
                            <View style={styles.modal}>
                                <SettingsComponent />
                            </View>
                        )}
                    </Modal>

                    <View style={styles.container}>
                        <SectionList
                            stickySectionHeadersEnabled={false}
                            renderSectionHeader={({ section: { title } }) => (
                                <SubTitle
                                    color="muted"
                                    style={styles.sectionHeaderTitle}
                                    dictionary={`${lang}.${title}`}
                                />
                            )}
                            sections={[
                                {
                                    title: 'settings.my-account',
                                    data: [
                                        {
                                            id: 1,
                                            key: 'name',
                                            title: 'settings.name'
                                        },
                                        {
                                            id: 2,
                                            key: 'username',
                                            title: 'settings.username'
                                        },
                                        {
                                            id: 3,
                                            key: 'email',
                                            title: 'settings.email'
                                        },
                                        {
                                            id: 4,
                                            key: 'social',
                                            title: 'settings.social'
                                        }
                                    ]
                                },
                                {
                                    title: 'settings.privacy',
                                    data: [
                                        {
                                            id: 4,
                                            key: 'name-maps',
                                            title: 'settings.show-name-maps'
                                        },
                                        {
                                            id: 5,
                                            key: 'username-maps',
                                            title: 'settings.show-username-maps'
                                        },
                                        {
                                            id: 6,
                                            key: 'name-leaderboard',
                                            title:
                                                'settings.show-name-leaderboards'
                                        },
                                        {
                                            id: 7,
                                            key: 'username-leaderboard',
                                            title:
                                                'settings.show-username-leaderboards'
                                        },
                                        {
                                            id: 8,
                                            key: 'name-createdby',
                                            title:
                                                'settings.show-name-createdby'
                                        },
                                        {
                                            id: 9,
                                            key: 'username-createdby',
                                            title:
                                                'settings.show-username-createdby'
                                        }
                                    ]
                                },
                                {
                                    title: 'settings.picked-up',
                                    data: [
                                        {
                                            id: 11,
                                            key: 'picked-up',
                                            title: 'settings.litter-picked-up'
                                        }
                                    ]
                                }
                                // Temp commented out. This feature will be fixed in a future release.
                                // {
                                //     title: 'settings.tags',
                                //     data: [
                                //         {
                                //             id: 10,
                                //             title: 'settings.show-previous-tags'
                                //         }
                                //     ]
                                // }
                            ]}
                            renderItem={({ item, index, section }) => (
                                <View style={styles.sectionRow} key={index}>
                                    {this._renderRow(item)}
                                </View>
                            )}
                            keyExtractor={(item, index) => item + index}
                        />
                    </View>
                </View>
                <ActionSheet
                    closeOnTouchBackdrop={false}
                    ref={this.actionSheetRef}>
                    <View
                        style={{
                            height: 300,
                            padding: 40,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            alignItems: 'center',
                            backgroundColor: 'white',
                            justifyContent: 'center'
                        }}>
                        <Body style={{ textAlign: 'center' }}>
                            Do you want to change picked up status of all the
                            images ?
                        </Body>
                        <View
                            style={{
                                marginTop: 20,
                                marginBottom: 40,
                                width: SCREEN_WIDTH - 40
                            }}>
                            <Pressable
                                onPress={() => {
                                    this.props.changeLitterStatus(
                                        this.props?.user?.picked_up
                                    );

                                    this.actionSheetRef.current?.hide();
                                }}
                                style={[
                                    styles.actionButtonStyle,
                                    {
                                        backgroundColor: Colors.accent,
                                        marginVertical: 20
                                    }
                                ]}>
                                <Body color="white">Yes, Change</Body>
                            </Pressable>
                            <Pressable
                                onPress={this.actionSheetRef.current?.hide}
                                style={[styles.actionButtonStyle]}>
                                <Body color="accent">No, Don't Change</Body>
                            </Pressable>
                        </View>
                    </View>
                </ActionSheet>

                {/* <SafeAreaView style={{ flex: 0, backgroundColor: '#f7f7f7' }} /> */}
            </View>
        );
    }

    /**
     * fn to render setting rows
     * if item.key is "name", "username", "email"
     * show values else show toggle switch
     */
    _renderRow(item) {
        const dataKeys = ['name', 'username', 'email', 'social'];

        if (dataKeys.includes(item?.key)) {
            return (
                <Pressable
                    style={{ flex: 1, padding: 10 }}
                    onPress={() =>
                        this._rowPressed(item.id, item.title, item.key)
                    }>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }}>
                        <Body dictionary={`${this.props.lang}.${item.title}`} />
                        {/* dont show any data if key is social
                            we dont have any particular data to show now
                        */}
                        {item?.key !== 'social' && (
                            <Body>{this._getRowData(item.id, item?.key)}</Body>
                        )}
                    </View>
                </Pressable>
            );
        } else {
            return (
                <View style={styles.switchRow}>
                    <Body dictionary={`${this.props.lang}.${item.title}`} />

                    {this._getRowData(item.id, item.key)}
                </View>
            );
        }
    }

    /**
     * Return the value for each row
     */
    _getRowData(id, key) {
        switch (key) {
            case 'name':
                return this.props?.user?.name;
            case 'username':
                return this.props?.user?.username;
            case 'email':
                return this.props?.user?.email;
            default:
                return (
                    <Switch
                        onValueChange={() => this._toggleSwitch(id)}
                        value={
                            this._getSwitchValue(id, key) === 0 ? false : true
                        }
                    />
                );
        }
    }

    /**
     * Toggle the Switch - Send post request to database
     */
    _toggleSwitch(id) {
        const lang = this.props.lang;

        const alert = getTranslation(`${lang}.settings.alert`);
        const info = getTranslation(
            `${lang}.settings.do-you-really-want-to-change`
        );
        const ok = getTranslation(`${lang}.settings.ok`);
        const cancel = getTranslation(`${lang}.settings.cancel`);

        Alert.alert(
            alert,
            info,
            [
                {
                    text: ok,
                    onPress: async () => {
                        if (id === 11) {
                            // Toggle picked_up value
                            // sending opposite of current value to api
                            await this.props.saveSettings(
                                { id: 11, key: 'picked_up' },
                                !this.props?.user?.picked_up,
                                this.props.token
                            );
                            this.actionSheetRef.current?.setModalVisible();
                            // this.props.changeLitterStatus(
                            //     this.props?.user?.picked_up
                            // );
                        } else {
                            this.props.toggleSettingsSwitch(
                                id,
                                this.props.token
                            );
                        }
                    }
                },
                { text: cancel, onPress: () => console.log('cancel pressed') }
            ],
            { cancelable: true }
        );
    }

    /**
     * A Row was pressed - open onTextChange
     */
    _rowPressed(id, title, key = '') {
        this.props.toggleSettingsModal(id, title, key);
    }

    /**
     * Get the 0 or 1 value for a Switch
     *
     * INFO: show_name , show_username and picked_up have boolean values
     * rest have 0 & 1
     */
    _getSwitchValue(id, key) {
        switch (key) {
            case 'name-maps':
                return this.props?.user?.show_name_maps;
            case 'username-maps':
                return this.props?.user?.show_username_maps;
            case 'name-leaderboard':
                return this.props?.user?.show_name === false ? 0 : 1;
            case 'username-leaderboard':
                return this.props?.user?.show_username === false ? 0 : 1;
            case 'name-createdby':
                return this.props?.user?.show_name_createdby;
            case 'username-createdby':
                return this.props?.user?.show_username_createdby;
            // case 10:
            //     return this.props?.user?.previous_tag;
            //     break;
            case 'settings.picked-up':
                return this.props?.user?.picked_up === false ? 0 : 1;
            default:
                break;
        }
    }
}

const styles = StyleSheet.create({
    bottomImageContainer: {
        backgroundColor: '#ccc',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7'
    },
    image: {
        height: 50,
        width: 50,
        borderRadius: 6
    },
    imageContainer: {
        backgroundColor: 'blue',
        width: SCREEN_WIDTH * 0.3,
        height: SCREEN_HEIGHT * 0.1,
        alignItems: 'center',
        padding: 10
    },
    logoutContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row'
    },
    modal: {
        backgroundColor: 'rgba(255,255,255,1)',
        flex: 1
    },
    // row: {
    //   backgroundColor: '#ccc',
    //   flexDirection: 'row',
    //   padding: 10
    // },
    sectionRow: {
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 2,
        flexDirection: 'row',
        height: SCREEN_HEIGHT * 0.06
    },
    text: {
        height: 30,
        borderColor: 'gray',
        borderWidth: 1,
        flex: 1
    },
    sectionHeaderTitle: {
        paddingLeft: 10,
        paddingTop: 20,
        paddingBottom: 5,
        textTransform: 'uppercase'
    },
    switchRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SCREEN_HEIGHT * 0.01,
        justifyContent: 'space-between'
    },
    waitModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    actionButtonStyle: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        settingsModalVisible: state.settings.settingsModalVisible,
        token: state.auth.token,
        user: state.auth.user,
        wait: state.settings.wait,
        settingsEdit: state.settings.settingsEdit
    };
};

export default connect(
    mapStateToProps,
    actions
)(SettingsScreen);
