import React, { FC } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import { LanguageFlags, Slides } from './authComponents';
import { Body, Colors } from '../components';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/illustrations/click_image.png'),
        title: 'welcome.easy',
        text: 'welcome.just-tag-and-upload'
    },
    {
        id: 2,
        image: require('../../assets/illustrations/rankup.png'),
        title: 'welcome.fun',
        text: 'welcome.climb-leaderboards'
    },
    {
        id: 3,
        image: require('../../assets/illustrations/open_data.png'),
        title: 'welcome.open',
        text: 'welcome.open-database'
    }
];

// interface WelcomeScreenProps extends PropsFromRedux {
//     navigation: any;
// }

// interface WelcomeScreenState {}

// @ts-ignore
const WelcomeScreen: FC = ({ navigation })  => {

  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = (event: any) => {
    const currentIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(currentIndex);
  }

    const goToAuth = (screen: string) => {
        navigation.navigate('AUTH', {
            screen
        });
    }

    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

    /**
     * Welcome on-boarding screen [1,2,3]
     */
    return (
        <>
            <StatusBar
                translucent
                barStyle="dark-content"
                backgroundColor={`${Colors.accentLight}`}
            />
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.accentLight, paddingTop: statusBarHeight }}>

                <View style={{ flex: 1, backgroundColor: Colors.accentLight }}>

                    <Slides data={SLIDE_DATA} activeIndex={activeIndex} onScroll={handleScroll}/>

                    <View style={styles.loginPosition}>
                        <Pressable
                            onPress={() => goToAuth('CREATE_ACCOUNT')}
                            style={styles.loginButton}
                        >
                            <Body
                                family="medium"
                                style={styles.signupText}
                                color="white"
                                dictionary={'welcome.get-started'}
                            />
                        </Pressable>
                        <Pressable
                            onPress={() => goToAuth('LOGIN')}
                            style={styles.loginContainer}
                        >
                            <Body
                                style={styles.loginText}
                                dictionary={'auth.already-have'}
                            />
                            <Body
                                color="accent"
                                family="semiBold"
                                style={[styles.loginText]}
                                dictionary={'auth.login'}
                            />
                        </Pressable>
                    </View>

                    <LanguageFlags />
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    activityContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        alignContent: 'center'
    },
    loginButton: {
        alignItems: 'center',
        backgroundColor: Colors.accent,
        // borderWidth: 0.5,
        borderRadius: 100,
        height: SCREEN_HEIGHT * 0.08,
        justifyContent: 'center',
        width: SCREEN_WIDTH - 40
    },
    loginPosition: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.06,
        left: 20
    },
    signupText: {
        // fontSize: SCREEN_HEIGHT * 0.02,
        // fontWeight: '600',
        // color: 'white'
    },
    loginText: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 5
    }
});

export default WelcomeScreen;
