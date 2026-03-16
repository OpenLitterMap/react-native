import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Body, Colors, Header } from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { clearUploads, deleteUploadPhoto, fetchUploads } from '../../../reducers/uploads_reducer';
import { loadPhotoForEditing } from '../../../reducers/images_reducer';
import ActionButton from '../../home/homeComponents/ActionButton';
import { useTranslation } from 'react-i18next';
import { URL } from '../../../actions/types';
import Clipboard from '@react-native-clipboard/clipboard';

import UploadCard from './myUploadsComponents/UploadCard';
import ActiveFilters from './myUploadsComponents/ActiveFilters';
import EmptyUploads from './myUploadsComponents/EmptyUploads';
import FilterSheet from './myUploadsComponents/FilterSheet';

export const EMPTY_FILTERS = {
    filterTag: '',
    filterCustomTag: '',
    filterDateFrom: '',
    filterDateTo: '',
    filterCountry: '',
    filterState: '',
    filterCity: '',
    filterVerified: '',
    filterPickedUp: ''
};

const MyUploads = ({ navigation }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadingMoreRef = useRef(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

    const user = useSelector(state => state.auth.user);
    const uploads = useSelector(state => state.uploads.uploads);
    const hasActiveFilters =
        !!filters.filterTag ||
        !!filters.filterCustomTag ||
        !!filters.filterDateFrom ||
        !!filters.filterDateTo ||
        !!filters.filterCountry ||
        !!filters.filterState ||
        !!filters.filterCity ||
        filters.filterVerified !== '' ||
        filters.filterPickedUp !== '';

    const isInitialMount = useRef(true);

    useEffect(() => {
        loadData(false);

        // Refresh data when returning from edit screen
        const unsubscribe = navigation.addListener('focus', () => {
            if (isInitialMount.current) {
                isInitialMount.current = false;
                return;
            }
            dispatch(clearUploads());
            loadData(false, 1);
        });

        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = useCallback(
        async (append = false, page = 1, overrideFilters) => {
            const f = overrideFilters || filters;

            if (!append) setLoading(true);

            await dispatch(fetchUploads({
                page,
                filters: f,
                append
            }));

            setLoading(false);
            setRefreshing(false);
        },
        [dispatch, filters]
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        dispatch(clearUploads());
        loadData(false, 1);
    }, [dispatch, loadData]);

    const onEndReached = useCallback(() => {
        if (loadingMoreRef.current || !uploads.next_page_url) return;

        loadingMoreRef.current = true;
        setLoadingMore(true);
        const nextPage = (uploads.current_page || 1) + 1;
        loadData(true, nextPage).finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        });
    }, [uploads, loadData]);

    const applyFilters = useCallback(
        (newFilters) => {
            setFilters(newFilters);
            setShowFilter(false);
            dispatch(clearUploads());
            loadData(false, 1, newFilters);
        },
        [dispatch, loadData]
    );

    const removeFilter = useCallback(
        (key) => {
            const updated = { ...filters };
            if (key === 'filterDate') {
                updated.filterDateFrom = '';
                updated.filterDateTo = '';
            } else if (key === 'filterCountry') {
                updated.filterCountry = '';
                updated.filterState = '';
                updated.filterCity = '';
            } else if (key === 'filterState') {
                updated.filterState = '';
                updated.filterCity = '';
            } else {
                updated[key] = '';
            }
            applyFilters(updated);
        },
        [filters, applyFilters]
    );

    const clearAllFilters = useCallback(() => {
        applyFilters({ ...EMPTY_FILTERS });
    }, [applyFilters]);

    const generateLink = useCallback(item => {
        const year = new Date(item.datetime).getFullYear();
        return `${URL}/global?year=${year}&lat=${item.lat}&lon=${item.lon}&zoom=14.59&photo=${item.id}`;
    }, []);

    const handleCopyLink = useCallback((item) => {
        Clipboard.setString(generateLink(item));
        Alert.alert(t('Link Copied'), t('The link has been copied to your clipboard.'));
    }, [generateLink, t]);

    const handleEditTags = useCallback(item => {
        dispatch(loadPhotoForEditing({ photo: item }));
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation]);

    const handleOpenOnWeb = useCallback(item => {
        Linking.openURL(generateLink(item));
    }, [generateLink]);

    const handleDelete = useCallback(
        (item) => {
            Alert.alert(
                t('Delete Photo'),
                t('Are you sure you want to delete this photo? This cannot be undone.'),
                [
                    { text: t('Cancel'), style: 'cancel' },
                    {
                        text: t('Delete'),
                        style: 'destructive',
                        onPress: () => {
                            dispatch(deleteUploadPhoto({ photoId: item.id }));
                        }
                    }
                ]
            );
        },
        [dispatch, t]
    );

    const renderItem = useCallback(({ item }) => (
        <UploadCard
            item={item}
            onEditTags={handleEditTags}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
            onOpenMap={handleOpenOnWeb}
        />
    ), [handleEditTags, handleOpenOnWeb, handleDelete, handleCopyLink]);

    const listHeader = useMemo(
        () => (
            <>
                {hasActiveFilters && (
                    <ActiveFilters
                        filters={filters}
                        onRemoveFilter={removeFilter}
                        onClearAll={clearAllFilters}
                    />
                )}
            </>
        ),
        [hasActiveFilters, filters, removeFilter, clearAllFilters]
    );

    const listEmpty = useMemo(
        () =>
            loading ? null : (
                <EmptyUploads
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                />
            ),
        [loading, hasActiveFilters, clearAllFilters]
    );

    const listFooter = useMemo(
        () =>
            loadingMore ? (
                <ActivityIndicator
                    size="small"
                    color={Colors.muted}
                    style={styles.footer}
                />
            ) : null,
        [loadingMore]
    );

    return (
        <>
            <Header
                leftContent={
                    <Pressable
                        style={styles.headerBack}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-back" color="white" size={18} />
                        <Body color="white" style={{ marginLeft: 4 }}>
                            {t('Go Back')}
                        </Body>
                    </Pressable>
                }
                rightContent={
                    <Body color="white" style={{ fontWeight: '600' }}>
                        {t('My Uploads')}
                    </Body>
                }
            />

            <View style={styles.container}>
                {loading && !refreshing ? (
                    <ActivityIndicator
                        size="large"
                        color={Colors.accent}
                        style={styles.loadingSpinner}
                    />
                ) : (
                    <>
                        <FlashList
                            data={uploads?.data}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderItem}
                            estimatedItemSize={100}
                            ListHeaderComponent={listHeader}
                            ListEmptyComponent={listEmpty}
                            ListFooterComponent={listFooter}
                            onEndReached={onEndReached}
                            onEndReachedThreshold={0.5}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={Colors.accent}
                                    colors={[Colors.accent]}
                                />
                            }
                        />

                        <ActionButton
                            onPress={() => setShowFilter(true)}
                            status="FILTER"
                        />
                    </>
                )}
            </View>

            <FilterSheet
                visible={showFilter}
                filters={filters}
                onApply={applyFilters}
                onClose={() => setShowFilter(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    headerBack: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    loadingSpinner: {
        marginTop: 40
    },
    footer: {
        paddingVertical: 16
    }
});

export default MyUploads;
