import React, { Component } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Header } from 'react-native-elements';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Title, SubTitle } from '../components';
import { StatsCard } from './_components';

class HomeScreen extends Component {
    constructor(props) {
        super(props);
        console.log(JSON.stringify(this.props.user, null, '\t'));
    }

    render() {
        const user = this.props.user;
        return (
            <>
                <Header
                    containerStyle={{ backgroundColor: 'white' }}
                    centerComponent={{
                        text: 'Dummy home',
                        style: { color: '#000' }
                    }}
                    rightComponent={
                        <Pressable>
                            <Icon
                                name="ios-settings-outline"
                                color="#000"
                                size={24}
                                onPress={() => {
                                    this.props.navigation.navigate('SETTING');
                                }}
                            />
                        </Pressable>
                    }
                />
                <View style={styles.container}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <StatsCard value={`${user?.xp}`} title="XP" />
                            <StatsCard value={`${user?.level}`} title="Level" />
                        </View>
                        <View style={styles.statsRow}>
                            <StatsCard
                                value={`${user?.total_images}`}
                                title="Photos"
                            />
                            <StatsCard value="105" title="Littercoins" />
                        </View>
                    </View>
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'white'
    },
    statsContainer: {
        marginTop: 20,
        padding: 10
    },
    statsRow: {
        justifyContent: 'space-between',
        flexDirection: 'row'
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
)(HomeScreen);
