import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../utils/apiClient';

// Bumped to v3 so installs drop any cache that stored "Unknown" names
// (the v2 parser read the XP-keyed object but expected object values; the
// backend actually returns plain string titles — { "0": "Noob", ... }).
const CACHE_KEY = 'xp_levels_cache_v3';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Fallback if API is unreachable and no cache exists (mirror /api/levels titles)
const FALLBACK_LEVELS = [
    { xp: 0, name: 'Noob' },
    { xp: 100, name: 'Litter Picker' },
    { xp: 1000, name: 'Litter Wizard' },
    { xp: 5000, name: 'Trash Warrior' },
    { xp: 10000, name: 'Early Guardian' },
    { xp: 15000, name: 'Trashmonster' },
    { xp: 50000, name: 'Force of Nature' },
    { xp: 100000, name: 'Planet Protector' },
    { xp: 200000, name: 'Galactic Garbagething' },
    { xp: 500000, name: 'Interplanetary' },
    { xp: 1000000, name: 'SuperIntelligent LitterMaster' }
];

/**
 * Fetch XP levels from the API. Caches for 7 days.
 * Falls back to hardcoded levels on failure.
 *
 * @param {string} token - Bearer token
 * @returns {Promise<Array<{ xp: number, name: string }>>}
 */
export const fetchXpLevels = async (token) => {
    try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);

        if (cached) {
            const { levels, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                return levels;
            }
        }

        const response = await api.get('/api/levels', { token });

        const levels = normalizeLevels(response.data);

        await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ levels, timestamp: Date.now() })
        );

        return levels;
    } catch {
        // Return cached (even expired) or fallback
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached).levels;
        } catch {}
        return FALLBACK_LEVELS;
    }
};

/**
 * Normalize API response into sorted [{ xp, name }] array.
 * Handles common response shapes: array of objects, or { data: [...] }.
 */
export const normalizeLevels = (data) => {
    // Accept an array, { data: [...] } / { levels: [...] }, OR the backend's shape:
    // an object keyed by XP threshold whose value is the title string —
    // { "0": "Noob", "100": "Litter Picker", ... }. Object values
    // ({ title }/{ name }) are tolerated too in case the backend shape changes.
    const raw = data?.data ?? data?.levels ?? data;

    let levels;
    if (Array.isArray(raw)) {
        levels = raw.map(item => ({
            xp: item.xp ?? item.xp_required ?? item.min_xp ?? 0,
            name: item.name ?? item.title ?? item.label ?? 'Unknown'
        }));
    } else if (raw && typeof raw === 'object') {
        levels = Object.entries(raw).map(([key, v]) => {
            const keyNum = Number(key);
            return {
                xp: Number.isFinite(keyNum)
                    ? keyNum
                    : (v?.xp ?? v?.xp_required ?? v?.min_xp ?? 0),
                name: typeof v === 'string'
                    ? v
                    : (v?.name ?? v?.title ?? v?.label ?? 'Unknown')
            };
        });
    } else {
        return FALLBACK_LEVELS;
    }

    if (!levels.length) return FALLBACK_LEVELS;
    levels.sort((a, b) => a.xp - b.xp);
    return levels;
};

/**
 * Given XP and a levels ladder, returns current level info.
 *
 * @param {number} xp
 * @param {Array<{ xp: number, name: string }>} [levels]
 * @returns {{ currentLevel: object, nextLevel: object|null, progress: number, xpToNext: number }}
 */
export const getCurrentLevel = (xp = 0, levels) => {
    levels = levels || FALLBACK_LEVELS;
    let currentLevel = levels[0];
    let nextLevel = levels[1] || null;
    for (let i = 0; i < levels.length; i++) {
        if (xp >= levels[i].xp) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || null;
        } else {
            break;
        }
    }

    const range = nextLevel ? nextLevel.xp - currentLevel.xp : 0;
    const progress = range > 0
        ? (xp - currentLevel.xp) / range
        : nextLevel ? 0 : 1;

    const xpToNext = nextLevel ? nextLevel.xp - xp : 0;

    return { currentLevel, nextLevel, progress, xpToNext };
};

export default FALLBACK_LEVELS;
