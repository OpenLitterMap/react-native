/**
 * Check if image has any tags (CLO tags or custom tags).
 *
 * @param {Object} img
 * @returns {boolean}
 */
export const isTagged = img => {
    if (img?.tags && img.tags.length > 0) return true;
    if (img?.customTags && img.customTags.length > 0) return true;
    return false;
};
