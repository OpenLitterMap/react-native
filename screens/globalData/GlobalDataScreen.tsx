import React, {Component} from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AnimatedCircle,
    Body,
    Colors,
    Header,
    StatsGrid,
    Title
} from '../components';
import * as actions from '../../actions';
import {connect} from 'react-redux';

interface GlobalDataScreenProps {
    totalLitter: number;
    totalPhotos: number;
    totalUsers: number;
    totalLittercoin: number;
    litterTarget: any; // Replace 'any' with the type for 'litterTarget'
    targetPercentage: number;
    statsErrorMessage: string | null;
    lang: string;
    getStats: () => void;
    navigation: any; // Replace 'any' with the type for 'navigation'
}

interface GlobalDataScreenState {
    isFocused: boolean;
    litterStart: number;
    photosStart: number;
    littercoinStart: number;
    usersStart: number;
    targetPercentageStart: number;
}

class GlobalDataScreen extends Component<
    GlobalDataScreenProps,
    GlobalDataScreenState
> {
    focusListener: (() => void) | null = null;

    constructor(props: GlobalDataScreenProps) {
        super(props);
        // default start value
        this.state = {
            isFocused: false,
            litterStart: 0,
            photosStart: 0,
            littercoinStart: 0,
            usersStart: 0,
            targetPercentageStart: 0
        };
    }

    async componentDidMount() {
        this.focusListener = this.props.navigation.addListener('focus', () => {
            // console.log('GLOBAL DATA');

            this.setState({
                isFocused: true
            });
        });

        await this.getDataFormStorage();
        this.props.getStats();
    }

    componentWillUnmount() {
        if (this.focusListener) {
            this.focusListener();
        }
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
                targetPercentage,
                totalLittercoin
            } = JSON.parse(stats);
            this.setState({
                litterStart: totalLitter,
                photosStart: totalPhotos,
                usersStart: totalUsers,
                littercoinStart: totalLittercoin,
                targetPercentageStart: targetPercentage
            });
        }
    }

    render() {
        const {
            totalLitter,
            totalPhotos,
            totalUsers,
            totalLittercoin,
            litterTarget,
            targetPercentage,
            lang,
            statsErrorMessage
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

        if (statsErrorMessage !== null) {
            return (
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 20
                    }}>
                    <Body style={{textAlign: 'center'}}>
                        {statsErrorMessage}
                    </Body>
                    <Pressable
                        onPress={() => this.props.getStats()}
                        style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderWidth: 1,
                            borderRadius: 4,
                            marginTop: 20
                        }}>
                        <Body>Try again</Body>
                    </Pressable>
                </View>
            );
        }

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
                            strokeWidth={30}
                            percentage={targetPercentage}
                            startPercentage={this.state.targetPercentageStart}
                            color={`${Colors.accent}`}
                            value={targetPercentage}
                            startValue={this.state.targetPercentageStart}
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

// Should be AppState -> Your actual root state
const mapStateToProps = (state: any) => {
    return {
        totalLitter: state.stats.totalLitter,
        totalPhotos: state.stats.totalPhotos,
        totalUsers: state.stats.totalUsers,
        totalLittercoin: state.stats.totalLittercoin,
        litterTarget: state.stats.litterTarget,
        targetPercentage: state.stats.targetPercentage,
        statsErrorMessage: state.stats.statsErrorMessage,
        lang: state.auth.lang
    };
};

export default connect(mapStateToProps, actions)(GlobalDataScreen);
