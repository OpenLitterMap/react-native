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
import Icon from 'react-native-vector-icons/Ionicons';

class GlobalDataScreen extends Component {
    constructor(props) {
        super(props);
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
                value: `${totalLitter.toLocaleString()}`,
                title: 'Total Litter',
                icon: 'ios-trash-outline',
                color: '#14B8A6',
                bgColor: '#CCFBF1'
            },
            {
                value: `${totalPhotos.toLocaleString()}`,
                title: 'Total Photos',
                icon: 'ios-images-outline',
                color: '#A855F7',
                bgColor: '#F3E8FF'
            },
            {
                value: `${totalLittercoin.toLocaleString()}`,
                title: 'Total Littercoin',
                icon: 'ios-server-outline',
                color: '#F59E0B',
                bgColor: '#FEF9C3'
            },
            {
                value: '4,748',
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
                        <StatsGrid statsData={statsData} />
                        {/* <View style={styles.statsContainer}>
                            <View style={styles.statsRow}>
                                <IconStatsCard
                                    imageContent={
                                        <Icon
                                            name="ios-trash-outline"
                                            size={36}
                                            color="#E12F2E"
                                        />
                                    }
                                    value={`${totalLitter.toLocaleString()}`}
                                    title="Total Litter"
                                    contentCenter
                                    backgroundColor="#FDE5E5"
                                    fontColor="#E12F2E"
                                />
                                <IconStatsCard
                                    imageContent={
                                        <Icon
                                            name="ios-images-outline"
                                            size={36}
                                            color="#997028"
                                        />
                                    }
                                    contentCenter
                                    value={`${totalPhotos.toLocaleString()}`}
                                    title="Total Photos"
                                    backgroundColor="#FDF2D3"
                                    fontColor="#997028"
                                />
                            </View>
                            <View style={styles.statsRow}>
                                <IconStatsCard
                                    imageContent={
                                        <Icon
                                            name="ios-server-outline"
                                            size={36}
                                            color="#2C45FF"
                                        />
                                    }
                                    value={`${totalLittercoin.toLocaleString()}`}
                                    title="Total Littercoin"
                                    contentCenter
                                    backgroundColor="#ECEEFF"
                                    fontColor="#2C45FF"
                                />
                                <IconStatsCard
                                    imageContent={
                                        <Icon
                                            name="ios-people-outline"
                                            size={36}
                                            color="#1F6E5D"
                                        />
                                    }
                                    contentCenter
                                    value="4,748"
                                    title="Total Users"
                                    backgroundColor="#DEFFF8"
                                    fontColor="#1F6E5D"
                                />
                            </View>
                        </View> */}
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
