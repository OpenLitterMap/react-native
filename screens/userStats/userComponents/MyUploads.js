import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Pressable,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Body, Caption, Colors, Header } from '../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { clearUploads, deleteUploadPhoto, fetchUploads, fetchUploadStats } from '../../../reducers/my_uploads_reducer';
import ActionButton from '../../home/homeComponents/ActionButton';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';
import { URL } from '../../../actions/types';
import Clipboard from '@react-native-clipboard/clipboard';

import UploadCard from './myUploadsComponents/UploadCard';
import UploadStatsHeader from './myUploadsComponents/UploadStatsHeader';
import ActiveFilters from './myUploadsComponents/ActiveFilters';
import EmptyUploads from './myUploadsComponents/EmptyUploads';
import FilterSheet from './myUploadsComponents/FilterSheet';

const EMPTY_FILTERS = {
    filterTag: '',
    filterCustomTag: '',
    filterDateFrom: '',
    filterDateTo: ''
};

const MyUploads = ({ navigation }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const uploads = useSelector(state => state.my_uploads_reducer.uploads);
    const uploadStats = useSelector(state => state.my_uploads_reducer.uploadStats);

    const hasActiveFilters =
        !!filters.filterTag ||
        !!filters.filterCustomTag ||
        !!filters.filterDateFrom ||
        !!filters.filterDateTo;

    useEffect(() => {
        loadData(false);
        dispatch(fetchUploadStats({ token }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = useCallback(
        async (append = false, page = 1, overrideFilters) => {
            const f = overrideFilters || filters;

            if (!append) setLoading(true);

            await dispatch(fetchUploads({
                token,
                page,
                filterDateFrom: f.filterDateFrom,
                filterDateTo: f.filterDateTo,
                filterTag: f.filterTag,
                filterCustomTag: f.filterCustomTag,
                append
            }));

            setLoading(false);
            setRefreshing(false);
        },
        [dispatch, token, filters]
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        dispatch(clearUploads());
        dispatch(fetchUploadStats({ token }));
        loadData(false, 1);
    }, [dispatch, token, loadData]);

    const onEndReached = useCallback(() => {
        if (loadingMore || !uploads.next_page_url) return;

        setLoadingMore(true);
        const nextPage = (uploads.current_page || 1) + 1;
        loadData(true, nextPage).then(() => setLoadingMore(false));
    }, [loadingMore, uploads, loadData]);

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

    const generateLink = (item) => {
        const year = new Date(item.datetime).getFullYear();
        return `${URL}/global?year=${year}&lat=${item.lat}&lon=${item.lon}&zoom=14.59&photo=${item.id}`;
    };

    const handleCopyLink = (item) => {
        Clipboard.setString(generateLink(item));
    };

    const handleOpen = (item) => {
        Linking.openURL(generateLink(item));
    };

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
                            dispatch(deleteUploadPhoto({ token, photoId: item.id }));
                        }
                    }
                ]
            );
        },
        [dispatch, token, t]
    );

    const renderRightActions = (item) => (
        <View style={styles.actionsContainer}>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCopyLink(item)}
            >
                <Icon name="link" size={16} color="#000000" />
                <Caption style={styles.actionText}>{t('Copy Link')}</Caption>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpen(item)}
            >
                <Icon name="map" size={16} color="#000000" />
                <Caption style={styles.actionText}>{t('Show on Map')}</Caption>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item)}
            >
                <Icon name="trash-outline" size={16} color={Colors.error} />
                <Caption style={[styles.actionText, styles.deleteText]}>
                    {t('Delete')}
                </Caption>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }) => (
        <Swipeable
            renderRightActions={() => renderRightActions(item)}
        >
            <UploadCard item={item} />
        </Swipeable>
    );

    const listHeader = useMemo(
        () => (
            <>
                <UploadStatsHeader
                    totalPhotos={uploadStats?.totalPhotos || uploads?.total || user?.total_images || 0}
                    totalTags={uploadStats?.totalTags || user?.totalTags || 0}
                    totalXp={user?.xp_redis || 0}
                    leftToTag={uploadStats?.leftToTag || 0}
                />
                {hasActiveFilters && (
                    <ActiveFilters
                        filters={filters}
                        onRemoveFilter={removeFilter}
                        onClearAll={clearAllFilters}
                    />
                )}
            </>
        ),
        [uploadStats, uploads?.total, user?.total_images, user?.totalTags, user?.xp_redis, hasActiveFilters, filters, removeFilter, clearAllFilters]
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
                        My Uploads
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
                        <FlatList
                            data={uploads?.data}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderItem}
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
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    actionText: {
        color: '#000000',
        marginTop: 2
    },
    deleteButton: {
        backgroundColor: '#fff0f0'
    },
    deleteText: {
        color: Colors.error
    },
    footer: {
        paddingVertical: 16
    }
});

export default MyUploads;
