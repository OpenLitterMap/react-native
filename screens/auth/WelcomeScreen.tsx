import React, {FC, useState} from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Slides} from './authComponents';
import {Body, Colors} from '../components';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/illustrations/click_image.png'),
        titleText: 'Easy',
        text: 'Just tag litter and upload it'
    },
    {
        id: 2,
        image: require('../../assets/illustrations/rankup.png'),
        titleText: 'Fun',
        text: 'Climb the leaderboards'
    },
    {
        id: 3,
        image: require('../../assets/illustrations/open_data.png'),
        titleText: 'Open Source',
        text: 'UN Digital Public Good'
    }
];

const WelcomeScreen: FC<{navigation: any}> = ({navigation}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event: any) => {
        const currentIndex = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
        );
        setActiveIndex(currentIndex);
    };

    const goToAuth = (screen: string) => {
        navigation.navigate('AUTH', {screen});
    };

    return (
        <>
            <StatusBar
                translucent
                barStyle="dark-content"
                backgroundColor="transparent"
            />
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.centered}>
                        <View>
                            <Slides
                                data={SLIDE_DATA}
                                activeIndex={activeIndex}
                                onScroll={handleScroll}
                                showDots={false}
                            />
                        </View>

                        <View style={styles.buttons}>
                            <Pressable
                                onPress={() => goToAuth('CREATE_ACCOUNT')}
                                style={({pressed}) => [
                                    styles.primaryButton,
                                    pressed && styles.primaryButtonPressed
                                ]}>
                                <Body
                                    family="semiBold"
                                    color="white"
                                    dictionary="Get Started!"
                                    style={styles.primaryButtonText}
                                />
                            </Pressable>

                            <Pressable
                                onPress={() => goToAuth('LOGIN')}
                                style={styles.secondaryRow}>
                                <Body
                                    color="muted"
                                    style={styles.secondaryText}
                                    dictionary="Already have an account?"
                                />
                                <Body
                                    color="accent"
                                    family="semiBold"
                                    style={styles.secondaryText}>
                                    {' '}
                                </Body>
                                <Body
                                    color="accent"
                                    family="semiBold"
                                    style={styles.secondaryText}
                                    dictionary="Log In"
                                />
                            </Pressable>
                        </View>

                        <View style={styles.dotSection}>
                            <View style={styles.dotContainer}>
                                {SLIDE_DATA.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.dot,
                                            i === activeIndex && styles.dotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    safe: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    centered: {
        flex: 1,
        justifyContent: 'center'
    },
    buttons: {
        paddingHorizontal: 24,
        marginTop: 24
    },
    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 100,
        height: 56,
        shadowColor: Colors.accent,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    primaryButtonPressed: {
        backgroundColor: '#229954',
        shadowOpacity: 0.15
    },
    primaryButtonText: {
        fontSize: 17,
        letterSpacing: 0.3
    },
    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14
    },
    secondaryText: {
        fontSize: 15
    },
    dotSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: 20
    },
    dotContainer: {
        flexDirection: 'row',
        gap: 6
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
        opacity: 0.3
    },
    dotActive: {
        width: 24,
        opacity: 1
    }
});

export default WelcomeScreen;
