import React, { Component } from 'react';
import { Text, View, StyleSheet, ScrollView, Image } from 'react-native';
import { Header, Title, Colors, AnimatedCircle } from '../components';
import { IconStatsCard } from './_components';
import Icon from 'react-native-vector-icons/Ionicons';

class StatsScreen extends Component {
    render() {
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
                        percentage={50}
                        color={`${Colors.accent}`}
                        value={29.3}
                        delay={500}
                        radius={150}
                        tagline="Next Target 500K"
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
                                value="324,786"
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
                                value="181,477"
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
                                value="26,743"
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

export default StatsScreen;
