import {useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {selectGeotaggedPhotos, getPhotosFromCameraroll, dismissPhotos} from '../../../reducers/gallery_reducer';
import {deleteImage, selectTaggedUris, selectCameraPhotos} from '../../../reducers/photos_reducer';

// "Your Photos" shows a compact preview, expanded on demand via "Load more".
const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 50;

/**
 * Inbox state, lifted out of InboxSection so HomeScreen's virtualized list can
 * share it: the header controls (select/delete) and the grid items both read the
 * same selection state. Shows INITIAL_VISIBLE geotagged photos, then LOAD_MORE_STEP
 * more per "Load more" tap (paging the camera roll 50 at a time when needed).
 */
export default function useInbox(onTapPhoto) {
    const dispatch = useDispatch();

    const allGeotaggedPhotos = useSelector(selectGeotaggedPhotos);
    const totalGalleryPhotos = useSelector(state => state.gallery.galleryImages.length);
    const hasMorePages = useSelector(state => state.gallery.hasMorePages);
    const fetchStatus = useSelector(state => state.gallery.fetchStatus);
    const isLoading = fetchStatus === 'loading';
    const taggedUris = useSelector(selectTaggedUris);
    const cameraPhotos = useSelector(selectCameraPhotos);
    const uploadedUris = useSelector(state => state.photos.uploadedUris);

    // Filter out uploaded photos, then prepend camera captures
    const recentPhotos = useMemo(() => {
        const uploaded = new Set(uploadedUris || []);
        const cameraUris = new Set(cameraPhotos.map(p => p.uri));
        const filtered = allGeotaggedPhotos.filter(
            p => !uploaded.has(p.uri) && !cameraUris.has(p.uri)
        );
        return [...cameraPhotos, ...filtered];
    }, [allGeotaggedPhotos, uploadedUris, cameraPhotos]);

    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const visiblePhotos = useMemo(
        () => recentPhotos.slice(0, visibleCount),
        [recentPhotos, visibleCount]
    );
    const hasMoreToShow = recentPhotos.length > visibleCount || hasMorePages;

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedUris, setSelectedUris] = useState(new Set());

    // Reveal LOAD_MORE_STEP more; page the camera roll (50/page) when we don't
    // already have enough loaded to fill the new count.
    const handleLoadMore = useCallback(() => {
        setVisibleCount(v => v + LOAD_MORE_STEP);
        if (hasMorePages && !isLoading) {
            dispatch(getPhotosFromCameraroll('LOAD'));
        }
    }, [dispatch, hasMorePages, isLoading]);

    const handlePhotoPress = useCallback((photo) => {
        if (isSelecting) {
            setSelectedUris(prev => {
                const next = new Set(prev);
                if (next.has(photo.uri)) {
                    next.delete(photo.uri);
                } else {
                    next.add(photo.uri);
                }
                return next;
            });
        } else {
            onTapPhoto(photo);
        }
    }, [isSelecting, onTapPhoto]);

    const handleToggleDelete = useCallback(() => {
        setIsSelecting(prev => !prev);
        setSelectedUris(new Set());
    }, []);

    const handleDeleteSelected = useCallback(() => {
        if (selectedUris.size === 0) return;
        dispatch(dismissPhotos([...selectedUris]));
        for (const img of cameraPhotos) {
            if (selectedUris.has(img.uri)) {
                dispatch(deleteImage(img.id));
            }
        }
        setSelectedUris(new Set());
        setIsSelecting(false);
    }, [dispatch, selectedUris, cameraPhotos]);

    return {
        visiblePhotos,
        hasMoreToShow,
        totalGalleryPhotos,
        hasMorePages,
        isLoading,
        taggedUris,
        isSelecting,
        selectedUris,
        handleLoadMore,
        handlePhotoPress,
        handleToggleDelete,
        handleDeleteSelected
    };
}
