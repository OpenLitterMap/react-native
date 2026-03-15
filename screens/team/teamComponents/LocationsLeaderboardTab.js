import React, {useEffect, useMemo, useState} from 'react';
import {View, StyleSheet, ActivityIndicator, TextInput, Pressable} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Colors, Body, Caption} from '../../components';
import {
    fetchCountries,
    fetchLocationChildren,
    goBackLocation
} from '../../../reducers/locations_reducer';
import LocationListCard from './LocationListCard';

const LEVEL_TYPES = ['country', 'state', 'city'];

const LocationsLeaderboardTab = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const countries = useSelector(state => state.locations.countries);
    const countriesStatus = useSelector(state => state.locations.countriesStatus);
    const children = useSelector(state => state.locations.children);
    const childrenStatus = useSelector(state => state.locations.childrenStatus);
    const locationStack = useSelector(state => state.locations.locationStack);
    const [search, setSearch] = useState('');

    const depth = locationStack.length;
    const isAtRoot = depth === 0;
    const currentType = LEVEL_TYPES[depth] || 'city';
    const parentName = isAtRoot ? null : locationStack[depth - 1]?.name;

    useEffect(() => {
        if (countriesStatus === 'idle') {
            dispatch(fetchCountries());
        }
    }, []);

    const rawData = isAtRoot ? countries : children;
    const data = Array.isArray(rawData) ? rawData : [];
    const status = isAtRoot ? countriesStatus : childrenStatus;

    const filteredData = useMemo(() => {
        const sorted = [...data].sort(
            (a, b) =>
                (b.tags || b.total_tags || 0) - (a.tags || a.total_tags || 0)
        );
        if (!search.trim()) return sorted;
        const term = search.trim().toLowerCase();
        return sorted.filter(c =>
            (c.name || c.country || '').toLowerCase().includes(term)
        );
    }, [data, search]);

    const handlePress = item => {
        if (currentType === 'city') return;
        setSearch('');
        dispatch(
            fetchLocationChildren({
                type: currentType,
                id: item.id,
                name: item.name || item.country
            })
        );
    };

    const handleBack = () => {
        setSearch('');
        dispatch(goBackLocation());
    };

    if (status === 'loading' || (status === 'idle' && data.length === 0)) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.accent} />
            </View>
        );
    }

    if (status === 'failed') {
        return (
            <View style={styles.loadingContainer}>
                <Body color="muted">{t('No location data available')}</Body>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!isAtRoot && (
                <Pressable style={styles.backRow} onPress={handleBack}>
                    <Icon
                        name="chevron-back-outline"
                        size={18}
                        color={Colors.accent}
                    />
                    <Body color="accent" style={styles.backText}>
                        {parentName}
                    </Body>
                </Pressable>
            )}

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={t(isAtRoot ? 'Search countries...' : currentType === 'state' ? 'Search states...' : 'Search cities...')}
                    placeholderTextColor={Colors.muted}
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                />
            </View>

            <FlashList
                data={filteredData}
                renderItem={({item, index}) => (
                    <LocationListCard
                        location={item}
                        index={index}
                        onPress={currentType !== 'city' ? () => handlePress(item) : undefined}
                    />
                )}
                keyExtractor={item => `location-${item.id}`}
                estimatedItemSize={80}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Body color="muted">{t('No results')}</Body>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        paddingTop: 40,
        alignItems: 'center'
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4
    },
    backText: {
        fontSize: 15,
        marginLeft: 4
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4
    },
    searchInput: {
        backgroundColor: '#f3f4f6',
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 20
    }
});

export default LocationsLeaderboardTab;
