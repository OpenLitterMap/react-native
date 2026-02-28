/**
 * Returns the ordinal suffix for a number.
 * 1 → "st", 2 → "nd", 3 → "rd", 4 → "th"
 * Handles teens correctly: 11th, 12th, 13th
 *
 * @param {number} n
 * @returns {string}
 */
export const getOrdinal = n => {
    const b = n % 10;
    return Math.floor((n % 100) / 10) === 1
        ? 'th'
        : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
};

/**
 * Formats a number with its ordinal suffix.
 * 1 → "1st", 22 → "22nd", 113 → "113th"
 *
 * @param {number} n
 * @returns {string}
 */
export const formatOrdinal = n => `${n.toLocaleString()}${getOrdinal(n)}`;
