export const Colors = {
    accent: '#27ae60',
    accentLight: '#dcffeb',
    text: '#050916',
    muted: '#7985a3',
    white: '#ffffff',
    error: '#e74c3c',
    warn: '#df8041',
    info: '#1976D2'
} as const;

export type ColorType = keyof typeof Colors;
