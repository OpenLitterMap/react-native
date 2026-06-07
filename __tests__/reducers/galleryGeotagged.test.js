/**
 * selectGeotaggedPhotos: all loaded GEOTAGGED photos, newest-first, minus
 * dismissed — no date window. Non-geotagged photos are excluded (can't be
 * mapped); the user pages in more via "Load more photos" to surface older ones.
 */
jest.mock('@react-native-camera-roll/camera-roll', () => ({CameraRoll: {}}));
jest.mock('@lodev09/react-native-exify', () => ({}));
jest.mock('@sentry/react-native', () => ({captureException: jest.fn(), setUser: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {get: jest.fn(), post: jest.fn(), put: jest.fn()}}));

import {selectGeotaggedPhotos} from '../../reducers/gallery_reducer';

const DAY = 60 * 60 * 24;

describe('selectGeotaggedPhotos', () => {
    it('returns geotagged photos newest-first regardless of age (no 7-day cutoff)', () => {
        const now = Math.floor(Date.now() / 1000);
        const r = selectGeotaggedPhotos({
            gallery: {
                galleryImages: [
                    {uri: 'recent', hasGps: true, date: now - 10},
                    {uri: 'old100', hasGps: true, date: now - DAY * 100},
                    {uri: 'nogps', hasGps: false, date: now - 5},
                    {uri: 'old400', hasGps: true, date: now - DAY * 400}
                ],
                dismissedUris: []
            }
        });
        // newest-first, no date cutoff; non-geotagged 'nogps' excluded
        expect(r.map(p => p.uri)).toEqual(['recent', 'old100', 'old400']);
    });

    it('excludes non-geotagged and dismissed photos', () => {
        const now = Math.floor(Date.now() / 1000);
        const r = selectGeotaggedPhotos({
            gallery: {
                galleryImages: [
                    {uri: 'keep', hasGps: true, date: now},
                    {uri: 'drop', hasGps: true, date: now - 1},
                    {uri: 'nogps', hasGps: false, date: now}
                ],
                dismissedUris: ['drop']
            }
        });
        expect(r.map(p => p.uri)).toEqual(['keep']);
    });
});
