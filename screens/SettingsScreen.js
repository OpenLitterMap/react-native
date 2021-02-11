import React, { Component } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    SectionList,
    Switch,
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import { getTranslation, TransText } from "react-native-translation";
import { Header } from 'react-native-elements';
import * as actions from '../actions';
import { connect } from 'react-redux';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import SettingsComponent from './pages/SettingsComponent';

class SettingsScreen extends Component {

    constructor(props) {
        super(props);
    }

    render ()
    {
        const lang = this.props.lang;
        const settings = getTranslation(`${lang}.settings.settings`);
        const logout = getTranslation(`${lang}.settings.logout`);

        return (
            <>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#2189dc' }} />
                <SafeAreaView style={{ flex: 1 }}>
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={this.props.settingsModalVisible}
                    >
                        {
                            this.props.wait &&
                                <View style={styles.waitModal}>
                                    <ActivityIndicator />
                                </View>
                            }
                        {
                            this.props.settingsEdit &&
                                <View style={styles.modal}>
                                    <SettingsComponent />
                                </View>
                        }
                    </Modal>

                    <Header
                        containerStyle={{ paddingTop: 0, height: SCREEN_HEIGHT * 0.1 }}
                        outerContainerStyles={{ height: SCREEN_HEIGHT * 0.1 }}
                        leftComponent={{
                            icon: 'keyboard-arrow-left',
                            color: '#fff',
                            onPress: () => this.props.navigation.navigate('swipe'),
                            size: SCREEN_HEIGHT * 0.03,
                        }}
                        centerComponent={{ text: settings, style: { color: '#fff', fontSize: SCREEN_HEIGHT * 0.02 } }}
                        rightComponent={{
                            text: logout,
                            onPress: () => this.props.logout(),
                            size: SCREEN_HEIGHT * 0.03
                        }}
                    />
                    <View style={styles.container}>
                        <SectionList
                            stickySectionHeadersEnabled={false}
                            renderSectionHeader={({ section: { title }}) => (
                                <TransText style={styles.sectionHeaderTitle} dictionary={`${lang}.${title}`} />
                            )}
                            // Todo, save these elsewhere and import them for readability.
                            sections={[
                                { title: 'settings.my-account', data: [
                                        {
                                            id: 1,
                                            title: 'settings.name'
                                        },
                                        {
                                            id: 2,
                                            title: 'settings.username'
                                        },
                                        {
                                            id: 3,
                                            title: 'settings.email'
                                        }]},
                                { title: 'settings.privacy', data: [
                                        {
                                            id: 4,
                                            title: 'settings.show-name-maps'
                                        },
                                        {
                                            id: 5,
                                            title: 'settings.show-username-maps'
                                        },
                                        {
                                            id: 6,
                                            title: 'settings.show-name-leaderboards'
                                        },
                                        {
                                            id: 7,
                                            title: 'settings.show-username-leaderboards'
                                        },
                                        {
                                            id: 8,
                                            title: 'settings.show-name-createdby'
                                        },
                                        {
                                            id: 9,
                                            title: 'settings.show-username-createdby'
                                        }
                                    ]},
                                { title: 'settings.tags', data: [
                                        {
                                            id: 10,
                                            title: 'settings.show-previous-tags'
                                        }
                                    ]}
                            ]}
                            renderItem={({item, index, section}) => (
                                <View style={styles.sectionRow} key={index}>
                                    {this._renderRow(item)}
                                </View>
                            )}
                            keyExtractor={(item, index) => item + index}
                        />
                    </View>
                </SafeAreaView>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#ccc' }} />
            </>
        );
    }

    /**
     * Custom Functions
     */
    _renderRow (item)
    {
        if (item.id <= 3) {
            return (
                <TouchableHighlight
                    underlayColor={'#95a5a6'}
                    style={{ flex: 1, padding: 10 }}
                    onPress={() => this._rowPressed(item.id, item.title)}
                >
                    <View style={{ flexDirection: 'row' }}>
                        <TransText
                            style={{ flex: 1, fontSize: SCREEN_HEIGHT * 0.02 }}
                            dictionary={`${this.props.lang}.${item.title}`}
                        />
                        <Text style={{ fontSize: SCREEN_HEIGHT * 0.02}}>{ this._getRowData(item.id) }</Text>
                    </View>
                </TouchableHighlight>
            );
        } else {
            return (
                <View style={styles.switchRow}>
                    <TransText style={{ flex: 1, fontSize: SCREEN_HEIGHT * 0.02 }} dictionary={`${this.props.lang}.${item.title}`} />
                    { this._getRowData(item.id) }
                </View>
            );
        }
    }

    /**
     * Return the value for each row
     */
    _getRowData (id)
    {
        if (this.props.user)
        {
            if (id === 1)
            {
                return this.props.user.name;
            }

            else if (id === 2)
            {
                return this.props.user.username;
            }

            else if (id === 3)
            {
                return this.props.user.email;
            }

            else
            {
                return (
                    <Switch
                        onValueChange={() => this._toggleSwitch(id)}
                        value={this._getSwitchValue(id)}
                    />
                );
            }
        }
    }

    /**
     * Toggle the Switch - Send post request to database
     */
    _toggleSwitch (id)
    {
        const lang = this.props.lang;

        const alert = getTranslation(`${lang}.settings.alert`);
        const info = getTranslation(`${lang}.settings.do-you-really-want-to-change`);
        const ok = getTranslation(`${lang}.settings.ok`);
        const cancel = getTranslation(`${lang}.settings.cancel`);

        Alert.alert(alert, info,
            [
                { text: ok, onPress: () => this.props.toggleSettingsSwitch(id, this.props.token) },
                { text: cancel, onPress: () => console.log("cancel pressed")}
            ],
            { cancelable: true }
        )
    }

    /**
     * A Row was pressed - open onTextChange
     */
    _rowPressed (id, title)
    {
        this.props.toggleSettingsModal(id, title);
    }

    /**
     * Get the True or False value for a Switch
     */
    _getSwitchValue (id)
    {
        if (id === 4) {
            return this.props.user.show_name_maps ? true : false;
        } else if (id === 5) {
            return this.props.user.show_username_maps ? true : false;
        } else if (id === 6) {
            return this.props.user.show_name ? true : false;
        } else if (id === 7) {
            return this.props.user.show_username ? true : false;
        } else if (id === 8) {
            return this.props.user.show_name_createdby ? true : false;
        } else if (id === 9) {
            return this.props.user.show_username_createdby ? true : false;
        } else if (id === 10) {
            return this.props.user.previous_tags ? true : false
        }
    }
}

const styles = {
    bottomImageContainer: {
        backgroundColor: "#ccc",
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#ccc'
    },
    image: {
        height: 50,
        width: 50,
        borderRadius: 6
    },
    imageContainer: {
        backgroundColor: "blue",
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
        backgroundColor:'rgba(255,255,255,1)',
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
        borderBottomColor: '#ccc',
        borderBottomWidth: 2,
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
        color: '#2980b9',
        paddingLeft: 20,
        paddingTop: 20,
        paddingBottom: 5,
        fontSize: SCREEN_HEIGHT * 0.02
    },
    switchRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: SCREEN_HEIGHT * 0.02,
        padding: SCREEN_HEIGHT * 0.01
    },
    waitModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center'
    }
}

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        settingsModalVisible: state.settings.settingsModalVisible,
        token: state.auth.token,
        user: state.auth.user,
        wait: state.settings.wait,
        settingsEdit: state.settings.settingsEdit
    };
}

export default connect(mapStateToProps, actions)(SettingsScreen);
