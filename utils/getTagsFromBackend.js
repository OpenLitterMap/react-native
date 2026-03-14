import {formatKey} from './formatKey';

/**
 * Convert backend new_tags response into the local tags format
 * used by the tagging UI.
 *
 * Tags without category/object data are custom-tag-only entries —
 * their custom tags are promoted to image-level instead of showing
 * a meaningless CLO pill.
 *
 * @param {Array} newTags - Array of API tag objects from photo.new_tags
 * @returns {{ tags: Array, imageCustomTags: Array }}
 */
export function getTagsFromBackend(newTags) {
    const tags = [];
    const imageCustomTags = [];

    if (!newTags) {
        return {tags, imageCustomTags};
    }

    for (const apiTag of newTags) {
        const catKey = apiTag.category?.key;
        const objKey = apiTag.object?.key;

        const tagCustomTags = [];
        const tagMaterials = [];
        const tagBrands = [];

        if (apiTag.extra_tags) {
            for (const extra of apiTag.extra_tags) {
                if (extra.type === 'material' && extra.tag?.id) {
                    tagMaterials.push(extra.tag.id);
                } else if (extra.type === 'brand' && extra.tag?.id) {
                    tagBrands.push({
                        id: extra.tag.id,
                        quantity: extra.quantity || 1
                    });
                } else if (extra.type === 'custom_tag' && extra.tag?.key) {
                    tagCustomTags.push(extra.tag.key);
                }
            }
        }

        // If the tag has no category/object info, it's a
        // custom-tag-only entry. Promote custom tags to
        // image-level and skip the CLO pill.
        if (!catKey && !objKey) {
            imageCustomTags.push(...tagCustomTags);
            continue;
        }

        // Build display name: if the tag has a type (e.g. "juice"),
        // show "Juice Carton" instead of just "Carton"
        const typeKey = apiTag.type?.key;
        let displayName = objKey ? formatKey(objKey) : undefined;
        if (typeKey && displayName) {
            displayName = `${formatKey(typeKey)} ${displayName}`;
        }

        const tag = {
            cloId: apiTag.category_litter_object_id,
            quantity: apiTag.quantity || 1,
            materials: tagMaterials,
            brands: tagBrands,
            customTags: tagCustomTags,
            fallbackDisplayName: displayName,
            fallbackCategoryName: catKey ? formatKey(catKey) : undefined,
            fallbackCategoryKey: catKey || undefined
        };

        if (apiTag.litter_object_type_id) {
            tag.typeId = apiTag.litter_object_type_id;
        }

        tags.push(tag);
    }

    return {tags, imageCustomTags};
}
