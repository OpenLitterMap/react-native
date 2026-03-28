import React from 'react';
import {Image, Pressable, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';

/**
 * Post-signup welcome screen.
 * Single screen — not a carousel. Shows what success looks like (a tagged photo on a map),
 * states the 3-step promise, and has one CTA: "Get started."
 */
const OnboardingWelcomeScreen = ({navigation}) => {
    return (
        <>
            <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} />

                    <View style={styles.content}>
                        <Title style={styles.heading}>
                            {'Welcome to OpenLitterMap'}
                        </Title>

                        <Caption color="muted" style={styles.subheading}>
                            {'Take a photo. Tag it. Put it on the map.'}
                        </Caption>

                        <View style={styles.visualContainer}>
                            <Image
                                source={require('../../assets/illustrations/click_image.png')}
                                style={styles.visual}
                            />
                        </View>

                        <Caption color="muted" style={styles.description}>
                            {'One photo of litter becomes real data that scientists and cities use to clean up our planet.'}
                        </Caption>
                    </View>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={() => navigation.navigate('CHOOSE_PATH')}
                            style={({pressed}) => [
                                styles.primaryButton,
                                pressed && styles.primaryButtonPressed
                            ]}>
                            <Body
                                family="semiBold"
                                color="white"
                                style={styles.primaryButtonText}>
                                {'Get started'}
                            </Body>
                        </Pressable>
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
        flex: 1
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32
    },
    heading: {
        textAlign: 'center',
        marginBottom: 8
    },
    subheading: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24
    },
    visualContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    visual: {
        width: 150,
        height: 150,
        resizeMode: 'contain'
    },
    description: {
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32
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
    }
});

export default OnboardingWelcomeScreen;
