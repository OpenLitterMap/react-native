/**
 * Convert snake_case keys to Title Case for display.
 * All object/category keys from the API are snake_case.
 *
 * broken_glass → "Broken Glass"
 * coffee_pod   → "Coffee Pod"
 * butts        → "Butts"
 */
export const formatKey = (key) => {
    if (!key) return '';
    return key
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, l => l.toUpperCase());
};
