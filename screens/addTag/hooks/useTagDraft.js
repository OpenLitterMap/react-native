import {useCallback, useMemo, useReducer, useRef, useEffect} from 'react';
import {MAX_QUANTITY} from '../components/tagUtils';

/**
 * Local draft state for the active photo's tags.
 * All edits are local — no Redux dispatches per tap.
 * On save, caller reads currentTags/currentCustomTags or calls buildDraftPayload.
 */

const EMPTY_ARRAY = [];

// --- Draft reducer ---

function findTag(tags, cloId, typeId) {
    return tags.findIndex(
        t => t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null)
    );
}

function draftReducer(state, action) {
    switch (action.type) {
        case 'RESET': {
            return {
                tags: action.tags || [],
                customTags: action.customTags || [],
                photoId: action.photoId
            };
        }
        case 'ADD_TAG': {
            const {cloId, typeId, defaultPickedUp} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx !== -1) {
                // Increment quantity
                const tags = [...state.tags];
                const existing = {...tags[idx]};
                if (existing.quantity < MAX_QUANTITY) {
                    existing.quantity += 1;
                }
                tags[idx] = existing;
                return {...state, tags};
            }
            const tag = {
                cloId,
                quantity: 1,
                picked_up: defaultPickedUp ?? null,
                materials: [],
                brands: [],
                customTags: []
            };
            if (typeId != null) tag.typeId = typeId;
            return {...state, tags: [...state.tags, tag]};
        }
        case 'REMOVE_TAG': {
            const {cloId, typeId} = action;
            return {
                ...state,
                tags: state.tags.filter(
                    t => !(t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null))
                )
            };
        }
        case 'UPDATE_QUANTITY': {
            const {cloId, typeId, quantity} = action;
            if (quantity <= 0) {
                return draftReducer(state, {type: 'REMOVE_TAG', cloId, typeId});
            }
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            tags[idx] = {...tags[idx], quantity: Math.min(quantity, MAX_QUANTITY)};
            return {...state, tags};
        }
        case 'SET_PICKED_UP': {
            const {cloId, typeId, value} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            tags[idx] = {...tags[idx], picked_up: value};
            return {...state, tags};
        }
        case 'TOGGLE_MATERIAL': {
            const {cloId, typeId, materialId} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            const tag = {...tags[idx]};
            const materials = [...(tag.materials || [])];
            const matIdx = materials.indexOf(materialId);
            if (matIdx === -1) {
                materials.push(materialId);
            } else {
                materials.splice(matIdx, 1);
            }
            tag.materials = materials;
            tags[idx] = tag;
            return {...state, tags};
        }
        case 'ADD_BRAND': {
            const {cloId, typeId, brandId} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            const tag = {...tags[idx]};
            const brands = [...(tag.brands || [])];
            if (!brands.some(b => b.id === brandId)) {
                brands.push({id: brandId, quantity: 1});
            }
            tag.brands = brands;
            tags[idx] = tag;
            return {...state, tags};
        }
        case 'REMOVE_BRAND': {
            const {cloId, typeId, brandId} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            const tag = {...tags[idx]};
            tag.brands = (tag.brands || []).filter(b => b.id !== brandId);
            tags[idx] = tag;
            return {...state, tags};
        }
        case 'ADD_CUSTOM_TAG': {
            const {cloId, typeId, text} = action;
            const trimmed = text?.trim()?.slice(0, 100);
            if (!trimmed || trimmed.length < 3) return state;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            const tag = {...tags[idx]};
            const customs = [...(tag.customTags || [])];
            if (!customs.includes(trimmed)) {
                customs.push(trimmed);
            }
            tag.customTags = customs;
            tags[idx] = tag;
            return {...state, tags};
        }
        case 'REMOVE_CUSTOM_TAG': {
            const {cloId, typeId, text} = action;
            const idx = findTag(state.tags, cloId, typeId);
            if (idx === -1) return state;
            const tags = [...state.tags];
            const tag = {...tags[idx]};
            tag.customTags = (tag.customTags || []).filter(ct => ct !== text);
            tags[idx] = tag;
            return {...state, tags};
        }
        case 'ADD_IMAGE_CUSTOM_TAG': {
            const trimmed = action.text?.trim()?.slice(0, 100);
            if (!trimmed || trimmed.length < 3) return state;
            if (state.customTags.includes(trimmed)) return state;
            return {...state, customTags: [...state.customTags, trimmed]};
        }
        case 'REMOVE_IMAGE_CUSTOM_TAG': {
            return {
                ...state,
                customTags: state.customTags.filter(ct => ct !== action.text)
            };
        }
        default:
            return state;
    }
}

// --- Hook ---

export default function useTagDraft(activePhoto, defaultPickedUp) {
    const photoIdRef = useRef(null);

    const [draft, dispatchDraft] = useReducer(draftReducer, {
        tags: [],
        customTags: [],
        photoId: null
    });

    // Re-initialize draft when active photo changes
    useEffect(() => {
        const newId = activePhoto?.id ?? activePhoto?.photoId ?? null;
        if (newId !== photoIdRef.current) {
            const tagCount = activePhoto?.tags?.length ?? 0;
            const customCount = activePhoto?.customTags?.length ?? 0;
            if (__DEV__) console.log('[Draft] RESET photoId:', newId, 'tags:', tagCount, 'custom:', customCount);
            photoIdRef.current = newId;
            dispatchDraft({
                type: 'RESET',
                tags: activePhoto?.tags ? activePhoto.tags.map(t => ({...t})) : [],
                customTags: activePhoto?.customTags ? [...activePhoto.customTags] : [],
                photoId: newId
            });
        }
    }, [activePhoto]);

    const currentTags = draft.tags.length > 0 ? draft.tags : EMPTY_ARRAY;
    const currentCustomTags = draft.customTags.length > 0 ? draft.customTags : EMPTY_ARRAY;

    // Tag actions
    const addTag = useCallback((cloId, typeId) => {
        dispatchDraft({type: 'ADD_TAG', cloId, typeId, defaultPickedUp});
    }, [defaultPickedUp]);

    const removeTag = useCallback((cloId, typeId) => {
        dispatchDraft({type: 'REMOVE_TAG', cloId, typeId});
    }, []);

    const updateQuantity = useCallback((cloId, typeId, quantity) => {
        dispatchDraft({type: 'UPDATE_QUANTITY', cloId, typeId, quantity});
    }, []);

    const setPickedUp = useCallback((cloId, typeId, value) => {
        dispatchDraft({type: 'SET_PICKED_UP', cloId, typeId, value});
    }, []);

    const toggleMaterial = useCallback((cloId, typeId, materialId) => {
        dispatchDraft({type: 'TOGGLE_MATERIAL', cloId, typeId, materialId});
    }, []);

    const addBrand = useCallback((cloId, typeId, brandId) => {
        dispatchDraft({type: 'ADD_BRAND', cloId, typeId, brandId});
    }, []);

    const removeBrand = useCallback((cloId, typeId, brandId) => {
        dispatchDraft({type: 'REMOVE_BRAND', cloId, typeId, brandId});
    }, []);

    const addCustomTag = useCallback((cloId, typeId, text) => {
        dispatchDraft({type: 'ADD_CUSTOM_TAG', cloId, typeId, text});
    }, []);

    const removeCustomTag = useCallback((cloId, typeId, text) => {
        dispatchDraft({type: 'REMOVE_CUSTOM_TAG', cloId, typeId, text});
    }, []);

    const addImageCustomTag = useCallback(text => {
        dispatchDraft({type: 'ADD_IMAGE_CUSTOM_TAG', text});
    }, []);

    const removeImageCustomTag = useCallback(text => {
        dispatchDraft({type: 'REMOVE_IMAGE_CUSTOM_TAG', text});
    }, []);

    // XP estimate derived from draft
    const xpEstimate = useMemo(() => {
        let xp = 5;
        for (const tag of currentTags) {
            xp += tag.quantity || 1;
            if (tag.picked_up === true) xp += 5;
            xp += (tag.materials?.length || 0) * 2;
            xp += (tag.brands?.length || 0) * 3;
            xp += tag.customTags?.length || 0;
        }
        xp += currentCustomTags.length;
        return xp;
    }, [currentTags, currentCustomTags]);

    // isDirty — have tags been modified from the original photo?
    const isDirty = useMemo(() => {
        const origTags = activePhoto?.tags ?? [];
        const origCustom = activePhoto?.customTags ?? [];
        return draft.tags !== origTags || draft.customTags !== origCustom ||
            draft.tags.length !== origTags.length ||
            draft.customTags.length !== origCustom.length;
    }, [draft.tags, draft.customTags, activePhoto]);

    return {
        currentTags,
        currentCustomTags,
        xpEstimate,
        isDirty,
        addTag,
        removeTag,
        updateQuantity,
        setPickedUp,
        toggleMaterial,
        addBrand,
        removeBrand,
        addCustomTag,
        removeCustomTag,
        addImageCustomTag,
        removeImageCustomTag
    };
}
