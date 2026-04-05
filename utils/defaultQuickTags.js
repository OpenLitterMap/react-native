/**
 * Default quick tag presets for new users.
 * Uses category/object/type/brand keys (stable across deployments) rather than IDs.
 * Keys match the backend's category.key, object.key, type.key, and brand.key fields.
 * Resolved against the tag catalog at runtime.
 *
 * Ordered by global frequency (top 20 most tagged items on OpenLitterMap).
 */

const DEFAULT_QUICK_TAG_KEYS = [
    {categoryKey: 'smoking', objectKey: 'butts'},
    {categoryKey: 'other', objectKey: 'plastic'},
    {categoryKey: 'other', objectKey: 'other'},
    {categoryKey: 'food', objectKey: 'packaging'},
    {categoryKey: 'other', objectKey: 'paper'},
    {categoryKey: 'dumping', objectKey: 'dumping'},
    {categoryKey: 'softdrinks', objectKey: 'lid'},
    {categoryKey: 'softdrinks', objectKey: 'cup'},
    {categoryKey: 'softdrinks', objectKey: 'bottle', typeKey: 'water'},
    {categoryKey: 'food', objectKey: 'wrapper'},
    {categoryKey: 'alcohol', objectKey: 'can', typeKey: 'beer'},
    {categoryKey: 'alcohol', objectKey: 'bottle', typeKey: 'beer'},
    {categoryKey: 'other', objectKey: 'plastic_bag'},
    {categoryKey: 'softdrinks', objectKey: 'can', typeKey: 'soda'},
    {categoryKey: 'softdrinks', objectKey: 'can', typeKey: 'energy', brandKey: 'red_bull'},
    {categoryKey: 'softdrinks', objectKey: 'bottle_cap'},
    {categoryKey: 'coastal', objectKey: 'microplastics'},
    {categoryKey: 'smoking', objectKey: 'box', typeKey: 'cigarette'},
    {categoryKey: 'softdrinks', objectKey: 'straw'},
    {categoryKey: 'medical', objectKey: 'face_mask'}
];

/**
 * Resolve default quick tag keys against the tag catalog.
 * Returns an array of quick tag presets with generated IDs.
 * Supports base objects, typed variants, and brand presets.
 * Unresolvable keys are silently skipped.
 */
export function resolveDefaultQuickTags(objectEntries, brandsById) {
    const presets = [];

    for (const {categoryKey, objectKey, typeKey, brandKey} of DEFAULT_QUICK_TAG_KEYS) {
        let entry;
        let typeId = null;

        if (typeKey) {
            // Find a type entry matching category + object + type
            entry = objectEntries.find(
                e => e.isType &&
                    e.categoryKey === categoryKey &&
                    e.objectKey === objectKey &&
                    e.typeName?.toLowerCase() === typeKey.toLowerCase()
            );
            if (entry) {
                typeId = entry.typeId;
            }
        } else {
            // Find a base object entry
            entry = objectEntries.find(
                e => !e.isType && e.categoryKey === categoryKey && e.objectKey === objectKey
            );
        }

        if (!entry) continue;

        // Resolve brand if specified
        const brands = [];
        if (brandKey && brandsById) {
            const brand = Object.values(brandsById).find(
                b => b.key === brandKey
            );
            if (brand) {
                brands.push({id: brand.id, quantity: 1});
            }
        }

        presets.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            cloId: entry.cloId,
            typeId,
            name: entry.displayName,
            customName: null,
            quantity: 1,
            picked_up: null,
            materials: [],
            brands
        });
    }

    return presets;
}
