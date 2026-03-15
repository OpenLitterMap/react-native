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
 * Parse a tag key back into (cloId, typeId).
 * Companion to makeTagKey — keeps the format in one place.
 */
export const parseTagKey = key => {
    const dash = key.indexOf('-');
    const cloId = Number(key.slice(0, dash));
    const rest = key.slice(dash + 1);
    const typeId = rest !== '' ? Number(rest) : null;
    return [cloId, typeId];
};

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
    if (typeId != null) {
        return (
            typeEntriesByKey?.[`${cloId}-${typeId}`] || entriesByCloId?.[cloId]
        );
    }
    return entriesByCloId?.[cloId];
};
