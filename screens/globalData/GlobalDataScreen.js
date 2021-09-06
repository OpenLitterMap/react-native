import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {
    Header,
    Title,
    Colors,
    AnimatedCircle,
    StatsGrid
} from '../components';
import * as actions from '../../actions';
import { connect } from 'react-redux';

class GlobalDataScreen extends Component {
    constructor(props) {
        super(props);
        // default start value
        this.state = {
            isFocused: false,
            litterStart: 0,
            photosStart: 0,
            littercoinStart: 0,
            usersStart: 0,
            percentageStart: 0
        };
    }

    async componentDidMount() {
        this.focusListner = this.props.navigation.addListener('focus', () => {
            // console.log('GLOBAL DATA');

            this.setState({
                isFocused: true
            });
        });

        const token = await this.getDataFormStorage();
        this.props.getStats(token);
    }

    componentWillUnmount() {
        this.focusListner();
    }

    /**
     * fn to get previous stat values from AsyncStore and set to state
     */
    async getDataFormStorage() {
        const stats = await AsyncStorage.getItem('globalStats');
        if (stats !== undefined && stats !== null) {
            const {
                totalLitter,
                totalPhotos,
                totalUsers,
                totalLittercoin,
                targetPercentage
            } = JSON.parse(stats);
            this.setState({
                litterStart: totalLitter,
                photosStart: totalPhotos,
                usersStart: totalUsers,
                littercoinStart: totalLittercoin,
                percentageStart: targetPercentage
            });
        }
        const token = await AsyncStorage.getItem('token');
        return token;
    }

    render() {
        const {
            totalLitter,
            totalPhotos,
            totalUsers,
            totalLittercoin,
            litterTarget,
            targetPercentage,
            lang
        } = this.props;

        const statsData = [
            {
                value: totalLitter || this.state.litterStart,
                startValue: this.state.litterStart,
                title: `${lang}.stats.total-litter`,
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: totalPhotos || this.state.photosStart,
                startValue: this.state.photosStart,
                title: `${lang}.stats.total-photos`,
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: totalLittercoin || this.state.littercoinStart,
                startValue: this.state.littercoinStart,
                title: `${lang}.stats.total-littercoin`,
                icon: 'ios-server-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: totalUsers || this.state.usersStart,
                startValue: this.state.usersStart,
                title: `${lang}.stats.total-users`,
                icon: 'ios-people-outline',
                color: '#0EA5E9',
                bgColor: '#E0F2FE'
            }
        ];
        return (
            <>
                <Header
                    leftContent={
                        <Title
                            color="white"
                            dictionary={`${lang}.stats.global-data`}
                        />
                    }
                />
                {/* INFO: showing loader when there is no previous value in 
                asyncstore -- only shown on first app load after login */}
                {(this.state.litterStart === 0 && totalLitter === 0) ||
                !this.state.isFocused ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: Colors.white
                        }}>
                        <ActivityIndicator size="small" color={Colors.accent} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{
                            paddingTop: 20
                        }}
                        style={styles.container}
                        showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}>
                        <AnimatedCircle
                            startPercentage={this.state.percentageStart}
                            strokeWidth={30}
                            percentage={targetPercentage}
                            color={`${Colors.accent}`}
                            value={targetPercentage}
                            delay={0}
                            duration={5000}
                            radius={160}
                            tagline={`${this.props.lang}.stats.next-target`}
                            nextTarget={litterTarget.nextTarget.toLocaleString()}
                            valueSuffix="%"
                        />

                        <StatsGrid statsData={statsData} />
                    </ScrollView>
                )}
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        totalLitter: state.stats.totalLitter,
        totalPhotos: state.stats.totalPhotos,
        totalUsers: state.stats.totalUsers,
        totalLittercoin: state.stats.totalLittercoin,
        litterTarget: state.stats.litterTarget,
        targetPercentage: state.stats.targetPercentage,
        lang: state.auth.lang
    };
};

export default connect(
    mapStateToProps,
    actions
)(GlobalDataScreen);
