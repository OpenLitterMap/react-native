/**
 * Build tags payload from an image's tags array for the backend.
 * Uses CLO format: { category_litter_object_id, litter_object_type_id, ... }
 *
 * Shared between HomeScreen (upload) and AddTagScreen (edit).
 */
const buildTagsPayload = img => {
    const tags = (img.tags || []).map(tag => ({
        category_litter_object_id: tag.cloId,
        litter_object_type_id: tag.typeId ?? null,
        quantity: tag.quantity,
        picked_up: img.picked_up ? true : false,
        materials: tag.materials || [],
        brands: (tag.brands || []).map(b => ({
            id: b.id,
            quantity: b.quantity || 1
        })),
        custom_tags: tag.customTags || []
    }));

    // Attach image-level custom tags to the first tag entry (deduplicated)
    if (tags.length > 0 && img.customTags && img.customTags.length > 0) {
        const existing = new Set(tags[0].custom_tags);
        const newTags = img.customTags.filter(ct => !existing.has(ct));
        tags[0].custom_tags = [...tags[0].custom_tags, ...newTags];
    } else if (tags.length === 0 && img.customTags && img.customTags.length > 0) {
        // Image has only custom tags and no CLO tags.
        // Send each as a custom-only tag in the format the backend expects:
        // { custom: true, key: "tag-text", quantity: 1, picked_up: bool }
        for (const ct of img.customTags) {
            tags.push({
                custom: true,
                key: ct,
                quantity: 1,
                picked_up: img.picked_up ? true : false
            });
        }
    }

    return tags.length > 0 ? tags : null;
};

export default buildTagsPayload;
