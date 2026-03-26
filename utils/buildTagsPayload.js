/**
 * Build tags payload from an image's tags array for the backend.
 * Uses CLO format: { category_litter_object_id, litter_object_type_id, ... }
 *
 * Shared between HomeScreen (upload) and AddTagScreen (edit).
 */
const buildTagsPayload = img => {
    const objectTags = [];
    const standaloneTags = [];

    for (const tag of img.tags || []) {
        if (tag.brandOnly && tag.brandId != null) {
            standaloneTags.push({
                brand_only: true,
                brand: {
                    id: tag.brandId,
                    key: tag.brandKey
                },
                quantity: tag.quantity,
                picked_up: tag.picked_up ?? null
            });
            continue;
        }

        if (tag.cloId == null) {
            continue;
        }

        objectTags.push({
            category_litter_object_id: tag.cloId,
            litter_object_type_id: tag.typeId ?? null,
            quantity: tag.quantity,
            picked_up: tag.picked_up ?? null,
            materials: tag.materials || [],
            brands: (tag.brands || []).map(b => ({
                id: b.id,
                quantity: b.quantity || 1
            })),
            custom_tags: tag.customTags || []
        });
    }

    const tags = [...objectTags, ...standaloneTags];

    // Attach image-level custom tags to the first tag entry (deduplicated across ALL tags)
    if (objectTags.length > 0 && img.customTags && img.customTags.length > 0) {
        const allExisting = new Set(objectTags.flatMap(t => t.custom_tags));
        const newTags = img.customTags.filter(ct => !allExisting.has(ct));
        objectTags[0].custom_tags = [...objectTags[0].custom_tags, ...newTags];
    } else if (objectTags.length === 0 && img.customTags && img.customTags.length > 0) {
        // Image has only custom tags and no CLO tags.
        // Send each as a custom-only tag in the format the backend expects:
        // { custom: true, key: "tag-text", quantity: 1, picked_up: null }
        for (const ct of img.customTags) {
            tags.push({
                custom: true,
                key: ct,
                quantity: 1,
                picked_up: null
            });
        }
    }

    return tags.length > 0 ? tags : null;
};

export default buildTagsPayload;
