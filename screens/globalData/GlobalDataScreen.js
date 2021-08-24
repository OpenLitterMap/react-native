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
            litterStart: 0,
            photosStart: 0,
            littercoinStart: 0,
            usersStart: 0
        };
    }

    componentDidMount() {
        this.getDataFormStorage();
        this.props.getStats();
    }

    /**
     * fn to get previous stat values from AsyncStore and set to state
     */
    async getDataFormStorage() {
        const stats = await AsyncStorage.getItem('globalStats');

        if (stats !== undefined && stats !== null) {
            const { totalLitter, totalPhotos, totalLittercoin } = JSON.parse(
                stats
            );
            this.setState({
                litterStart: totalLitter,
                photosStart: totalPhotos,
                littercoinStart: totalLittercoin
            });
        }
    }

    render() {
        const {
            totalLitter,
            totalPhotos,
            totalLittercoin,
            litterTarget,
            targetPercentage
        } = this.props;

        const statsData = [
            {
                value: totalLitter || this.state.litterStart,
                startValue: this.state.litterStart,
                title: 'Total Litter',
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: totalPhotos || this.state.photosStart,
                startValue: this.state.photosStart,
                title: 'Total Photos',
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: totalLittercoin || this.state.littercoinStart,
                startValue: this.state.littercoinStart,
                title: 'Total Littercoin',
                icon: 'ios-server-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: 4748,
                startValue: 4000,
                title: 'Total Users',
                icon: 'ios-people-outline',
                color: '#0EA5E9',
                bgColor: '#E0F2FE'
            }
        ];
        return (
            <>
                <Header
                    leftContent={<Title color="white">Global Data</Title>}
                />
                {/* INFO: showing loader when there is no previous value in 
                asyncstore -- only shown on first app load after login */}
                {this.state.litterStart === 0 && totalLitter === 0 ? (
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
                            strokeWidth={30}
                            percentage={targetPercentage}
                            color={`${Colors.accent}`}
                            value={targetPercentage}
                            delay={500}
                            duration={5000}
                            radius={160}
                            tagline={`Next Target\n${litterTarget.nextTarget.toLocaleString()} Litter`}
                            valueSuffix="%"
                        />
                        {/* grid for stats */}
                        {/* added extra margin so that UserScren and GlobalData
                        screen have same starting point for stats card
                        So that it looks good when swiping */}
                        <View style={{ marginTop: 22 }}>
                            <StatsGrid statsData={statsData} />
                        </View>
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
        totalLittercoin: state.stats.totalLittercoin,
        litterTarget: state.stats.litterTarget,
        targetPercentage: state.stats.targetPercentage
    };
};

export default connect(
    mapStateToProps,
    actions
)(GlobalDataScreen);
