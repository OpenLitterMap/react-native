import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    SectionList,
    StyleSheet,
    Switch,
    useWindowDimensions,
    View
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Header, SubTitle} from '../components';
import SettingsComponent from './settingComponents/SettingsComponent';
import {useDispatch, useSelector} from 'react-redux';

import {
    saveSettings,
    toggleEditModal,
    toggleSettingsSwitch
} from '../../reducers/settings_reducer';
import {
    fetchAllUntaggedPhotos
} from '../../reducers/server_photos_reducer';

const SettingsScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const {height: SCREEN_HEIGHT} = useWindowDimensions();

    const user = useSelector(state => state.auth.user);
    const editModalVisible = useSelector(
        state => state.settings.editModalVisible
    );
    const savingToggle = useSelector(state => state.settings.toggleStatus === 'loading');

    const countryCode = user?.global_flag?.toUpperCase();

    /**
     * fn to render setting rows
     * if item.key is "name", "username", "email"
     * show values else show toggle switch
     */
    const renderRow = item => {

        const dataKeys = [
            'name',
            'username',
            'email',
            'social',
            'delete-account',
            'quick-tags'
        ];

        if (dataKeys.includes(item?.key)) {
            return (
                <Pressable
                    style={{flex: 1, padding: 10}}
                    onPress={() => {
                        if (item.key === 'quick-tags') {
                            navigation.navigate('QUICK_TAGS_SETTINGS');
                            return;
                        }
                        rowPressed(item.id, item.title, item.key);
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }}>
                        <Body dictionary={`${item.title}`} />

                        {/* dont show any data if key is social; we dont have any particular data to show now */}
                        {item?.key !== 'social' && (
                            <Body>{getRowData(item.id, item?.key)}</Body>
                        )}
                    </View>
                </Pressable>
            );
        } else if (item?.key === 'country') {
            return null;
        } else {
            return (
                <View style={[styles.switchRow, {padding: SCREEN_HEIGHT * 0.01}]}>
                    <Body dictionary={`${item.title}`} />

                    {getRowData(item.id, item.key)}
                </View>
            );
        }
    };

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
        case 'quick-tags':
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
                    disabled={savingToggle}
                />
            );
        }
    };

    /**
     * Toggle the Switch - Send post request to database
     */
    const toggleSwitch = (id, key) => {
        let title = '';
        let subtitle = '';

        const ok = t('OK');
        const cancel = t('Cancel');

        if (key === 'public-photos') {
            title = user?.public_photos ? t('Make photos private?') : t('Make photos public?');
            subtitle = user?.public_photos
                ? t('Your future uploads will be visible only to you. Existing photos are not affected.')
                : t('Your future uploads will be visible to everyone on the map. You can change individual photo visibility from My Uploads.');
        } else if (key === 'enable_admin_tagging') {
            title = user?.enable_admin_tagging ? t('Turn off') : t('Turn on');

            subtitle += user?.enable_admin_tagging
                ? ' \n' + t('Only you will be able to tag your uploads')
                : ' \n' + t('Our volunteers will tag your uploads');
        } else {
            title = t('Change setting?');
        }

        Alert.alert(
            title,
            subtitle,
            [
                {
                    text: ok,
                    onPress: async () => {
                        if (key === 'picked-up') {
                            // Toggle the user's default picked_up preference
                            await dispatch(
                                saveSettings({
                                    dataKey: 'picked_up',
                                    dataValue: !user?.picked_up
                                })
                            );
                        } else if (key === 'global_flag') {
                            await dispatch(
                                saveSettings({
                                    dataKey: 'global_flag',
                                    dataValue: countryCode?.toLowerCase()
                                })
                            );
                        } else if (key === 'public-photos') {
                            await dispatch(
                                saveSettings({
                                    dataKey: 'public_photos',
                                    dataValue: !user?.public_photos
                                })
                            );
                        } else if (key === 'enable_admin_tagging') {
                            if (user?.enable_admin_tagging) {
                                await dispatch(fetchAllUntaggedPhotos());
                            }

                            await dispatch(
                                saveSettings({
                                    dataKey: 'enable_admin_tagging',
                                    dataValue: !user?.enable_admin_tagging
                                })
                            );
                        } else {
                            // Privacy Settings
                            await dispatch(toggleSettingsSwitch({id}));
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
    };

    /**
     * A Row was pressed
     *
     * Open modal to show settings options
     */
    const rowPressed = (id, title, key = '') => {
        dispatch(toggleEditModal({id, title, key}));
    };

    /**
     * Get the 0 or 1 value for a Switch
     *
     * INFO: show_name, show_username, picked_up and enable_admin_tagging have boolean values
     * We need to cast these to integers
     *
     * rest have 0 & 1
     */
    const getSwitchValue = key => {
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
        case 'picked-up':
            return user?.picked_up === false ? 0 : 1;
        case 'enable_admin_tagging':
            return Number(user?.enable_admin_tagging);
        case 'public-photos':
            return user?.public_photos === false ? 0 : 1;
        default:
            break;
        }
    };

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
            />
            <View style={{flex: 1}}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={editModalVisible}
                    onRequestClose={() => dispatch(toggleEditModal({}))}>
                    {savingToggle && (
                        <View style={styles.waitModal}>
                            <ActivityIndicator />
                        </View>
                    )}
                    {editModalVisible && (
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
                                title: 'UPLOADS',
                                data: [
                                    {
                                        id: 14,
                                        key: 'public-photos',
                                        title: 'Public Photos'
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
                                        id: 15,
                                        key: 'quick-tags',
                                        title: 'Quick Tags'
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
                            <View style={[styles.sectionRow, {height: SCREEN_HEIGHT * 0.06}]} key={index}>
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
                                }}>
                                Version {DeviceInfo.getVersion()}
                            </Caption>
                        }
                    />
                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7'
    },
    modal: {
        backgroundColor: 'rgba(255,255,255,1)',
        flex: 1
    },
    sectionRow: {
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 2,
        flexDirection: 'row'
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
        justifyContent: 'space-between'
    },
    waitModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default SettingsScreen;
