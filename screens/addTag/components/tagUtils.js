/**
 * Shared utilities for the AddTag feature.
 */

/** Maximum quantity per tag. */
export const MAX_QUANTITY = 10;

/**
 * Build a unique key for a (cloId, typeId) pair.
 * Used for Set lookups, React keys, and detail sheet state.
 */
export const makeTagKey = (cloId, typeId) => `${cloId}-${typeId || ''}`;

/**
 * Resolve the display entry for a tag from the lookup tables.
 * Type entries take priority when typeId is present.
 */
export const resolveTagEntry = (
    cloId,
    typeId,
    entriesByCloId,
    typeEntriesByKey
) => {
    if (typeId) {
        return (
            typeEntriesByKey?.[`${cloId}-${typeId}`] || entriesByCloId[cloId]
        );
    }
    return entriesByCloId[cloId];
};
