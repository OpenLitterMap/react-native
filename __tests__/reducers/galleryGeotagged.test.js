/**
 * selectInboxPhotos: ALL loaded photos (geotagged or not), newest-first, minus
 * dismissed — no date window. Per-photo `hasGps` is preserved so the grid can
 * grey out non-geotagged photos and pin the geotagged ones.
 */
jest.mock('@react-native-camera-roll/camera-roll', () => ({CameraRoll: {}}));
jest.mock('@lodev09/react-native-exify', () => ({}));
jest.mock('@sentry/react-native', () => ({captureException: jest.fn(), setUser: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {get: jest.fn(), post: jest.fn(), put: jest.fn()}}));

import {selectInboxPhotos} from '../../reducers/gallery_reducer';

const DAY = 60 * 60 * 24;

describe('selectInboxPhotos', () => {
    it('returns all photos newest-first regardless of age or GPS (no date cutoff)', () => {
        const now = Math.floor(Date.now() / 1000);
        const r = selectInboxPhotos({
            gallery: {
                galleryImages: [
                    {uri: 'recentGps', hasGps: true, date: now - 10},
                    {uri: 'oldNoGps', hasGps: false, date: now - DAY * 100},
                    {uri: 'old400Gps', hasGps: true, date: now - DAY * 400}
                ],
                dismissedUris: []
            }
        });
        // all three included, newest-first; non-geotagged NOT filtered out
        expect(r.map(p => p.uri)).toEqual(['recentGps', 'oldNoGps', 'old400Gps']);
    });

    it('excludes dismissed photos but keeps non-geotagged ones', () => {
        const now = Math.floor(Date.now() / 1000);
        const r = selectInboxPhotos({
            gallery: {
                galleryImages: [
                    {uri: 'keepGps', hasGps: true, date: now},
                    {uri: 'keepNoGps', hasGps: false, date: now - 1},
                    {uri: 'dropped', hasGps: true, date: now - 2}
                ],
                dismissedUris: ['dropped']
            }
        });
        expect(r.map(p => p.uri)).toEqual(['keepGps', 'keepNoGps']);
    });
});
