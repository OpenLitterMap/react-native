import React from 'react';
import {Image, Pressable, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';

/**
 * Post-signup welcome screen.
 * Deliberately minimal — states the first challenge and offers two choices:
 *   - "Begin Tutorial" → instructions screen → choose path → first upload
 *   - "Skip" → mark onboarding complete and drop into the app
 */
const OnboardingWelcomeScreen = ({navigation}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const userId = useSelector(state => state.auth.user?.id);

    const handleSkip = async () => {
        await setOnboardingComplete(userId);
        dispatch(markOnboardingComplete());
    };

    return (
        <>
            <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                    <View style={styles.content}>
                        <View style={styles.visualContainer}>
                            <Image
                                source={require('../../assets/illustrations/click_image.png')}
                                style={styles.visual}
                            />
                        </View>

                        <Title style={styles.heading}>
                            {t('Welcome!')}
                        </Title>

                        <Body color="muted" style={styles.challenge}>
                            {t('Your first challenge is to upload your first data point. Can you record 1 piece of picked up litter, or make 1 community observation, and upload it?')}
                        </Body>
                    </View>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={() => navigation.navigate('ONBOARDING_INSTRUCTIONS')}
                            style={({pressed}) => [
                                styles.primaryButton,
                                pressed && styles.primaryButtonPressed
                            ]}>
                            <Body
                                family="semiBold"
                                color="white"
                                style={styles.primaryButtonText}>
                                {t('Begin Tutorial')}
                            </Body>
                        </Pressable>

                        <Pressable onPress={handleSkip} style={styles.skipLink}>
                            <Caption color="muted">
                                {t('Skip')}
                            </Caption>
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
        paddingHorizontal: 24
    },
    visualContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28
    },
    visual: {
        width: 120,
        height: 120,
        resizeMode: 'contain'
    },
    heading: {
        textAlign: 'center',
        marginBottom: 16
    },
    challenge: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24
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
    },
    skipLink: {
        marginTop: 16,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24
    }
});

export default OnboardingWelcomeScreen;
