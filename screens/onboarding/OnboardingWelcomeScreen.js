import React from 'react';
import {Image, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';

/**
 * Post-signup welcome screen.
 * Single screen — not a carousel. Shows what success looks like,
 * states the 3-step promise, includes GPS setup instructions,
 * and has one CTA: "Get started."
 */
const OnboardingWelcomeScreen = ({navigation}) => {
    const {t} = useTranslation();
    const isIOS = Platform.OS === 'ios';

    return (
        <>
            <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} />

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}>
                        <Title style={styles.heading}>
                            {t('Welcome to OpenLitterMap')}
                        </Title>

                        <Caption color="muted" style={styles.subheading}>
                            {t('Take a photo. Tag it. Put it on the map.')}
                        </Caption>

                        <View style={styles.visualContainer}>
                            <Image
                                source={require('../../assets/illustrations/click_image.png')}
                                style={styles.visual}
                            />
                        </View>

                        <Caption color="muted" style={styles.description}>
                            {t('One geotagged photo of litter becomes important data that we can use to tell a story about and help educate society.')}
                        </Caption>

                        {/* GPS Instructions Card */}
                        <View style={styles.gpsCard}>
                            <Body family="semiBold" style={styles.gpsTitle}>
                                {t('Enable location on your camera')}
                            </Body>
                            <Caption color="muted" style={styles.gpsIntro}>
                                {t('Your photos need GPS so we can put them on the map:')}
                            </Caption>

                            {isIOS ? (
                                <View style={styles.stepsList}>
                                    <Pressable onPress={() => Linking.openURL('app-settings:')}>
                                        <Caption style={styles.stepText}>
                                            {'1. '}<Caption family="semiBold" color="accent">{t('Open Settings')}</Caption>
                                        </Caption>
                                    </Pressable>
                                    <Caption style={styles.stepText}>
                                        {'2. '}{t('Tap')}{' '}<Caption family="semiBold">{t('Privacy & Security')}</Caption>{' → '}<Caption family="semiBold">{t('Location Services')}</Caption>
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'3. '}{t('Make sure')}{' '}<Caption family="semiBold">{t('Location Services')}</Caption>{' '}{t('is ON')}
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'4. '}{t('Scroll to')}{' '}<Caption family="semiBold">{t('Camera')}</Caption>{' → '}{t('select')}{' '}<Caption family="semiBold">{t('While Using the App')}</Caption>
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'5. Recommended: '}<Caption family="semiBold">{'Settings'}</Caption>{' → '}<Caption family="semiBold">{'Camera'}</Caption>{' → '}<Caption family="semiBold">{'Formats'}</Caption>{' → select '}<Caption family="semiBold">{'Most Compatible'}</Caption>
                                    </Caption>
                                    <Caption color="muted" style={styles.stepHint}>
                                        {t('This saves your photos as JPGs instead of Apple\'s more complicated HEIC format.')}
                                    </Caption>
                                </View>
                            ) : (
                                <View style={styles.stepsList}>
                                    <Caption style={styles.stepText}>
                                        {'1. '}{t('Open your')}{' '}<Caption family="semiBold">{t('Camera app')}</Caption>
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'2. '}{t('Tap')}{' '}<Caption family="semiBold">{t('Settings (gear icon)')}</Caption>
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'3. '}{t('Find')}{' '}<Caption family="semiBold">{t('Location tags')}</Caption>{' '}{t('or')}{' '}<Caption family="semiBold">{t('GPS tags')}</Caption>{' → '}{t('turn ON')}
                                    </Caption>
                                    <Caption style={styles.stepText}>
                                        {'4. '}{t('If not there:')}{' '}<Caption family="semiBold">{t('Settings')}</Caption>{' → '}<Caption family="semiBold">{t('Location')}</Caption>{' → '}{t('turn ON')}
                                    </Caption>
                                </View>
                            )}

                            <Caption color="muted" style={styles.gpsOnce}>
                                {t('Once enabled, every photo becomes geotagged.')}
                            </Caption>
                            <Caption color="muted" style={styles.gpsPrivacy}>
                                {t('Remember to disable location services if you don\'t want your images to be geotagged.')}
                            </Caption>
                        </View>
                    </ScrollView>

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
                                {t('Get started')}
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
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 16
    },
    heading: {
        textAlign: 'center',
        marginBottom: 8
    },
    subheading: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16
    },
    visualContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    visual: {
        width: 120,
        height: 120,
        resizeMode: 'contain'
    },
    description: {
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8,
        marginBottom: 16
    },
    gpsCard: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    gpsTitle: {
        fontSize: 15,
        marginBottom: 4
    },
    gpsIntro: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 12
    },
    stepsList: {
        gap: 6,
        marginBottom: 12
    },
    stepText: {
        fontSize: 13,
        lineHeight: 20
    },
    stepTextBold: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '600'
    },
    stepHint: {
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 18,
        marginBottom: 2
    },
    gpsOnce: {
        fontSize: 12,
        lineHeight: 18,
        fontStyle: 'italic'
    },
    gpsPrivacy: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6
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
