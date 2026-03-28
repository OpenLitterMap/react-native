import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import {Colors} from '../../components';
import {fetchUploads, deleteUploadPhoto} from '../../../reducers/uploads_reducer';
import {loadPhotoForEditing, changeSwiperIndex, clearEditingPhoto} from '../../../reducers/photos_reducer';
import {URL} from '../../../actions/types';
import UploadCard from '../../userStats/userComponents/myUploadsComponents/UploadCard';

const INITIAL_COUNT = 3;
const EXPANDED_COUNT = 12;
const BRAND = '#27ae60';
const TEXT_SECONDARY = '#888888';

const UploadsPreview = ({navigation}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const uploads = useSelector(state => state.uploads.uploads);
    const loading = useSelector(state => state.uploads.loading);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        dispatch(fetchUploads({page: 1, filters: {}}));
    }, [dispatch]);

    const data = uploads?.data || [];
    const visibleCount = expanded ? EXPANDED_COUNT : INITIAL_COUNT;
    const visibleData = data.slice(0, visibleCount);
    const hasMore = data.length > visibleCount || uploads?.next_page_url;

    const handleEditTags = useCallback((item) => {
        dispatch(clearEditingPhoto());
        dispatch(changeSwiperIndex(0));
        dispatch(loadPhotoForEditing({photo: item}));
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation]);

    const handleDelete = useCallback((item) => {
        Alert.alert(
            t('Delete Photo'),
            t('Are you sure you want to delete this photo? This cannot be undone.'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {
                    text: t('Yes, Delete'),
                    style: 'destructive',
                    onPress: () => dispatch(deleteUploadPhoto({photoId: item.id}))
                }
            ]
        );
    }, [dispatch, t]);

    const handleCopyLink = useCallback((item) => {
        const year = new Date(item.datetime).getFullYear();
        const link = `${URL}/global?year=${year}&lat=${item.lat}&lon=${item.lon}&zoom=14.59&photo=${item.id}`;
        Clipboard.setString(link);
        Alert.alert(t('Link Copied'), t('The link has been copied to your clipboard.'));
    }, [t]);

    const handleOpenMap = useCallback((item) => {
        const year = new Date(item.datetime).getFullYear();
        const link = `${URL}/global?year=${year}&lat=${item.lat}&lon=${item.lon}&zoom=14.59&photo=${item.id}`;
        Linking.openURL(link);
    }, []);

    if (loading && data.length === 0) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('My Uploads')}</Text>
                <ActivityIndicator size="small" color={Colors.accent} style={styles.loader} />
            </View>
        );
    }

    if (data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('My Uploads')}</Text>
            {visibleData.map(item => (
                <UploadCard
                    key={item.id}
                    item={item}
                    onEditTags={handleEditTags}
                    onDelete={handleDelete}
                    onCopyLink={handleCopyLink}
                    onOpenMap={handleOpenMap}
                />
            ))}
            {!expanded && data.length > INITIAL_COUNT && (
                <Pressable onPress={() => setExpanded(true)} style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>{t('Load More')}</Text>
                </Pressable>
            )}
            {expanded && hasMore && (
                <Pressable
                    onPress={() => navigation.navigate('MY_UPLOADS')}
                    style={styles.viewAllButton}
                >
                    <Text style={styles.viewAllText}>{t('View All')}</Text>
                    <Icon name="chevron-forward" size={16} color={BRAND} />
                </Pressable>
            )}
        </View>
    );
};

export default UploadsPreview;

const styles = StyleSheet.create({
    section: {
        paddingBottom: 40
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: '#bbbbbb',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 8
    },
    loader: {
        paddingVertical: 20
    },
    showMoreButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 10,
        backgroundColor: '#f0f0f0'
    },
    showMoreText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: TEXT_SECONDARY
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: BRAND
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: BRAND
    }
});
