import {formatKey} from './formatKey';

/**
 * Convert backend new_tags response into the local tags format
 * used by the tagging UI.
 *
 * Tags without category/object data are custom-tag-only entries —
 * their custom tags are promoted to image-level instead of showing
 * a meaningless CLO pill.
 *
 * Deduplicates tags by (cloId, typeId), and deduplicates materials,
 * brands, and custom tags within each tag.
 *
 * @param {Array} newTags - Array of API tag objects from photo.new_tags
 * @returns {{ tags: Array, imageCustomTags: Array }}
 */
export function getTagsFromBackend(newTags) {
    const tagMap = new Map(); // key: "cloId-typeId" → merged tag
    const imageCustomTagSet = new Set();

    if (!newTags) {
        return {tags: [], imageCustomTags: []};
    }

    for (const apiTag of newTags) {
        const catKey = apiTag.category?.key;
        const objKey = apiTag.object?.key;

        const tagCustomTags = new Set();
        const tagMaterialIds = new Set();
        const tagBrandMap = new Map(); // id → {id, quantity}

        if (Array.isArray(apiTag.extra_tags)) {
            for (const extra of apiTag.extra_tags) {
                if (extra.type === 'material' && extra.tag?.id != null) {
                    tagMaterialIds.add(extra.tag.id);
                } else if (extra.type === 'brand' && extra.tag?.id != null) {
                    if (!tagBrandMap.has(extra.tag.id)) {
                        tagBrandMap.set(extra.tag.id, {
                            id: extra.tag.id,
                            quantity: extra.quantity ?? 1
                        });
                    }
                } else if (extra.type === 'custom_tag' && extra.tag?.key) {
                    tagCustomTags.add(extra.tag.key);
                }
            }
        }

        // If the tag has no category/object info, it's a
        // custom-tag-only entry. Promote custom tags to
        // image-level and skip the CLO pill.
        if (!catKey && !objKey && !apiTag.category_litter_object_id) {
            for (const ct of tagCustomTags) {
                imageCustomTagSet.add(ct);
            }
            continue;
        }

        const cloId = apiTag.category_litter_object_id;
        const typeId = apiTag.litter_object_type_id ?? null;
        const mapKey = `${cloId}-${typeId ?? ''}`;

        // Merge into existing tag if duplicate CLO/type pair
        if (tagMap.has(mapKey)) {
            const existing = tagMap.get(mapKey);
            // Merge materials, brands, custom tags
            for (const mid of tagMaterialIds) existing.materials.add(mid);
            for (const [bid, brand] of tagBrandMap) {
                if (!existing.brands.has(bid)) existing.brands.set(bid, brand);
            }
            for (const ct of tagCustomTags) existing.customTags.add(ct);
            // Take higher quantity
            const qty = apiTag.quantity ?? 1;
            if (qty > existing.quantity) existing.quantity = qty;
            continue;
        }

        // Build display name: if the tag has a type (e.g. "juice"),
        // show "Juice Carton" instead of just "Carton"
        const typeKey = apiTag.type?.key;
        let displayName = objKey ? formatKey(objKey) : undefined;
        if (typeKey && displayName) {
            displayName = `${formatKey(typeKey)} ${displayName}`;
        }

        tagMap.set(mapKey, {
            cloId,
            typeId,
            quantity: apiTag.quantity ?? 1,
            materials: tagMaterialIds,
            brands: tagBrandMap,
            customTags: tagCustomTags,
            fallbackDisplayName: displayName,
            fallbackCategoryName: catKey ? formatKey(catKey) : undefined,
            fallbackCategoryKey: catKey || undefined
        });
    }

    // Convert Sets/Maps to arrays for Redux compatibility
    const tags = [];
    for (const entry of tagMap.values()) {
        const tag = {
            cloId: entry.cloId,
            quantity: entry.quantity,
            materials: [...entry.materials],
            brands: [...entry.brands.values()],
            customTags: [...entry.customTags],
            fallbackDisplayName: entry.fallbackDisplayName,
            fallbackCategoryName: entry.fallbackCategoryName,
            fallbackCategoryKey: entry.fallbackCategoryKey
        };
        if (entry.typeId != null) {
            tag.typeId = entry.typeId;
        }
        tags.push(tag);
    }

    return {tags, imageCustomTags: [...imageCustomTagSet]};
}
