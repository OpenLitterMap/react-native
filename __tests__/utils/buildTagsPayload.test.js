import buildTagsPayload from '../../utils/buildTagsPayload';

describe('buildTagsPayload', () => {
    it('returns null for image with no tags and no custom tags', () => {
        expect(buildTagsPayload({tags: [], customTags: []})).toBe(null);
        expect(buildTagsPayload({})).toBe(null);
    });

    it('builds CLO tag payload', () => {
        const img = {
            tags: [{
                cloId: 42,
                typeId: null,
                quantity: 2,
                picked_up: true,
                materials: [1, 2],
                brands: [{id: 5, quantity: 1}],
                customTags: ['dirty']
            }],
            customTags: []
        };
        const result = buildTagsPayload(img);
        expect(result).toHaveLength(1);
        expect(result[0].category_litter_object_id).toBe(42);
        expect(result[0].quantity).toBe(2);
        expect(result[0].picked_up).toBe(true);
        expect(result[0].materials).toEqual([1, 2]);
        expect(result[0].brands).toEqual([{id: 5, quantity: 1}]);
        expect(result[0].custom_tags).toEqual(['dirty']);
    });

    it('filters out tags with missing cloId', () => {
        const img = {
            tags: [
                {cloId: 42, quantity: 1, materials: [], brands: [], customTags: []},
                {cloId: null, quantity: 1, materials: [], brands: [], customTags: []},
                {quantity: 1, materials: [], brands: [], customTags: []}
            ],
            customTags: []
        };
        const result = buildTagsPayload(img);
        expect(result).toHaveLength(1);
        expect(result[0].category_litter_object_id).toBe(42);
    });

    it('merges image-level custom tags into first CLO tag (deduped across ALL tags)', () => {
        const img = {
            tags: [
                {cloId: 1, quantity: 1, materials: [], brands: [], customTags: ['a']},
                {cloId: 2, quantity: 1, materials: [], brands: [], customTags: ['b']}
            ],
            customTags: ['a', 'c'] // 'a' exists on tag 1, 'b' on tag 2
        };
        const result = buildTagsPayload(img);
        // 'a' deduped (exists on tag 1), 'b' deduped (exists on tag 2), only 'c' added
        expect(result[0].custom_tags).toEqual(['a', 'c']);
    });

    it('builds custom-only payload when no CLO tags', () => {
        const img = {
            tags: [],
            customTags: ['red', 'metal']
        };
        const result = buildTagsPayload(img);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({custom: true, key: 'red', quantity: 1, picked_up: null});
        expect(result[1]).toEqual({custom: true, key: 'metal', quantity: 1, picked_up: null});
    });
});
