import {getTagsFromBackend} from '../../utils/getTagsFromBackend';

describe('getTagsFromBackend', () => {
    it('returns empty arrays for null/undefined input', () => {
        expect(getTagsFromBackend(null)).toEqual({tags: [], imageCustomTags: []});
        expect(getTagsFromBackend(undefined)).toEqual({tags: [], imageCustomTags: []});
    });

    it('converts a basic CLO tag', () => {
        const apiTags = [{
            category_litter_object_id: 42,
            litter_object_type_id: null,
            quantity: 3,
            picked_up: true,
            category: {key: 'smoking'},
            object: {key: 'butts'},
            type: null,
            extra_tags: []
        }];
        const {tags, imageCustomTags} = getTagsFromBackend(apiTags);
        expect(tags).toHaveLength(1);
        expect(tags[0].cloId).toBe(42);
        expect(tags[0].quantity).toBe(3);
        expect(tags[0].materials).toEqual([]);
        expect(imageCustomTags).toEqual([]);
    });

    it('promotes custom-only entries to image-level', () => {
        const apiTags = [{
            category_litter_object_id: null,
            category: null,
            object: null,
            extra_tags: [
                {type: 'custom_tag', tag: {key: 'graffiti'}},
                {type: 'custom_tag', tag: {key: 'sticker'}}
            ]
        }];
        const {tags, imageCustomTags} = getTagsFromBackend(apiTags);
        expect(tags).toEqual([]);
        expect(imageCustomTags).toEqual(['graffiti', 'sticker']);
    });

    it('deduplicates image-level custom tags', () => {
        const apiTags = [
            {category: null, object: null, category_litter_object_id: null,
                extra_tags: [{type: 'custom_tag', tag: {key: 'dirty'}}]},
            {category: null, object: null, category_litter_object_id: null,
                extra_tags: [{type: 'custom_tag', tag: {key: 'dirty'}}]}
        ];
        const {imageCustomTags} = getTagsFromBackend(apiTags);
        expect(imageCustomTags).toEqual(['dirty']);
    });

    it('deduplicates CLO tags by (cloId, typeId)', () => {
        const apiTags = [
            {category_litter_object_id: 42, litter_object_type_id: null,
                quantity: 2, category: {key: 'a'}, object: {key: 'b'}, extra_tags: []},
            {category_litter_object_id: 42, litter_object_type_id: null,
                quantity: 5, category: {key: 'a'}, object: {key: 'b'}, extra_tags: []}
        ];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags).toHaveLength(1);
        expect(tags[0].quantity).toBe(5); // takes higher
    });

    it('deduplicates materials within a tag', () => {
        const apiTags = [{
            category_litter_object_id: 1, category: {key: 'a'}, object: {key: 'b'},
            extra_tags: [
                {type: 'material', tag: {id: 10}},
                {type: 'material', tag: {id: 10}},
                {type: 'material', tag: {id: 20}}
            ]
        }];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags[0].materials).toEqual([10, 20]);
    });

    it('uses ?? instead of || for quantity (preserves 0)', () => {
        const apiTags = [{
            category_litter_object_id: 1, quantity: 0,
            category: {key: 'a'}, object: {key: 'b'}, extra_tags: []
        }];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags[0].quantity).toBe(0);
    });

    it('does not drop id=0 for materials/brands', () => {
        const apiTags = [{
            category_litter_object_id: 1, category: {key: 'a'}, object: {key: 'b'},
            extra_tags: [
                {type: 'material', tag: {id: 0}},
                {type: 'brand', tag: {id: 0}, quantity: 1}
            ]
        }];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags[0].materials).toEqual([0]);
        expect(tags[0].brands).toEqual([{id: 0, quantity: 1}]);
    });

    it('sets typeId when litter_object_type_id is present', () => {
        const apiTags = [{
            category_litter_object_id: 1, litter_object_type_id: 7,
            category: {key: 'a'}, object: {key: 'b'}, type: {key: 'juice'},
            extra_tags: []
        }];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags[0].typeId).toBe(7);
        expect(tags[0].fallbackDisplayName).toBe('Juice B');
    });

    it('handles non-array extra_tags gracefully', () => {
        const apiTags = [{
            category_litter_object_id: 1,
            category: {key: 'a'}, object: {key: 'b'},
            extra_tags: null
        }];
        const {tags} = getTagsFromBackend(apiTags);
        expect(tags).toHaveLength(1);
        expect(tags[0].materials).toEqual([]);
    });
});
