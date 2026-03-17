import React from 'react';
import {
    ActivityIndicator,
    Button,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Colors} from '../../components';
import {useTranslation} from 'react-i18next';

/**
 * Upload progress + result modal.
 * Extracted from HomeScreen to reduce orchestrator size.
 */
const UploadModal = ({
    visible,
    isUploading,
    showThankYouMessages,
    uploadPhase,
    currentUploadIndex,
    totalToUpload,
    uploaded,
    uploadFailed,
    tagged,
    taggedFailed,
    failedCounts,
    onCancel,
    onRetry,
    onClose
}) => {
    const {t} = useTranslation();
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();

    const totalFailed = uploadFailed + taggedFailed;

    const renderProgressText = () => {
        const current = currentUploadIndex + 1;
        const total = totalToUpload;
        if (uploadPhase === 'tagging') {
            return t('Tagging {{current}} of {{total}}...', {current, total});
        }
        return t('Uploading {{current}} of {{total}}...', {current, total});
    };

    const renderFailureDetails = () => {
        const items = [];
        if (failedCounts.network > 0) {
            items.push(`${failedCounts.network} ${t('failed — no internet connection')}`);
        }
        if (failedCounts.timeout > 0) {
            items.push(`${failedCounts.timeout} ${t('failed — connection timed out')}`);
        }
        if (failedCounts.server > 0) {
            items.push(`${failedCounts.server} ${t('failed — server error')}`);
        }
        if (failedCounts.alreadyUploaded > 0) {
            items.push(`${failedCounts.alreadyUploaded} ${t('already uploaded')}`);
        }
        if (failedCounts.invalidCoordinates > 0) {
            items.push(`${failedCounts.invalidCoordinates} ${t('invalid coordinates')}`);
        }
        if (failedCounts.unknown > 0) {
            items.push(`${failedCounts.unknown} ${t('failed — unknown error')}`);
        }
        return items.map((text, i) => (
            <Text key={i} style={styles.failureItem}>{text}</Text>
        ));
    };

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={isUploading ? onCancel : onClose}>
            {/* Uploading spinner */}
            {isUploading && (
                <View style={styles.modal}>
                    <Text style={[styles.uploadText, {fontSize: SCREEN_HEIGHT * 0.02}]}>
                        {totalToUpload > 0
                            ? renderProgressText()
                            : t('Please wait while your photos upload')}
                    </Text>
                    <ActivityIndicator style={{marginBottom: 10}} />
                    <Button onPress={onCancel} title={t('Cancel')} />
                </View>
            )}

            {/* Result card */}
            {showThankYouMessages && (
                <View style={styles.modal}>
                    <View style={[styles.resultCard, {width: SCREEN_WIDTH * 0.8}]}>
                        {totalFailed === 0 && (
                            <>
                                <Icon name="checkmark-circle" size={48} color={Colors.accent} style={{marginBottom: 8}} />
                                <Text style={styles.resultTitle}>{t('Thank you!!!')}</Text>
                            </>
                        )}

                        {totalFailed > 0 && (
                            <>
                                <Icon name="alert-circle" size={48} color="#f59e0b" style={{marginBottom: 8}} />
                                <Text style={styles.resultTitle}>{t('Upload incomplete')}</Text>
                            </>
                        )}

                        <View style={styles.resultStats}>
                            {uploaded > 0 ? (
                                <View style={styles.resultStatItem}>
                                    <Text style={styles.resultStatNumber}>{uploaded}</Text>
                                    <Text style={styles.resultStatLabel}>
                                        {uploaded === 1 ? t('photo uploaded') : t('photos uploaded')}
                                    </Text>
                                </View>
                            ) : tagged > 0 ? (
                                <View style={styles.resultStatItem}>
                                    <Text style={styles.resultStatNumber}>{tagged}</Text>
                                    <Text style={styles.resultStatLabel}>
                                        {tagged === 1 ? t('tag added') : t('tags added')}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {totalFailed > 0 && (
                            <View style={styles.resultFailure}>
                                <Text style={styles.resultFailureTitle}>
                                    {totalFailed} {totalFailed === 1 ? t('item') : t('items')} {t('failed')}
                                </Text>
                                {renderFailureDetails()}
                            </View>
                        )}

                        <View style={styles.resultButtons}>
                            {totalFailed > 0 && (
                                <Pressable style={styles.resultActionButton} onPress={onRetry}>
                                    <Text style={styles.resultActionText}>{t('Retry')}</Text>
                                </Pressable>
                            )}
                            <Pressable
                                style={[styles.resultActionButton, totalFailed === 0 && styles.resultCloseButtonSuccess]}
                                onPress={onClose}>
                                <Text style={[styles.resultActionText, totalFailed === 0 && styles.resultCloseTextSuccess]}>
                                    {totalFailed === 0 ? t('Done') : t('Close')}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadText: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10
    },
    resultCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center'
    },
    resultTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16
    },
    resultStats: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16
    },
    resultStatItem: {
        alignItems: 'center'
    },
    resultStatNumber: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: Colors.accent
    },
    resultStatLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: '#888888',
        marginTop: 2
    },
    resultFailure: {
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        width: '100%',
        marginBottom: 16
    },
    resultFailureTitle: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4
    },
    failureItem: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#92400e',
        marginBottom: 2
    },
    resultButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%'
    },
    resultActionButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    resultActionText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#333333'
    },
    resultCloseButtonSuccess: {
        backgroundColor: Colors.accent
    },
    resultCloseTextSuccess: {
        color: '#ffffff'
    }
});

export default React.memo(UploadModal);
