/**
 * Check if image is tagged or not.
 * Returns true if the image has v5 tags, v4 tags, or custom tags.
 *
 * @param {Object} img
 * @returns {boolean}
 */
export const isTagged = img => {
    // V5 tags
    if (img?.tagsV5 && img.tagsV5.length > 0) return true;
    // V4 tags
    if (img?.tags && Object.keys(img.tags).length > 0) return true;
    // Custom tags
    if (img?.customTags && img.customTags.length > 0) return true;
    return false;
};
