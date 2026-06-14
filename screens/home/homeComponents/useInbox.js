import {useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {selectInboxPhotos, selectTaggedUris, deleteImage} from '../../../reducers/photos_reducer';

/**
 * Inbox state for the "Your Photos" queue. Photos are local, not-yet-uploaded
 * camera captures + picker imports (all geotagged) read from photos.imagesArray.
 * Lifted out of InboxSection so HomeScreen's virtualized list shares one
 * selection state between the header controls and the grid items.
 */
export default function useInbox(onTapPhoto) {
    const dispatch = useDispatch();

    const recentPhotos = useSelector(selectInboxPhotos);
    const taggedUris = useSelector(selectTaggedUris);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedUris, setSelectedUris] = useState(new Set());

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
        for (const photo of recentPhotos) {
            if (selectedUris.has(photo.uri)) {
                dispatch(deleteImage(photo.id));
            }
        }
        setSelectedUris(new Set());
        setIsSelecting(false);
    }, [dispatch, selectedUris, recentPhotos]);

    return {
        visiblePhotos: recentPhotos,
        taggedUris,
        isSelecting,
        selectedUris,
        handlePhotoPress,
        handleToggleDelete,
        handleDeleteSelected
    };
}
