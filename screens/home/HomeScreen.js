import React, { Component } from 'react';
import {
    Text,
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    Animated
} from 'react-native';
import { Header } from 'react-native-elements';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Title, SubTitle } from '../components';
import { StatsCard } from './_components';
import { Svg, Circle, Path, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
class HomeScreen extends Component {
    constructor(props) {
        super(props);
        console.log(JSON.stringify(this.props.user, null, '\t'));
    }

    render() {
        const user = this.props.user;
        // svg
        const width = 300;
        const height = 300;
        const size = width < height ? width - 32 : height - 16;
        const strokeWidth = 25;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const halfCircle = radius + strokeWidth;
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
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={false}>
                    <View
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 40
                        }}>
                        <Svg width={width} height={300}>
                            <G
                                rotation="-90"
                                origin={`${halfCircle}, ${halfCircle}`}>
                                <Circle
                                    stroke="#cbd8ff"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    cx="50%"
                                    cy="50%"
                                    r={radius}
                                />
                                <AnimatedCircle
                                    stroke="#1745ce"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    cx="50%"
                                    cy="50%"
                                    r={radius}
                                    style={{ transform: [{ rotate: '90deg' }] }}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference / 2}
                                    strokeLinecap="round"
                                />
                            </G>
                        </Svg>
                    </View>
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
                </ScrollView>
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
