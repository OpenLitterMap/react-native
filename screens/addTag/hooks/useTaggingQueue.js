import {useCallback, useEffect, useMemo, useRef} from 'react';
import {Alert, InteractionManager} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {
    changeSwiperIndex,
    clearEditingPhoto,
    commitDraftToPhoto,
    removeEditingPhoto
} from '../../../reducers/photos_reducer';
import {editTagsOnPhoto, fetchAndLoadUntagged} from '../../../reducers/server_photos_reducer';
import {deleteUploadPhoto} from '../../../reducers/uploads_reducer';
import {fetchAllTags} from '../../../reducers/tags_reducer';
import {isTagged} from '../../../utils/isTagged';
import {isValidGpsCoords} from '../../../utils/gps';
import buildTagsPayload from '../../../utils/buildTagsPayload';

const EMPTY_ARRAY = [];

/**
 * Queue layer — owns which photo is active, prefetching, trimming, save/delete/advance.
 *
 * Save/done callbacks accept a `getDraft` function from the caller so the queue
 * always saves from the current draft state, never from stale Redux photo objects.
 */
export default function useTaggingQueue(navigation) {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const editingPhotos = useSelector(state => state.photos.editingPhotos) ?? EMPTY_ARRAY;
    const galleryImages = useSelector(state => state.photos.imagesArray);
    const rawSwiperIndex = useSelector(state => state.photos.swiperIndex);
    const untaggedCount = useSelector(state => state.serverPhotos.untaggedCount);
    const tagsFetchStatus = useSelector(state => state.tags.fetchStatus);
    const objectEntriesLength = useSelector(state => state.tags.objectEntries?.length ?? 0);

    const isEditMode = editingPhotos.length > 0;

    // Gallery mode shows exactly what the HomeScreen "Your Photos" grid shows:
    // local, non-uploaded, geotagged photos, newest-first. Keeping the tagger's
    // swipe order identical to the grid (and excluding already-uploaded retry
    // photos the grid hides) means tapping a photo then swiping never reorders
    // unexpectedly or dead-ends on a photo that isn't in the grid.
    const galleryView = useMemo(
        () =>
            galleryImages
                .filter(p => p && !p.uploaded && isValidGpsCoords(p.lat, p.lon))
                .sort((a, b) => (b.date ?? 0) - (a.date ?? 0)),
        [galleryImages]
    );

    const photos = isEditMode ? editingPhotos : galleryView;

    // swiperIndex is a REAL index into the source list — editingPhotos in edit
    // mode, the raw imagesArray in gallery mode. That's what the inbox tap and
    // camera capture set, and what tag writes (commitDraftToPhoto) index into.
    // We translate between it and the display position so navigation follows the
    // sorted view while commits still hit the right imagesArray entry.
    const sourceList = isEditMode ? editingPhotos : galleryImages;
    const realIndex = sourceList.length > 0
        ? Math.max(0, Math.min(rawSwiperIndex, sourceList.length - 1))
        : 0;
    const activePhoto = sourceList[realIndex];

    // Display position of the active photo (drives the pager + progress dots).
    const activeIndex = isEditMode
        ? realIndex
        : Math.max(0, photos.findIndex(p => p && activePhoto && p.id === activePhoto.id));

    // Fetch tags on mount if not loaded
    useEffect(() => {
        if (objectEntriesLength === 0 && tagsFetchStatus !== 'loading') {
            dispatch(fetchAllTags());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Safety-net: if we're near the end and the initial fetch missed pages,
    // fetch more. All metadata is loaded upfront by fetchAllUntaggedPhotos,
    // so this should rarely fire.
    const prefetchingRef = useRef(false);
    useEffect(() => {
        if (!isEditMode) return;

        if (
            activeIndex >= editingPhotos.length - 5 &&
            untaggedCount != null &&
            editingPhotos.length < untaggedCount &&
            !prefetchingRef.current
        ) {
            prefetchingRef.current = true;
            dispatch(fetchAndLoadUntagged({perPage: 20})).finally(() => {
                prefetchingRef.current = false;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, isEditMode]);

    // Navigation — index update only. newIndex is a DISPLAY position; in gallery
    // mode the display list is sorted/filtered, so translate it back to the real
    // imagesArray index before storing it as swiperIndex.
    const goToIndex = useCallback(
        newIndex => {
            const clamped = Math.max(0, Math.min(newIndex, photos.length - 1));
            let realTarget = clamped;
            if (!isEditMode) {
                const target = photos[clamped];
                const found = target ? galleryImages.findIndex(p => p.id === target.id) : -1;
                realTarget = found >= 0 ? found : clamped;
            }
            if (__DEV__) console.log('[Queue] goToIndex display:', clamped, '→ real:', realTarget, 'of', photos.length);
            dispatch(changeSwiperIndex(realTarget));
        },
        [dispatch, isEditMode, photos, galleryImages]
    );

    const goNext = useCallback(
        () => goToIndex(activeIndex + 1),
        [goToIndex, activeIndex]
    );

    const goPrev = useCallback(
        () => goToIndex(activeIndex - 1),
        [goToIndex, activeIndex]
    );

    const allTagged = useMemo(
        () => !isEditMode && photos.length > 0 && photos.every(img => img && isTagged(img)),
        [photos, isEditMode]
    );

    const hasNavigatedBackRef = useRef(false);

    // Defer goBack to next frame so Fabric reconciliation settles before unmount.
    // Without this, Redux dispatch + immediate goBack crashes Fabric's view recycler.
    // Guard with hasNavigatedBackRef so multiple callers (done button + empty-photos
    // effect) don't fire goBack twice — the second would hit "GO_BACK not handled".
    const safeGoBack = useCallback(() => {
        if (hasNavigatedBackRef.current) return;
        hasNavigatedBackRef.current = true;
        InteractionManager.runAfterInteractions(() => {
            navigation.goBack();
        });
    }, [navigation]);

    // If no images, redirect back (one-shot, guarded inside safeGoBack).
    // Declared after safeGoBack so the dependency array doesn't read it in the
    // temporal dead zone (a ReferenceError under Hermes' native `const`).
    useEffect(() => {
        if (photos.length === 0) {
            safeGoBack();
        }
    }, [photos.length, safeGoBack]);

    // Advance queue or close screen
    const advanceOrClose = useCallback(() => {
        if (__DEV__) console.log('[Queue] advanceOrClose editingCount:', editingPhotos.length, 'photoId:', activePhoto?.id);
        if (!activePhoto?.id) {
            dispatch(clearEditingPhoto());
            safeGoBack();
            return;
        }

        if (editingPhotos.length > 1) {
            dispatch(removeEditingPhoto(activePhoto.id));
            dispatch(fetchAndLoadUntagged({perPage: 3}));
        } else {
            dispatch(clearEditingPhoto());
            safeGoBack();
        }
    }, [dispatch, editingPhotos.length, activePhoto?.id, safeGoBack]);

    /**
     * Commit the current draft to the active photo in Redux before navigating.
     * getDraft returns { currentTags, currentCustomTags } from useTagDraft.
     */
    const commitDraft = useCallback((getDraft) => {
        const {currentTags, currentCustomTags} = getDraft();
        if (__DEV__) console.log(
            '[Queue] commitDraft mode:',
            isEditMode ? 'edit' : 'gallery',
            'index:',
            activeIndex,
            'tags:',
            currentTags?.length,
            'custom:',
            currentCustomTags?.length
        );
        // Commit by the REAL source-list index (the display position diverges in
        // gallery mode); realIndex === activeIndex in edit mode.
        dispatch(commitDraftToPhoto({
            imageIndex: realIndex,
            tags: currentTags,
            customTags: currentCustomTags
        }));
    }, [dispatch, realIndex, activeIndex, isEditMode]);

    /**
     * Save tags to server (edit mode).
     * Builds payload from the draft, not from the stale activePhoto.
     * getDraft returns { currentTags, currentCustomTags }.
     */
    const saveCurrent = useCallback(async (getDraft, setIsSavingFn) => {
        if (!activePhoto?.photoId) {
            if (__DEV__) console.warn('[Queue] saveCurrent skipped — no photoId');
            return;
        }

        const {currentTags, currentCustomTags} = getDraft();
        if (__DEV__) console.log('[Queue] saveCurrent photoId:', activePhoto.photoId, 'tags:', currentTags?.length, 'custom:', currentCustomTags?.length);
        const payload = buildTagsPayload({tags: currentTags, customTags: currentCustomTags});
        if (!payload || payload.length === 0) {
            Alert.alert(t('Error!'), t('Please add at least one tag before saving.'));
            return;
        }

        setIsSavingFn(true);
        try {
            const result = await dispatch(editTagsOnPhoto({
                photoId: activePhoto.photoId,
                tags: payload
            }));

            if (result.meta?.requestStatus === 'rejected') {
                Alert.alert(t('Error!'), t('Failed to update tags. Please try again.'));
            } else {
                advanceOrClose();
            }
        } finally {
            setIsSavingFn(false);
        }
    }, [dispatch, activePhoto?.photoId, advanceOrClose, t]);

    // Delete photo (edit mode)
    const deleteCurrent = useCallback(async () => {
        if (!activePhoto?.photoId) return;

        Alert.alert(
            t('Delete Photo'),
            t('This will permanently delete this photo from the server.'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {
                    text: t('Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const result = await dispatch(
                            deleteUploadPhoto({photoId: activePhoto.photoId})
                        );
                        if (result.meta?.requestStatus === 'fulfilled') {
                            advanceOrClose();
                        } else {
                            Alert.alert(t('Error'), t('Failed to delete photo.'));
                        }
                    }
                }
            ]
        );
    }, [dispatch, activePhoto, advanceOrClose, t]);

    /**
     * "Done" / "Next" button logic.
     * getDraft returns { currentTags, currentCustomTags } from useTagDraft.
     *
     * Edit mode: save draft to server, then advance.
     * Gallery mode: commit draft to Redux photo, then advance/close.
     */
    const handleDone = useCallback((getDraft, setIsSavingFn) => {
        if (isEditMode) {
            saveCurrent(getDraft, setIsSavingFn);
            return;
        }

        // Gallery mode: commit draft to local photo state before advancing
        commitDraft(getDraft);

        // Check allTagged using fresh draft — the Redux commit above is synchronous
        // but `allTagged` from the closure is stale. Check the draft directly to see
        // if the CURRENT image now has tags (which means all might be tagged).
        const draftState = getDraft();
        const currentHasTags = (draftState.currentTags?.length > 0) ||
            (draftState.currentCustomTags?.length > 0);

        // If current image now has tags and all OTHER images already had tags, we're done
        const othersTagged = photos.every((img, i) =>
            i === activeIndex || !img || isTagged(img)
        );

        if (currentHasTags && othersTagged) {
            if (__DEV__) console.log('[Queue] all tagged — navigating back');
            safeGoBack();
        } else if (activeIndex < photos.length - 1) {
            goToIndex(activeIndex + 1);
        } else {
            const firstUntagged = photos.findIndex((img, i) =>
                i !== activeIndex && img && !isTagged(img)
            );
            if (firstUntagged !== -1) {
                goToIndex(firstUntagged);
            } else {
                // All tagged (including current via draft)
                if (__DEV__) console.log('[Queue] all tagged (fallback) — navigating back');
                safeGoBack();
            }
        }
    }, [isEditMode, saveCurrent, commitDraft, goToIndex, safeGoBack, activeIndex, photos]);

    return {
        photos,
        activePhoto,
        activeIndex,
        isEditMode,
        untaggedCount,
        allTagged,
        goToIndex,
        goNext,
        goPrev,
        commitDraft,
        saveCurrent,
        deleteCurrent,
        handleDone,
        advanceOrClose
    };
}
