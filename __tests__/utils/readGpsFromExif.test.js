/**
 * readGpsFromExif: reads GPS + capture time from a file's EXIF in one pass.
 * Capture time (takenAt) replaces RNIP's includeExtra timestamp so gallery
 * imports record when the photo was TAKEN, not when it was imported.
 */
jest.mock('@lodev09/react-native-exify', () => ({read: jest.fn()}));
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}));

import {read as mockRead} from '@lodev09/react-native-exify';
import {readGpsFromExif} from '../../utils/readGpsFromExif';

const GPS = {
    GPSLatitude: 53.349,
    GPSLatitudeRef: 'N',
    GPSLongitude: 6.26,
    GPSLongitudeRef: 'W'
};

// EXIF has no timezone — parsed as local, so build the expected value the same way
const expectedEpoch = (y, mo, d, h, mi, s) =>
    Math.floor(new Date(y, mo - 1, d, h, mi, s).getTime() / 1000);

describe('readGpsFromExif', () => {
    afterEach(() => mockRead.mockReset());

    it('returns coordinates + EXIF capture time (DateTimeOriginal) as epoch seconds', async () => {
        mockRead.mockResolvedValueOnce({...GPS, DateTimeOriginal: '2024:03:15 14:30:00'});

        const r = await readGpsFromExif('file://photo.jpg');

        expect(r).toMatchObject({latitude: 53.349, longitude: -6.26});
        expect(r.takenAt).toBe(expectedEpoch(2024, 3, 15, 14, 30, 0));
    });

    it('falls back to DateTimeDigitized, then DateTime', async () => {
        mockRead.mockResolvedValueOnce({...GPS, DateTimeDigitized: '2022:01:02 03:04:05'});
        let r = await readGpsFromExif('file://a.jpg');
        expect(r.takenAt).toBe(expectedEpoch(2022, 1, 2, 3, 4, 5));

        mockRead.mockResolvedValueOnce({...GPS, DateTime: '2020:12:31 23:59:59'});
        r = await readGpsFromExif('file://b.jpg');
        expect(r.takenAt).toBe(expectedEpoch(2020, 12, 31, 23, 59, 59));
    });

    it('takenAt is null when EXIF has no date (caller falls back to import time)', async () => {
        mockRead.mockResolvedValueOnce({...GPS});

        const r = await readGpsFromExif('file://nodate.jpg');

        expect(r).toMatchObject({latitude: 53.349, longitude: -6.26, takenAt: null});
    });

    it('takenAt is null when the EXIF date is malformed', async () => {
        mockRead.mockResolvedValueOnce({...GPS, DateTimeOriginal: 'not-a-date'});

        const r = await readGpsFromExif('file://bad.jpg');

        expect(r.takenAt).toBeNull();
    });

    it('returns null when there is no valid GPS (even if a date is present)', async () => {
        mockRead.mockResolvedValueOnce({DateTimeOriginal: '2024:03:15 14:30:00'});

        expect(await readGpsFromExif('file://nogps.jpg')).toBeNull();
    });
});
