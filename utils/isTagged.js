/**
 * fn to check if image is tagged or not
 * img should have at least one tag or one custom tag
 *
 * @param {Object} img
 */
export const isTagged = img => {
    return (
        (img.customTags && img.customTags?.length > 0) ||
        (img.tags && Object.keys(img.tags)?.length > 0)
    );
};
