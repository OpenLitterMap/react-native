import React from 'react';
import {Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';
import StepIndicator from './components/StepIndicator';
import OnboardingBackButton from './components/OnboardingBackButton';

/**
 * A single numbered instruction: an accent badge holding the step number and
 * the step copy beside it (with an optional muted sub-hint). Wrapping in a
 * Pressable turns the whole row into a tap target (used for "Open Settings").
 */
const StepRow = ({number, onPress, hint, children}) => {
    const row = (
        <View style={styles.stepRow}>
            <View style={styles.badge}>
                <Caption family="semiBold" color="white" style={styles.badgeText}>
                    {number}
                </Caption>
            </View>
            <View style={styles.stepBody}>
                <Caption style={styles.stepText}>{children}</Caption>
                {hint ? (
                    <Caption color="muted" style={styles.stepHint}>
                        {hint}
                    </Caption>
                ) : null}
            </View>
        </View>
    );

    return onPress ? (
        <Pressable onPress={onPress} style={({pressed}) => pressed && styles.stepRowPressed}>
            {row}
        </Pressable>
    ) : (
        row
    );
};

/**
 * Onboarding instructions screen.
 * Reached from the welcome screen via "Begin Tutorial". Shows the GPS setup
 * instructions needed before importing a photo. Shown as a pre-step (step 0):
 * the 1-2-3 indicator is visible but inactive. One CTA: "Continue Tutorial"
 * → choose path (Select Image or Take Photo), where step 1 begins.
 */
const OnboardingInstructionsScreen = ({navigation}) => {
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
                    {/* Pre-step (step 0): the 1-2-3 roadmap shows but nothing is
                        active yet — the tutorial's steps begin after "Continue Tutorial". */}
                    <StepIndicator currentStep={0} />

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}>
                        {/* Header — what & why */}
                        <View style={styles.header}>
                            <View style={styles.iconBadge}>
                                <Icon name="location-outline" size={30} color={Colors.accent} />
                            </View>
                            <Body family="semiBold" style={styles.title}>
                                {isIOS
                                    ? t('Enable Location in iPhone Settings')
                                    : t('Enable location on your camera')}
                            </Body>
                            <Caption color="muted" style={styles.intro}>
                                {isIOS
                                    ? t('This will give every image GPS data which we need to map it')
                                    : t('Your photos need GPS so we can put them on the map:')}
                            </Caption>
                        </View>

                        {/* Steps — how */}
                        <View style={styles.card}>
                            <View style={styles.steps}>
                                {isIOS ? (
                                    <>
                                        <StepRow number="1" onPress={() => Linking.openURL('app-settings:')}>
                                            <Caption family="semiBold" color="accent" style={styles.stepText}>{t('Open Settings')}</Caption>
                                        </StepRow>
                                        <StepRow number="2">
                                            {t('Tap')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Privacy & Security')}</Caption>{' → '}<Caption family="semiBold" style={styles.stepText}>{t('Location Services')}</Caption>
                                        </StepRow>
                                        <StepRow number="3">
                                            {t('Make sure')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Location Services')}</Caption>{' '}{t('is ON')}
                                        </StepRow>
                                        <StepRow number="4">
                                            {t('Scroll to')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Camera')}</Caption>{' → '}{t('select')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('While Using the App')}</Caption>
                                        </StepRow>
                                        <StepRow
                                            number="5"
                                            hint={t('This saves your photos as PNGs instead of Apple\'s more complicated HEIC format.')}>
                                            {'Recommended: '}<Caption family="semiBold" style={styles.stepText}>{'Settings'}</Caption>{' → '}<Caption family="semiBold" style={styles.stepText}>{'Camera'}</Caption>{' → '}<Caption family="semiBold" style={styles.stepText}>{'Formats'}</Caption>{' → select '}<Caption family="semiBold" style={styles.stepText}>{'Most Compatible'}</Caption>
                                        </StepRow>
                                    </>
                                ) : (
                                    <>
                                        <StepRow number="1">
                                            {t('Open your')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Camera app')}</Caption>
                                        </StepRow>
                                        <StepRow number="2">
                                            {t('Tap')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Settings (gear icon)')}</Caption>
                                        </StepRow>
                                        <StepRow number="3">
                                            {t('Find')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Location tags')}</Caption>{' '}{t('or')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('GPS tags')}</Caption>{' → '}{t('turn ON')}
                                        </StepRow>
                                        <StepRow number="4">
                                            {t('If not there:')}{' '}<Caption family="semiBold" style={styles.stepText}>{t('Settings')}</Caption>{' → '}<Caption family="semiBold" style={styles.stepText}>{t('Location')}</Caption>{' → '}{t('turn ON')}
                                        </StepRow>
                                    </>
                                )}
                            </View>
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
                                {t('Continue Tutorial')}
                            </Body>
                        </Pressable>
                        <OnboardingBackButton onPress={() => navigation.goBack()} />
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
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16
    },

    /* Header */
    header: {
        alignItems: 'center',
        marginBottom: 22
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14
    },
    title: {
        fontSize: 18,
        textAlign: 'center'
    },
    intro: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: 6,
        paddingHorizontal: 8
    },

    /* Steps card */
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3
    },
    steps: {
        gap: 14
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    stepRowPressed: {
        opacity: 0.6
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 1
    },
    badgeText: {
        fontSize: 12,
        letterSpacing: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false
    },
    stepBody: {
        flex: 1
    },
    stepText: {
        fontSize: 13,
        lineHeight: 20
    },
    stepHint: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4
    },

    /* Footer */
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 8
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

export default OnboardingInstructionsScreen;
