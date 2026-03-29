import React, {useState} from 'react';
import {Linking, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';
import {WEB_URL} from '../../utils/config';

const CelebrationScreen = ({navigation, route}) => {
    const serverPhotoId = route.params?.serverPhotoId;
    const lat = route.params?.lat;
    const lon = route.params?.lon;

    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [copied, setCopied] = useState(false);
    const user = useSelector(state => state.auth.user);

    const photoUrl = (serverPhotoId && lat != null && lon != null)
        ? `${WEB_URL}/global?lat=${lat}&lon=${lon}&zoom=17.89&load=true&open=true&photo=${serverPhotoId}`
        : null;

    const handleCopyLink = () => {
        if (!photoUrl) return;
        Clipboard.setString(photoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleContinue = async () => {
        await setOnboardingComplete(user?.id);
        dispatch(markOnboardingComplete());
    };

    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                <StepIndicator currentStep={3} completedSteps={[1, 2]} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.celebrationBadge}>
                        <Icon name="checkmark-circle" size={48} color={Colors.accent} />
                    </View>

                    <Title style={styles.heading}>
                        {t('You did it!')}
                    </Title>

                    <Caption color="muted" style={styles.subheading}>
                        {t('Your data point is now on the global map.')}
                    </Caption>

                    <Caption color="muted" style={styles.geolinkExplainer}>
                        {t('Every upload generates a unique geolink which you can use to share any observation with anyone.')}
                    </Caption>

                    {/* Geolink buttons */}
                    {photoUrl && (
                        <View style={styles.geolinkButtons}>
                            <Pressable
                                onPress={handleCopyLink}
                                style={({pressed}) => [
                                    styles.geolinkButton,
                                    pressed && styles.geolinkButtonPressed
                                ]}>
                                <Icon
                                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                                    size={20}
                                    color={Colors.white}
                                />
                                <Body color="white" family="semiBold" style={styles.geolinkButtonText}>
                                    {copied ? t('Copied') : t('Copy Link to Your Upload')}
                                </Body>
                            </Pressable>

                            <Pressable
                                onPress={() => Linking.openURL(photoUrl)}
                                style={({pressed}) => [
                                    styles.geolinkButton,
                                    styles.geolinkButtonOutline,
                                    pressed && styles.geolinkButtonPressed
                                ]}>
                                <Icon name="map-outline" size={20} color={Colors.accent} />
                                <Body color="accent" family="semiBold" style={styles.geolinkButtonText}>
                                    {t('Show Upload on the Map')}
                                </Body>
                            </Pressable>
                        </View>
                    )}

                    {/* Tip */}
                    <View style={styles.tipCard}>
                        <Caption color="accent" family="semiBold" style={styles.tipLabel}>
                            {t('Tip')}
                        </Caption>
                        <Caption color="muted" style={styles.tipText}>
                            {t('Take a photo of bags of litter picked up and share the link with your local council!')}
                        </Caption>
                    </View>
                </ScrollView>

                {/* CTA */}
                <View style={styles.footer}>
                    <Pressable
                        onPress={handleContinue}
                        style={({pressed}) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed
                        ]}>
                        <Body family="semiBold" color="white" style={styles.primaryButtonText}>
                            {t('Continue')}
                        </Body>
                    </Pressable>
                </View>
            </SafeAreaView>
        </LinearGradient>
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
        paddingTop: 8
    },
    celebrationBadge: {
        marginBottom: 12
    },
    heading: {
        textAlign: 'center',
        marginBottom: 8
    },
    subheading: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8
    },
    geolinkExplainer: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
        paddingHorizontal: 8
    },
    geolinkButtons: {
        width: '100%',
        gap: 12,
        marginBottom: 20
    },
    geolinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        height: 48
    },
    geolinkButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.accent
    },
    geolinkButtonPressed: {
        opacity: 0.8
    },
    geolinkButtonText: {
        fontSize: 15
    },
    tipCard: {
        width: '100%',
        backgroundColor: Colors.accentLight,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16
    },
    tipLabel: {
        fontSize: 13,
        marginBottom: 4
    },
    tipText: {
        fontSize: 13,
        lineHeight: 20
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

export default CelebrationScreen;
