import isServerPhotoId from '../../utils/isServerPhotoId';

describe('isServerPhotoId', () => {
    it('accepts positive integers', () => {
        expect(isServerPhotoId(1)).toBe(true);
        expect(isServerPhotoId(42)).toBe(true);
        expect(isServerPhotoId(1234567)).toBe(true);
    });

    it('accepts positive integer strings (Laravel coerces these)', () => {
        expect(isServerPhotoId('1')).toBe(true);
        expect(isServerPhotoId('1234567')).toBe(true);
    });

    it('rejects local onboarding string ids', () => {
        expect(isServerPhotoId('onboarding_1700000000000_ab3f')).toBe(false);
    });

    it('rejects null / undefined / NaN', () => {
        expect(isServerPhotoId(null)).toBe(false);
        expect(isServerPhotoId(undefined)).toBe(false);
        expect(isServerPhotoId(NaN)).toBe(false);
    });

    it('rejects zero and negatives', () => {
        expect(isServerPhotoId(0)).toBe(false);
        expect(isServerPhotoId('0')).toBe(false);
        expect(isServerPhotoId(-5)).toBe(false);
    });

    it('rejects floats and junk strings', () => {
        expect(isServerPhotoId(1.5)).toBe(false);
        expect(isServerPhotoId('12abc')).toBe(false);
        expect(isServerPhotoId('  12  ')).toBe(false);
        expect(isServerPhotoId({})).toBe(false);
    });
});
