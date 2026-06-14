import React from 'react';
import {Pressable, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import OnboardingBackButton from './components/OnboardingBackButton';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';

/**
 * Choose your path: "Take a photo now" or "Choose from photos."
 * Both buttons are equal weight. Tapping either triggers the relevant permission flow.
 */
const ChoosePathScreen = ({navigation}) => {
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
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
                    <StepIndicator currentStep={1} />

                    <View style={styles.content}>
                        <Title style={styles.heading}>
                            {t('How do you want to start?')}
                        </Title>

                        <View style={styles.buttons}>
                            <Pressable
                                onPress={() => navigation.navigate('ONBOARDING_PERMISSION', {path: 'camera'})}
                                style={({pressed}) => [
                                    styles.pathButton,
                                    pressed && styles.pathButtonPressed
                                ]}>
                                <View style={styles.iconCircle}>
                                    <Icon name="camera-outline" size={32} color={Colors.accent} />
                                </View>
                                <Body family="semiBold" style={styles.pathLabel}>
                                    {t('Take a photo now')}
                                </Body>
                            </Pressable>

                            <Pressable
                                onPress={() => navigation.navigate('ONBOARDING_PHOTO', {path: 'gallery'})}
                                style={({pressed}) => [
                                    styles.pathButton,
                                    pressed && styles.pathButtonPressed
                                ]}>
                                <View style={styles.iconCircle}>
                                    <Icon name="images-outline" size={32} color={Colors.accent} />
                                </View>
                                <Body family="semiBold" style={styles.pathLabel}>
                                    {t('Choose from photos')}
                                </Body>
                            </Pressable>
                        </View>

                        <Pressable onPress={handleSkip} style={styles.skipLink}>
                            <Caption color="muted">
                                {t('Skip for now')}
                            </Caption>
                        </Pressable>
                    </View>
                    <OnboardingBackButton onPress={() => navigation.goBack()} />
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
        paddingHorizontal: 24
    },
    heading: {
        textAlign: 'center',
        marginBottom: 40
    },
    buttons: {
        gap: 16
    },
    pathButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    pathButtonPressed: {
        backgroundColor: '#f8f8f8',
        shadowOpacity: 0.04
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    pathLabel: {
        fontSize: 17,
        flex: 1
    },
    skipLink: {
        marginTop: 32,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24
    }
});

export default ChoosePathScreen;
