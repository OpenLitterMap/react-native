/**
 * Build v5 tags payload from an image's tagsV5 array.
 * Uses CLO format: { category_litter_object_id, litter_object_type_id, ... }
 *
 * Shared between HomeScreen (upload) and AddTagScreen (edit).
 */
const buildV5TagsPayload = img => {
    const v5Tags = (img.tagsV5 || []).map(tag => ({
        category_litter_object_id: tag.cloId,
        litter_object_type_id: tag.typeId || null,
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
    if (v5Tags.length > 0 && img.customTags && img.customTags.length > 0) {
        const existing = new Set(v5Tags[0].custom_tags);
        const newTags = img.customTags.filter(ct => !existing.has(ct));
        v5Tags[0].custom_tags = [...v5Tags[0].custom_tags, ...newTags];
    } else if (v5Tags.length === 0 && img.customTags && img.customTags.length > 0) {
        // Image has only custom tags and no CLO tags — send a legacy-format
        // entry so the backend maps it to unclassified.other
        v5Tags.push({
            custom_tags: img.customTags,
            quantity: 1,
            picked_up: img.picked_up ? true : false
        });
    }

    return v5Tags.length > 0 ? v5Tags : null;
};

export default buildV5TagsPayload;
