import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
        console.log('GLOBAL DATA');
    }

    componentDidMount() {
        this.props.getStats();
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
                // value: `${totalLitter.toLocaleString()}`,
                value: totalLitter,
                title: 'Total Litter',
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: totalPhotos,
                title: 'Total Photos',
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: totalLittercoin,
                title: 'Total Littercoin',
                icon: 'ios-server-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: 4748,
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
                {totalLitter === 0 || totalPhotos === 0 ? (
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
