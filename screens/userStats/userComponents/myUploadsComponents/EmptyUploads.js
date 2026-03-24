import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Caption, Colors } from '../../../components';
import { useTranslation } from 'react-i18next';

const EmptyUploads = ({ hasFilters, onClearFilters }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <Icon
                name="camera-outline"
                size={48}
                color={Colors.muted}
                style={styles.icon}
            />
            <Body style={styles.title}>
                {hasFilters
                    ? t('No matching uploads')
                    : t('No uploads yet')}
            </Body>
            {hasFilters ? (
                <Pressable onPress={onClearFilters}>
                    <Body style={styles.clearButton} color="accent">
                        {t('Clear Filters')}
                    </Body>
                </Pressable>
            ) : (
                <Caption>
                    {t('Start photographing litter to see your uploads here')}
                </Caption>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80
    },
    icon: {
        marginBottom: 12
    },
    title: {
        fontWeight: '600',
        marginBottom: 8
    },
    clearButton: {
        fontWeight: '600'
    }
});

export default EmptyUploads;
