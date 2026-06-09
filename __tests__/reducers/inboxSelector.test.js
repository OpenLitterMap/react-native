jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));
jest.mock('../../utils/apiClient', () => ({
    __esModule: true,
    default: {get: jest.fn(), post: jest.fn(), put: jest.fn()}
}));

import {selectInboxPhotos} from '../../reducers/photos_reducer';

const mk = imagesArray => ({photos: {imagesArray}});

describe('selectInboxPhotos (photos_reducer)', () => {
    it('returns local, non-uploaded, geotagged photos newest-first', () => {
        const r = selectInboxPhotos(mk([
            {id: 1, uri: 'a', lat: 1, lon: 2, date: 100, uploaded: false, type: 'gallery'},
            {id: 2, uri: 'b', lat: 3, lon: 4, date: 200, uploaded: false, type: 'image/jpeg'}
        ]));
        expect(r.map(p => p.uri)).toEqual(['b', 'a']);
        expect(r[0]).toMatchObject({hasGps: true, fromCamera: true});
        expect(r[1].fromCamera).toBe(false);
    });

    it('excludes uploaded photos and ones without coordinates', () => {
        const r = selectInboxPhotos(mk([
            {id: 1, uri: 'a', lat: 1, lon: 2, date: 100, uploaded: true, type: 'gallery'},
            {id: 2, uri: 'b', lat: null, lon: null, date: 200, uploaded: false, type: 'gallery'},
            {id: 3, uri: 'c', lat: 5, lon: 6, date: 300, uploaded: false, type: 'gallery'}
        ]));
        expect(r.map(p => p.uri)).toEqual(['c']);
    });

    it('excludes invalid coordinates (0,0 Null Island), matching isValidGpsCoords', () => {
        const r = selectInboxPhotos(mk([
            {id: 1, uri: 'a', lat: 0, lon: 0, date: 100, uploaded: false, type: 'gallery'},
            {id: 2, uri: 'b', lat: 5, lon: 6, date: 200, uploaded: false, type: 'gallery'}
        ]));
        expect(r.map(p => p.uri)).toEqual(['b']);
    });
});
