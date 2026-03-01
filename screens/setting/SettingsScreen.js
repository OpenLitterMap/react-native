import React, { createRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Pressable, SectionList, StyleSheet, Switch, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionSheet from 'react-native-actions-sheet';
import { useTranslation } from "react-i18next";
// import CountryPicker, {Flag} from 'react-native-country-picker-modal';
import { Body, Caption, Colors, Header, SubTitle, Title } from '../components';
import SettingsComponent from './settingComponents/SettingsComponent';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../reducers/auth_reducer";
import { saveSettings, toggleSettingsModal, toggleSettingsSwitch } from "../../reducers/settings_reducer";
import { changeLitterStatus, getUntaggedImages } from "../../reducers/images_reducer";
import { fetchAllTags } from "../../reducers/tags_reducer";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SettingsScreen = ({ navigation }) => {

    const dispatch = useDispatch();
    const actionSheetRef = createRef();
    const { t } = useTranslation();

    const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
    const [isFlagVisible, setIsFlagVisible] = useState(false);

    const user = useSelector(state => state.auth.user);
    const token = useSelector(state => state.auth.token);
    const settingsModalVisible = useSelector(state => state.settings.settingsModalVisible);
    const wait = useSelector(state => state.settings.wait);
    const settingsEdit = useSelector(state => state.settings.settingsEdit);

    const countryCode = user?.global_flag && user?.global_flag?.toUpperCase();

    /**
     * fn to render setting rows
     * if item.key is "name", "username", "email"
     * show values else show toggle switch
     */
    const renderRow = (item) => {
        // Special row: refresh tags
        if (item?.key === 'refresh-tags') {
            return (
                <Pressable
                    style={{flex: 1, padding: 10}}
                    onPress={() => {
                        dispatch(fetchAllTags({ token, forceRefresh: true }));
                        Alert.alert('Tags Refreshed', 'Tag data has been updated.');
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Body>Refresh Tags</Body>
                        <Icon name="refresh-outline" color={Colors.accent} size={24} />
                    </View>
                </Pressable>
            );
        }

        const dataKeys = [
            'name',
            'username',
            'email',
            'social',
            'delete-account'
        ];

        if (dataKeys.includes(item?.key)) {
            return (
                <Pressable
                    style={{flex: 1, padding: 10}}
                    onPress={() => rowPressed(item.id, item.title, item.key)}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Body dictionary={`${item.title}`} />

                        {/* dont show any data if key is social; we dont have any particular data to show now */}
                        {item?.key !== 'social' && (
                            <Body>{getRowData(item.id, item?.key)}</Body>
                        )}
                    </View>
                </Pressable>
            );
        } else if (item?.key === 'country') {
            return (
                <View style={{padding: 10, flex: 1}}>
                    {/*<CountryPicker*/}
                    {/*    {...{*/}
                    {/*        containerButtonStyle: {*/}
                    {/*            height: 60,*/}
                    {/*            justifyContent: 'center',*/}
                    {/*            padding: 10*/}
                    {/*        },*/}
                    {/*        countryCode: countryCode,*/}
                    {/*        withCountryNameButton: true,*/}
                    {/*        onSelect: async country => {*/}
                    {/*            setState({countryCode: country.cca2});*/}
                    {/*            toggleSwitch(5, 'global_flag');*/}
                    {/*        },*/}
                    {/*        withAlphaFilter: true*/}
                    {/*    }}*/}
                    {/*    visible={isCountryPickerVisible}*/}
                    {/*    onClose={() =>*/}
                    {/*        setState({isCountryPickerVisible: false})*/}
                    {/*    }*/}
                    {/*    // onSelect={country => console.log(country)}*/}
                    {/*    renderFlagButton={() => {*/}
                    {/*        return (*/}
                    {/*            <Pressable*/}
                    {/*                style={{*/}
                    {/*                    flexDirection: 'row',*/}
                    {/*                    justifyContent: 'space-between',*/}
                    {/*                    alignItems: 'center'*/}
                    {/*                }}*/}
                    {/*                onPress={() =>*/}
                    {/*                    setState({*/}
                    {/*                        isCountryPickerVisible: true*/}
                    {/*                    })*/}
                    {/*                }>*/}
                    {/*                <Body>Select Country</Body>*/}
                    {/*                {countryCode && (*/}
                    {/*                    <Flag*/}
                    {/*                        flagSize={24}*/}
                    {/*                        countryCode={countryCode}*/}
                    {/*                    />*/}
                    {/*                )}*/}
                    {/*            </Pressable>*/}
                    {/*        );*/}
                    {/*    }}*/}
                    {/*/>*/}
                </View>
            );
        } else {
            return (
                <View style={styles.switchRow}>
                    <Body dictionary={`${item.title}`} />

                    {getRowData(item.id, item.key)}
                </View>
            );
        }
    }

    /**
     * Return the value for each row
     */
    const getRowData = (id, key) => {
        switch (key) {
            case 'name':
                return user?.name;
            case 'username':
                return user?.username;
            case 'email':
                return user?.email;
            case 'delete-account':
                return (
                    <Icon
                        name="chevron-forward-outline"
                        color={Colors.muted}
                        size={24}
                    />
                );
            default:
                return (
                    <Switch
                        onValueChange={() => toggleSwitch(id, key)}
                        value={getSwitchValue(key) !== 0}
                    />
                );
        }
    }

    /**
     * Toggle the Switch - Send post request to database
     */
    const toggleSwitch = (id, key) => {
        let title = '';
        let subtitle = '';

        const ok = t('OK');
        const cancel = t('Cancel');

        // Needs translation
        if (key === 'enable_admin_tagging') {
            title = user?.enable_admin_tagging
                ? 'Turn off'
                : 'Turn on';

            subtitle += user?.enable_admin_tagging
                ? ' \n' + 'Only you will be able to tag your uploads'
                : ' \n' + 'Our volunteers will tag your uploads';
        } else {
            title = 'Change setting?';
        }

        Alert.alert(
            title,
            subtitle,
            [
                {
                    text: ok,
                    onPress: async () => {

                        if (key === 'picked-up') {

                            // Toggle picked_up value
                            await dispatch(saveSettings({
                                dataKey: 'picked_up',
                                dataValue: !user?.picked_up,
                                token
                            }));

                            actionSheetRef.current?.setModalVisible();
                        }
                        else if (key === 'global_flag')
                        {
                            await dispatch(saveSettings({
                                dataKey: 'global_flag',
                                dataValue: countryCode.toLowerCase(),
                                token
                            }));
                        }
                        else if (key === 'enable_admin_tagging')
                        {
                            if (user?.enable_admin_tagging) {
                                await dispatch(getUntaggedImages({token}));
                            }

                            await dispatch(saveSettings({
                                dataKey: 'enable_admin_tagging',
                                dataValue: !user?.enable_admin_tagging,
                                token
                            }));
                        }
                        else
                        {
                            // Privacy Settings
                            await dispatch(toggleSettingsSwitch({ id, token }));
                        }
                    }
                },
                {
                    text: cancel,
                    onPress: () => {}
                }
            ],
            {
                cancelable: true
            }
        );
    }

    /**
     * A Row was pressed
     *
     * Open modal to show settings options
     */
    const rowPressed = (id, title, key = '') => {
        dispatch(toggleSettingsModal({ id, title, key }));
    }

    /**
     * Get the 0 or 1 value for a Switch
     *
     * INFO: show_name, show_username, picked_up and enable_admin_tagging have boolean values
     * We need to cast these to integers
     *
     * rest have 0 & 1
     */
    const getSwitchValue = (key) => {
        switch (key) {
            case 'name-maps':
                return user?.show_name_maps;
            case 'username-maps':
                return user?.show_username_maps;
            case 'name-leaderboard':
                return user?.show_name === false ? 0 : 1;
            case 'username-leaderboard':
                return user?.show_username === false ? 0 : 1;
            case 'name-createdby':
                return user?.show_name_createdby;
            case 'username-createdby':
                return user?.show_username_createdby;
            // case 10:
            //     return user?.previous_tag;
            //     break;
            case 'picked-up':
                return user?.picked_up === false ? 0 : 1;
            case 'enable_admin_tagging':
                return Number(user?.enable_admin_tagging);
            default:
                break;
        }
    }

    return (
        <View style={{flex: 1}}>
            <Header
                leftContent={
                    <Pressable onPress={() => navigation.goBack()}>
                        <Icon
                            name="chevron-back-outline"
                            color={Colors.white}
                            size={24}
                        />
                    </Pressable>
                }
                centerContent={
                    <Title
                        color="white"
                        dictionary={'Settings'}
                    />
                }
                centerContainerStyle={{flex: 2}}
                rightContent={
                    <Pressable onPress={() => dispatch(logout())}>
                        <Body
                            color="white"
                            dictionary={'Logout'}
                        />
                    </Pressable>
                }
            />
            <View style={{flex: 1}}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={settingsModalVisible}
                >
                    {wait && (
                        <View style={styles.waitModal}>
                            <ActivityIndicator />
                        </View>
                    )}
                    {settingsEdit && (
                        <View style={styles.modal}>
                            <SettingsComponent />
                        </View>
                    )}
                </Modal>

                <View style={styles.container}>
                    <SectionList
                        alwaysBounceVertical={false}
                        stickySectionHeadersEnabled={false}
                        renderSectionHeader={({section: {title}}) => (
                            <SubTitle
                                color="muted"
                                style={styles.sectionHeaderTitle}
                                dictionary={`${title}`}
                            />
                        )}
                        sections={[
                            {
                                title: 'MY ACCOUNT',
                                data: [
                                    {
                                        id: 1,
                                        key: 'name',
                                        title: 'Name'
                                    },
                                    {
                                        id: 2,
                                        key: 'username',
                                        title: 'Username'
                                    },
                                    {
                                        id: 3,
                                        key: 'email',
                                        title: 'Email'
                                    },
                                    {
                                        id: 4,
                                        key: 'social',
                                        title: 'Social Accounts'
                                    }
                                ]
                            },
                            {
                                title: 'Picked Up',
                                data: [
                                    {
                                        id: 11,
                                        key: 'picked-up',
                                        title: 'Litter is picked up'
                                    }
                                ]
                            },
                            {
                                title: 'TAGGING',
                                data: [
                                    {
                                        id: 12,
                                        key: 'enable_admin_tagging',
                                        title: 'Enable crowdsourced tagging'
                                    },
                                    {
                                        id: 14,
                                        key: 'refresh-tags',
                                        title: 'Refresh Tags'
                                    }
                                ]
                            },
                            {
                                title: 'PRIVACY',
                                data: [
                                    {
                                        id: 4,
                                        key: 'name-maps',
                                        title: 'Show Name on Maps'
                                    },
                                    {
                                        id: 5,
                                        key: 'username-maps',
                                        title: 'Show Username on Maps'
                                    },
                                    {
                                        id: 6,
                                        key: 'name-leaderboard',
                                        title: 'Show Name on Leaderboards'
                                    },
                                    {
                                        id: 7,
                                        key: 'username-leaderboard',
                                        title: 'Show Username on Leaderboards'
                                    },
                                    {
                                        id: 8,
                                        key: 'name-createdby',
                                        title: 'Show Name on Created By'
                                    },
                                    {
                                        id: 9,
                                        key: 'username-createdby',
                                        title: 'Show Username on Created By'
                                    }
                                ]
                            },
                            {
                                title: 'Delete Account',
                                data: [
                                    {
                                        id: 13,
                                        key: 'delete-account',
                                        title: 'Delete your account'
                                    }
                                ]
                            }
                        ]}
                        renderItem={({item, index, section}) => (
                            <View style={styles.sectionRow} key={index}>
                                {renderRow(item)}
                            </View>
                        )}
                        keyExtractor={item => item.key}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            <Caption
                                style={{
                                    textAlign: 'center',
                                    marginVertical: 20
                                }}
                            >Version {DeviceInfo.getVersion()}</Caption>
                        }
                    />
                </View>
            </View>

            <ActionSheet
                closeOnTouchBackdrop={false}
                ref={actionSheetRef}
            >
                <View
                    style={{
                        height: 300,
                        padding: 40,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        alignItems: 'center',
                        backgroundColor: 'white',
                        justifyContent: 'center'
                    }}
                >
                    <Body style={{textAlign: 'center'}}>
                        Do you want to change picked up status of all the images ?
                    </Body>
                    <View
                        style={{
                            marginTop: 20,
                            marginBottom: 40,
                            width: SCREEN_WIDTH - 40
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                dispatch(changeLitterStatus(user?.picked_up));

                                actionSheetRef.current?.hide();
                            }}
                            style={[
                                styles.actionButtonStyle,
                                {
                                    backgroundColor: Colors.accent,
                                    marginVertical: 20
                                }
                            ]}
                        >
                            <Body color="white">Yes, Change</Body>
                        </Pressable>
                        <Pressable
                            onPress={actionSheetRef.current?.hide}
                            style={[styles.actionButtonStyle]}
                        >
                            <Body color="accent">No, Don't Change</Body>
                        </Pressable>
                    </View>
                </View>
            </ActionSheet>

            {/* <SafeAreaView style={{ flex: 0, backgroundColor: '#f7f7f7' }} /> */}
        </View>
    );
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

export default SettingsScreen;
