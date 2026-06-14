import {useCallback, useMemo, useReducer, useRef, useEffect} from 'react';
import {MAX_QUANTITY_DEFAULT} from '../components/tagUtils';

/**
 * Local draft state for the active photo's tags.
 * All edits are local — no Redux dispatches per tap.
 * On save, caller reads currentTags/currentCustomTags or calls buildDraftPayload.
 */

const EMPTY_ARRAY = [];

// Backend custom-tag contract (mirrors CUSTOM_TAG_REGEX in photos_reducer.js):
// word chars, spaces, colons, hyphens only. Reject invalid input at the draft
// layer so it can't reach upload and fail server-side.
const CUSTOM_TAG_REGEX = /^[\w\s:-]+$/;

// --- Draft reducer ---

function findTag(tags, cloId, typeId) {
    return tags.findIndex(
        t => t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null)
    );
}

function findBrandOnlyTag(tags, brandId) {
    return tags.findIndex(
        t => t.brandOnly && t.brandId === brandId
    );
}

function getSingleBrandOnlySeed(tags) {
    const brandOnlyTags = tags.filter(tag => tag.brandOnly && tag.brandId != null);
    return brandOnlyTags.length === 1 ? brandOnlyTags[0] : null;
}

function draftReducer(state, action) {
    switch (action.type) {
    case 'RESET': {
        return {
            tags: action.tags || [],
            customTags: action.customTags || [],
            photoId: action.photoId,
            maxQuantity: action.maxQuantity ?? MAX_QUANTITY_DEFAULT
        };
    }
    case 'ADD_TAG': {
        const {cloId, typeId, defaultPickedUp} = action;
        const brandSeed = getSingleBrandOnlySeed(state.tags);
        const idx = findTag(state.tags, cloId, typeId);
        if (idx !== -1) {
            const tags = [...state.tags];
            const existing = {...tags[idx]};

            if (brandSeed) {
                const brands = [...(existing.brands || [])];
                if (!brands.some(brand => brand.id === brandSeed.brandId)) {
                    brands.push({
                        id: brandSeed.brandId,
                        quantity: Math.min(brandSeed.quantity || 1, state.maxQuantity)
                    });
                }
                existing.brands = brands;
                if (existing.picked_up == null && brandSeed.picked_up != null) {
                    existing.picked_up = brandSeed.picked_up;
                }
                tags[idx] = existing;
                return {
                    ...state,
                    tags: tags.filter(tag => !(tag.brandOnly && tag.brandId === brandSeed.brandId))
                };
            }

            if (existing.quantity < state.maxQuantity) {
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
        if (brandSeed) {
            tag.brands.push({
                id: brandSeed.brandId,
                quantity: Math.min(brandSeed.quantity || 1, state.maxQuantity)
            });
            if (brandSeed.picked_up != null) {
                tag.picked_up = brandSeed.picked_up;
            }
        }
        if (typeId != null) tag.typeId = typeId;
        return {
            ...state,
            tags: [
                ...state.tags.filter(
                    existingTag => !(brandSeed && existingTag.brandOnly && existingTag.brandId === brandSeed.brandId)
                ),
                tag
            ]
        };
    }
    case 'ADD_BRAND_ONLY': {
        const {brandId, brandName, brandKey, defaultPickedUp} = action;
        const idx = findBrandOnlyTag(state.tags, brandId);
        if (idx !== -1) {
            const tags = [...state.tags];
            const existing = {...tags[idx]};
            if (existing.quantity < state.maxQuantity) {
                existing.quantity += 1;
            }
            tags[idx] = existing;
            return {...state, tags};
        }
        return {
            ...state,
            tags: [
                ...state.tags,
                {
                    brandOnly: true,
                    brandId,
                    brandKey,
                    quantity: 1,
                    picked_up: defaultPickedUp ?? null,
                    fallbackDisplayName: brandName,
                    materials: [],
                    brands: [],
                    customTags: []
                }
            ]
        };
    }
    case 'REMOVE_TAG': {
        const {cloId, typeId, brandId} = action;
        return {
            ...state,
            tags: state.tags.filter(
                t => brandId != null
                    ? !(t.brandOnly && t.brandId === brandId)
                    : !(t.cloId === cloId && (t.typeId ?? null) === (typeId ?? null))
            )
        };
    }
    case 'UPDATE_QUANTITY': {
        const {cloId, typeId, quantity, brandId} = action;
        if (quantity <= 0) {
            return draftReducer(state, {type: 'REMOVE_TAG', cloId, typeId, brandId});
        }
        const idx = brandId != null
            ? findBrandOnlyTag(state.tags, brandId)
            : findTag(state.tags, cloId, typeId);
        if (idx === -1) return state;
        const tags = [...state.tags];
        tags[idx] = {...tags[idx], quantity: Math.min(quantity, state.maxQuantity)};
        return {...state, tags};
    }
    case 'SET_PICKED_UP': {
        const {cloId, typeId, value, brandId} = action;
        const idx = brandId != null
            ? findBrandOnlyTag(state.tags, brandId)
            : findTag(state.tags, cloId, typeId);
        if (idx === -1) return state;
        const tags = [...state.tags];
        tags[idx] = {...tags[idx], picked_up: value};
        return {...state, tags};
    }
    case 'SET_TYPE': {
        // Re-key a tag's identity from (cloId, fromTypeId) to (cloId, toTypeId),
        // preserving all metadata. Client-only — typeId serializes to
        // litter_object_type_id, so the payload shape is unchanged.
        const {cloId, fromTypeId, toTypeId} = action;
        if ((fromTypeId ?? null) === (toTypeId ?? null)) return state;
        const idx = findTag(state.tags, cloId, fromTypeId);
        if (idx === -1) return state;
        const targetIdx = findTag(state.tags, cloId, toTypeId);
        // Target identity already exists — drop the source to avoid a duplicate.
        if (targetIdx !== -1 && targetIdx !== idx) {
            return {...state, tags: state.tags.filter((_, i) => i !== idx)};
        }
        const tags = [...state.tags];
        const moved = {...tags[idx]};
        if (toTypeId != null) {
            moved.typeId = toTypeId;
        } else {
            delete moved.typeId;
        }
        tags[idx] = moved;
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
        if (!CUSTOM_TAG_REGEX.test(trimmed)) return state;
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
    case 'ADD_TAG_WITH_PRESET': {
        const {preset, defaultPickedUp} = action;
        const {cloId, typeId, quantity, materials, brands, picked_up} = preset;
        const idx = findTag(state.tags, cloId, typeId);
        if (idx !== -1) {
            const tags = [...state.tags];
            const existing = {...tags[idx]};
            // Increment quantity
            existing.quantity = Math.min(existing.quantity + (quantity || 1), state.maxQuantity);
            // Merge materials additively
            if (materials?.length) {
                const matSet = new Set(existing.materials || []);
                for (const m of materials) matSet.add(m);
                existing.materials = [...matSet];
            }
            // Merge brands additively
            if (brands?.length) {
                const existingBrands = [...(existing.brands || [])];
                for (const b of brands) {
                    if (!existingBrands.some(eb => eb.id === b.id)) {
                        existingBrands.push({...b});
                    }
                }
                existing.brands = existingBrands;
            }
            // Apply picked_up only if existing is still at default
            if (existing.picked_up == null && picked_up != null) {
                existing.picked_up = picked_up;
            }
            tags[idx] = existing;
            return {...state, tags};
        }
        const tag = {
            cloId,
            quantity: Math.min(quantity || 1, state.maxQuantity),
            picked_up: picked_up ?? defaultPickedUp ?? null,
            materials: [...(materials || [])],
            brands: (brands || []).map(b => ({...b})),
            customTags: []
        };
        if (typeId != null) tag.typeId = typeId;
        return {...state, tags: [...state.tags, tag]};
    }
    case 'ADD_IMAGE_CUSTOM_TAG': {
        const trimmed = action.text?.trim()?.slice(0, 100);
        if (!trimmed || trimmed.length < 3) return state;
        if (!CUSTOM_TAG_REGEX.test(trimmed)) return state;
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

export default function useTagDraft(activePhoto, defaultPickedUp, maxQuantity) {
    const photoIdRef = useRef(null);

    const [draft, dispatchDraft] = useReducer(draftReducer, {
        tags: [],
        customTags: [],
        photoId: null,
        maxQuantity: maxQuantity ?? MAX_QUANTITY_DEFAULT
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
                photoId: newId,
                maxQuantity
            });
        }
    }, [activePhoto, maxQuantity]);

    const currentTags = draft.tags.length > 0 ? draft.tags : EMPTY_ARRAY;
    const currentCustomTags = draft.customTags.length > 0 ? draft.customTags : EMPTY_ARRAY;

    // Tag actions
    const addTag = useCallback((cloId, typeId) => {
        dispatchDraft({type: 'ADD_TAG', cloId, typeId, defaultPickedUp});
    }, [defaultPickedUp]);

    const addTagWithPreset = useCallback((preset) => {
        dispatchDraft({type: 'ADD_TAG_WITH_PRESET', preset, defaultPickedUp});
    }, [defaultPickedUp]);

    const addBrandOnly = useCallback((brandId, brandName, brandKey) => {
        dispatchDraft({
            type: 'ADD_BRAND_ONLY',
            brandId,
            brandName,
            brandKey,
            defaultPickedUp
        });
    }, [defaultPickedUp]);

    const removeTag = useCallback((cloId, typeId, brandId) => {
        dispatchDraft({type: 'REMOVE_TAG', cloId, typeId, brandId});
    }, []);

    const updateQuantity = useCallback((cloId, typeId, quantity, brandId) => {
        dispatchDraft({type: 'UPDATE_QUANTITY', cloId, typeId, quantity, brandId});
    }, []);

    const setPickedUp = useCallback((cloId, typeId, value, brandId) => {
        dispatchDraft({type: 'SET_PICKED_UP', cloId, typeId, value, brandId});
    }, []);

    const setType = useCallback((cloId, fromTypeId, toTypeId) => {
        dispatchDraft({type: 'SET_TYPE', cloId, fromTypeId, toTypeId});
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
    // Compare by length since RESET creates new array references.
    const isDirty = useMemo(() => {
        const origTags = activePhoto?.tags ?? [];
        const origCustom = activePhoto?.customTags ?? [];
        return draft.tags.length !== origTags.length ||
            draft.customTags.length !== origCustom.length;
    }, [draft.tags.length, draft.customTags.length, activePhoto]);

    return {
        currentTags,
        currentCustomTags,
        maxQuantity: draft.maxQuantity,
        xpEstimate,
        isDirty,
        addTag,
        addTagWithPreset,
        addBrandOnly,
        removeTag,
        updateQuantity,
        setPickedUp,
        setType,
        toggleMaterial,
        addBrand,
        removeBrand,
        addCustomTag,
        removeCustomTag,
        addImageCustomTag,
        removeImageCustomTag
    };
}
