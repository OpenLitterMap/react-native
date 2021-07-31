import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Header, Title, Colors, AnimatedCircle } from '../components';
import { IconStatsCard } from './_components';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

class StatsScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            percentage: 0
        };
    }

    async componentDidMount() {
        await this.props.getStats();
        this._getPercentage(
            this.props.totalLitter,
            this.props.litterTarget.previousTarget,
            this.props.litterTarget.nextTarget
        );
    }

    _getPercentage = (current, previousTarget, nextTarget) => {
        const percentage =
            ((current - previousTarget) / (nextTarget - previousTarget)) * 100;
        this.setState({ percentage });
    };
    render() {
        const {
            totalLitter,
            totalPhotos,
            totalLittercoin,
            litterTarget
        } = this.props;

        return (
            <>
                <Header
                    leftContent={<Title color="white">Stats</Title>}
                    rightContent={
                        <Icon
                            name="ios-share-outline"
                            size={24}
                            color={Colors.white}
                        />
                    }
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
                            paddingBottom: 100,
                            paddingTop: 20
                        }}
                        style={styles.container}
                        showsVerticalScrollIndicator={false}
                        alwaysBounceVertical={false}>
                        <AnimatedCircle
                            strokeWidth={30}
                            percentage={this.state.percentage}
                            color={`${Colors.accent}`}
                            value={this.state.percentage}
                            delay={500}
                            duration={1000}
                            radius={150}
                            tagline={`Next Target \n ${litterTarget.nextTarget.toLocaleString()} Litter`}
                            valueSuffix="%"
                        />

                        <View style={styles.statsContainer}>
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
                                    title="Total Littercoins"
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
        litterTarget: state.stats.litterTarget
    };
};

export default connect(
    mapStateToProps,
    actions
)(StatsScreen);
