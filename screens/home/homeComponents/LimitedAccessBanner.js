import React, {useCallback} from 'react';
import {Linking, Platform, Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import {openLimitedPhotoPicker} from '../../../utils/permissions/cameraRollPermission';
import {Colors} from '../../components/theme';
import {Body, Caption} from '../../components/typography';

const LimitedAccessBanner = ({permissionStatus, onRefresh}) => {
    const {t} = useTranslation();

    const isIOS = Platform.OS === 'ios';

    const handleOpenSettings = useCallback(() => {
        isIOS ? Linking.openURL('app-settings:') : Linking.openSettings();
    }, [isIOS]);

    const handleAddMore = useCallback(async () => {
        if (isIOS) {
            await openLimitedPhotoPicker();
            onRefresh?.();
        }
    }, [isIOS, onRefresh]);

    if (permissionStatus !== 'limited') return null;

    // iOS "limited" = user selected specific photos to share
    // Android "limited" = photo access granted but media-location (GPS) denied
    const bannerText = isIOS
        ? t('You chose limited photo access. Add more or grant full access in Settings.')
        : t('Photo locations are unavailable. Grant location access in Settings so uploads show where litter was found.');

    return (
        <View style={styles.banner}>
            <View style={styles.row}>
                <Icon name="leaf-outline" size={20} color={Colors.accent} />
                <Body style={styles.text}>{bannerText}</Body>
            </View>
            <View style={styles.actions}>
                <Pressable onPress={handleOpenSettings} style={styles.button}>
                    <Caption style={styles.buttonText}>{t('Open Settings')}</Caption>
                </Pressable>
                {isIOS && (
                    <Pressable onPress={handleAddMore} style={styles.button}>
                        <Caption style={styles.buttonText}>{t('Add more photos')}</Caption>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

export default LimitedAccessBanner;

const styles = StyleSheet.create({
    banner: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: Colors.accentLight,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    text: {
        fontSize: 13,
        color: Colors.text,
        marginLeft: 8,
        flex: 1
    },
    actions: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10
    },
    button: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14
    },
    buttonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600'
    }
});
