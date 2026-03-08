import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Body, Button, Caption, CustomTextInput } from '../../../components';
import { useTranslation } from 'react-i18next';

const FilterSheet = ({ visible, filters, onApply, onClose }) => {
    const { t } = useTranslation();
    const [draft, setDraft] = useState({ ...filters });

    // Sync draft when modal opens
    React.useEffect(() => {
        if (visible) setDraft({ ...filters });
    }, [visible]);

    const handleClear = () => {
        const cleared = {
            filterTag: '',
            filterCustomTag: '',
            filterDateFrom: '',
            filterDateTo: ''
        };
        setDraft(cleared);
        onApply(cleared);
    };

    return (
        <Modal animationType="slide" transparent visible={visible}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Pressable style={styles.backdrop} onPress={onClose} />
                    <View style={styles.sheet}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <View style={styles.handle} />

                            <Body style={styles.title}>
                                {t('Filter Uploads')}
                            </Body>

                            <Caption style={styles.label}>
                                {t('Search by tag name')}
                            </Caption>
                            <CustomTextInput
                                variant="light"
                                leftIconName="pricetag-outline"
                                placeholder={t('Search by tag name')}
                                value={draft.filterTag}
                                onChangeText={text =>
                                    setDraft(d => ({ ...d, filterTag: text }))
                                }
                                style={styles.input}
                            />

                            <Caption style={styles.label}>
                                {t('Search by custom tag')}
                            </Caption>
                            <CustomTextInput
                                variant="light"
                                leftIconName="create-outline"
                                placeholder={t('Search by custom tag')}
                                value={draft.filterCustomTag}
                                onChangeText={text =>
                                    setDraft(d => ({
                                        ...d,
                                        filterCustomTag: text
                                    }))
                                }
                                style={styles.input}
                            />

                            <View style={styles.dateRow}>
                                <View style={styles.dateCell}>
                                    <Caption style={styles.label}>{t('From')}</Caption>
                                    <DateTimePicker
                                        value={draft.filterDateFrom || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(_, date) => {
                                            if (date)
                                                setDraft(d => ({
                                                    ...d,
                                                    filterDateFrom: date
                                                }));
                                        }}
                                    />
                                </View>
                                <View style={styles.dateCell}>
                                    <Caption style={styles.label}>{t('To')}</Caption>
                                    <DateTimePicker
                                        value={draft.filterDateTo || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(_, date) => {
                                            if (date)
                                                setDraft(d => ({
                                                    ...d,
                                                    filterDateTo: date
                                                }));
                                        }}
                                    />
                                </View>
                            </View>

                            <Button onPress={() => onApply(draft)}>
                                <Body color="white" style={{ fontWeight: '600' }}>
                                    {t('Apply Filters')}
                                </Body>
                            </Button>

                            <Button
                                variant="outline"
                                onPress={handleClear}
                            >
                                <Body color="accent" style={{ fontWeight: '600' }}>
                                    {t('Clear Filters')}
                                </Body>
                            </Button>

                            <Pressable
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Body color="muted">{t('Cancel')}</Body>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    backdrop: {
        flex: 1
    },
    sheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingBottom: 40,
        maxHeight: '80%'
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e0e0e0',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20
    },
    label: {
        marginBottom: 6,
        marginLeft: 4
    },
    input: {
        marginBottom: 16
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24
    },
    dateCell: {
        alignItems: 'center'
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 8
    }
});

export default FilterSheet;
