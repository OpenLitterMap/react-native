/**
 * Category-to-color mapping for visual distinction in tags UI.
 * Keys match categoryKey values from the API (snake_case).
 */
export const CATEGORY_COLORS = {
    smoking: '#E85D75',
    alcohol: '#845EC2',
    beverages: '#00C9A7',
    food: '#F9A825',
    personal_care: '#FF8A65',
    medical: '#E53935',
    industrial: '#78909C',
    vehicles: '#5C6BC0',
    marine: '#0097A7',
    electronics: '#7E57C2',
    pets: '#8D6E63'
};

export const getCategoryColor = categoryKey => {
    return CATEGORY_COLORS[categoryKey] || '#78909C';
};
