import React, { Component } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    SectionList,
    Switch,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Button, FormInput, Header, Icon } from 'react-native-elements';
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
        return (
            <>
                <SafeAreaView style={{ flex: 0, backgroundColor: '#2189dc' }} />
                <SafeAreaView style={{ flex: 1 }}>
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={this.props.settingsModalVisible}
                    >
                        { this.props.wait &&
                        <View style={styles.waitModal}>
                            <ActivityIndicator />
                        </View>
                        }
                        { this.props.settingsEdit &&
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
                        centerComponent={{ text: 'Settings', style: { color: '#fff', fontSize: SCREEN_HEIGHT * 0.02 } }}
                    />
                    <View style={styles.container}>

                        <SectionList
                            stickySectionHeadersEnabled={false}
                            renderSectionHeader={({ section: { title }}) => (
                                <Text style={styles.sectionHeaderTitle}>{title}</Text>
                            )}
                            // Todo, save these elsewhere and import them for readability.
                            sections={[
                                { title: 'MY ACCOUNT', data: [
                                        {
                                            id: 1,
                                            title: 'Name'
                                        },
                                        {
                                            id: 2,
                                            title: 'Username'
                                        },
                                        {
                                            id: 3,
                                            title: 'Email'
                                        }]},
                                { title: 'PRIVACY', data: [
                                        {
                                            id: 4,
                                            title: 'Show Name on Maps'
                                        },
                                        {
                                            id: 5,
                                            title: 'Show Username on Maps'
                                        },
                                        {
                                            id: 6,
                                            title: 'Show Name on Leaderboards'
                                        },
                                        {
                                            id: 7,
                                            title: 'Show Username on Leaderboards'
                                        },
                                        {
                                            id: 8,
                                            title: 'Show Name on CreatedBy'
                                        },
                                        {
                                            id: 9,
                                            title: 'Show Username on CreatedBy'
                                        }
                                    ]},
                                { title: 'TAGS', data: [
                                        {
                                            id: 10,
                                            title: 'Show Previous Tags'
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

                        <View style={styles.logoutContainer}>
                            <Icon name="power-settings-new" size={SCREEN_HEIGHT * 0.05} color='#00aced' onPress={this.props.logout} />
                            <Text style={{ fontSize: SCREEN_HEIGHT * 0.02 }}>Logout</Text>
                        </View>

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
                    onPress={() => this._rowPressed(item.id)}
                >
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ flex: 1, fontSize: SCREEN_HEIGHT * 0.02 }}>{item.title}</Text>
                        <Text style={{ fontSize: SCREEN_HEIGHT * 0.02}}>{ this._getRowData(item.id) }</Text>
                    </View>
                </TouchableHighlight>
            );
        } else {
            return (
                <View style={styles.switchRow}>
                    <Text style={{ flex: 1, fontSize: SCREEN_HEIGHT * 0.02 }}>{item.title}</Text>
                    { this._getRowData(item.id) }
                </View>
            );
        }
    }

    _getRowData (id)
    {
        if (this.props.user) {
            if (id == 1) {
                return <Text>{this.props.user.name}</Text>;
            } else if (id == 2) {
                return <Text>{this.props.user.username}</Text>;
            } else if (id == 3) {
                return <Text>{this.props.user.email}</Text>;
            } else {
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
    _toggleSwitch (id) {
        Alert.alert('Notice!', 'Do you really want to change this setting?',
            [
                { text: "OK", onPress: () => this.props.toggleSettingsSwitch(id, this.props.token) },
                { text: "Cancel", onPress: () => console.log("cancel pressed")}
            ],
            { cancelable: true }
        )}

    /**
     * A Row was pressed - open onTextChange
     */
    _rowPressed (id) {
        this.props.toggleSettingsModal(id);
    }

    /**
     * Get the True or False value for a Switch
     */
    _getSwitchValue(id) {
        if (id == 4) {
            return this.props.user.show_name_maps ? true : false;
        } else if (id == 5) {
            return this.props.user.show_username_maps ? true : false;
        } else if (id == 6) {
            return this.props.user.show_name ? true : false;
        } else if (id == 7) {
            return this.props.user.show_username ? true : false;
        } else if (id == 8) {
            return this.props.user.show_name_createdby ? true : false;
        } else if (id == 9) {
            return this.props.user.show_username_createdby ? true : false;
        } else if (id == 10) {
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
        // paddingBottom: 50,
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
        settingsModalVisible: state.settings.settingsModalVisible,
        token: state.auth.token,
        user: state.auth.user,
        wait: state.settings.wait,
        settingsEdit: state.settings.settingsEdit
    };
}

export default connect(mapStateToProps, actions)(SettingsScreen);
