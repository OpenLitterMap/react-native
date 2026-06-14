import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Caption, Colors} from '../../components';

/**
 * Subtle "Go Back" affordance for the BOTTOM of onboarding screens (the
 * top-of-screen chevron was too easy to miss). Centered chevron + label,
 * muted so it never competes with the primary CTA above it.
 */
const OnboardingBackButton = ({onPress}) => {
    const {t} = useTranslation();
    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            style={({pressed}) => [styles.button, pressed && styles.pressed]}>
            <Icon name="chevron-back" size={16} color={Colors.muted} />
            <Caption color="muted" style={styles.text}>
                {t('Go Back')}
            </Caption>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24
    },
    pressed: {
        opacity: 0.5
    },
    text: {
        fontSize: 13
    }
});

export default OnboardingBackButton;
