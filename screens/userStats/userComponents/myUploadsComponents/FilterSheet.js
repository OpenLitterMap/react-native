import React, { useEffect, useMemo, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { Body, Button, Caption, Colors, CustomTextInput } from '../../../components';
import { useTranslation } from 'react-i18next';
import { fetchUserLocations } from '../../../../reducers/uploads_reducer';
import { EMPTY_FILTERS } from '../MyUploads';

const VERIFIED_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Unverified', value: '0' },
    { label: 'Verified', value: '2' }
];

const PICKED_UP_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Picked up', value: '1' },
    { label: 'Not picked up', value: '0' }
];

const Pill = React.memo(({ label, selected, onPress, variant }) => (
    <Pressable
        style={[
            styles.pill,
            variant === 'select' && styles.pillSelect,
            selected && styles.pillSelected
        ]}
        onPress={onPress}
    >
        <Caption
            style={styles.pillText}
            color={selected ? 'white' : 'dark'}
        >
            {label}
        </Caption>
    </Pressable>
));

const FilterSheet = ({ visible, filters, onApply, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const userLocations = useSelector(
        state => state.uploads.userLocations
    );

    const [draft, setDraft] = useState({ ...filters });

    // Fetch locations on first open (null = never fetched, [] = fetched but empty/failed)
    useEffect(() => {
        if (visible && userLocations === null && token) {
            dispatch(fetchUserLocations());
        }
    }, [visible, userLocations, token, dispatch]);

    // Sync draft when modal opens
    useEffect(() => {
        if (visible) setDraft({ ...filters });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Derive cascading options from location tree
    const countries = useMemo(
        () => (userLocations || []).map(l => l.country).sort(),
        [userLocations]
    );

    const states = useMemo(() => {
        if (!draft.filterCountry || !userLocations) return [];
        const entry = userLocations.find(
            l => l.country === draft.filterCountry
        );
        return (entry?.states || []).map(s => s.state).sort();
    }, [userLocations, draft.filterCountry]);

    const cities = useMemo(() => {
        if (!draft.filterCountry || !draft.filterState || !userLocations) {
            return [];
        }
        const country = userLocations.find(
            l => l.country === draft.filterCountry
        );
        const state = country?.states?.find(
            s => s.state === draft.filterState
        );
        return (state?.cities || []).sort();
    }, [userLocations, draft.filterCountry, draft.filterState]);

    const setCountry = country => {
        setDraft(d => ({
            ...d,
            filterCountry: d.filterCountry === country ? '' : country,
            filterState: '',
            filterCity: ''
        }));
    };

    const setState = state => {
        setDraft(d => ({
            ...d,
            filterState: d.filterState === state ? '' : state,
            filterCity: ''
        }));
    };

    const setCity = city => {
        setDraft(d => ({
            ...d,
            filterCity: d.filterCity === city ? '' : city
        }));
    };

    const handleClear = () => {
        setDraft({ ...EMPTY_FILTERS });
        onApply({ ...EMPTY_FILTERS });
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
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

                            {/* Tag search */}
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

                            {/* Custom tag search */}
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

                            {/* Location — cascading selects */}
                            {countries.length > 0 && (
                                <>
                                    <Caption style={styles.label}>
                                        {t('Country')}
                                    </Caption>
                                    <View style={styles.selectRow}>
                                        {countries.map(c => (
                                            <Pill
                                                variant="select"
                                                key={c}
                                                label={c}
                                                selected={
                                                    draft.filterCountry === c
                                                }
                                                onPress={() => setCountry(c)}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}

                            {states.length > 0 && (
                                <>
                                    <Caption style={styles.label}>
                                        {t('State')}
                                    </Caption>
                                    <View style={styles.selectRow}>
                                        {states.map(s => (
                                            <Pill
                                                variant="select"
                                                key={s}
                                                label={s}
                                                selected={
                                                    draft.filterState === s
                                                }
                                                onPress={() => setState(s)}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}

                            {cities.length > 0 && (
                                <>
                                    <Caption style={styles.label}>
                                        {t('City')}
                                    </Caption>
                                    <View style={styles.selectRow}>
                                        {cities.map(c => (
                                            <Pill
                                                variant="select"
                                                key={c}
                                                label={c}
                                                selected={
                                                    draft.filterCity === c
                                                }
                                                onPress={() => setCity(c)}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Verification status */}
                            <Caption style={styles.label}>
                                {t('Verification')}
                            </Caption>
                            <View style={styles.pillRow}>
                                {VERIFIED_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt.value}
                                        label={t(opt.label)}
                                        selected={
                                            draft.filterVerified === opt.value
                                        }
                                        onPress={() =>
                                            setDraft(d => ({
                                                ...d,
                                                filterVerified: opt.value
                                            }))
                                        }
                                    />
                                ))}
                            </View>

                            {/* Picked up status */}
                            <Caption style={styles.label}>
                                {t('Picked up')}
                            </Caption>
                            <View style={styles.pillRow}>
                                {PICKED_UP_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt.value}
                                        label={t(opt.label)}
                                        selected={
                                            draft.filterPickedUp === opt.value
                                        }
                                        onPress={() =>
                                            setDraft(d => ({
                                                ...d,
                                                filterPickedUp: opt.value
                                            }))
                                        }
                                    />
                                ))}
                            </View>

                            {/* Date range */}
                            <View style={styles.dateRow}>
                                <View style={styles.dateCell}>
                                    <Caption style={styles.label}>
                                        {t('From')}
                                    </Caption>
                                    <DateTimePicker
                                        value={
                                            draft.filterDateFrom || new Date()
                                        }
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
                                    <Caption style={styles.label}>
                                        {t('To')}
                                    </Caption>
                                    <DateTimePicker
                                        value={
                                            draft.filterDateTo || new Date()
                                        }
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
                                <Body
                                    color="white"
                                    style={{ fontWeight: '600' }}>
                                    {t('Apply Filters')}
                                </Body>
                            </Button>

                            <Button variant="outline" onPress={handleClear}>
                                <Body
                                    color="accent"
                                    style={{ fontWeight: '600' }}>
                                    {t('Clear Filters')}
                                </Body>
                            </Button>

                            <Pressable
                                style={styles.cancelButton}
                                onPress={onClose}>
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
        maxHeight: '85%'
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
    selectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    pillRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#f0f0f0'
    },
    pillSelect: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 14
    },
    pillSelected: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent
    },
    pillText: {
        fontSize: 13,
        fontWeight: '500'
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
