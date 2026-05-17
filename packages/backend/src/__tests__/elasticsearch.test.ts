import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  search: vi.fn(),
  get: vi.fn(),
}));

vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => mockClient),
}));

import {
  autocompleteIngredients,
  searchRecipes,
  getRecipeById,
} from '../services/elasticsearch.js';
import type { RecipePayload } from '../types/index.js';

const basePayload: RecipePayload = {
  id: 'abc-123',
  title_en: 'Pasta Carbonara',
  title_pl: 'Makaron Carbonara',
  description_en: 'Classic Italian pasta',
  description_pl: 'Klasyczne włoskie danie',
  author: 'Chef Mario',
  ingredients_en: ['200g pasta', '3 eggs', '100g bacon', 'black pepper'],
  ingredients_pl: ['200g makaron', '3 jajka', '100g boczek', 'czarny pieprz'],
  steps_en: ['Boil pasta', 'Fry bacon', 'Mix eggs with pasta'],
  steps_pl: ['Ugotuj makaron', 'Usmaż boczek', 'Wymieszaj jajka z makaronem'],
  source_page: 'https://allrecipes.com',
  direct_url: 'https://allrecipes.com/recipe/123/pasta-carbonara',
  language_origin: 'en',
  created_at: '2026-01-01T00:00:00.000Z',
  imageUrl: 'https://cdn.allrecipes.com/carbonara.jpg',
};

/** Build a mock ES search response with aggregation buckets */
function makeAggResponse(keys: string[]) {
  return {
    aggregations: {
      ingredient_values: {
        buckets: keys.map((key) => ({ key, doc_count: 1 })),
      },
    },
    hits: { hits: [] },
  };
}

/** Build a mock ES search response with document hits */
function makeHitsResponse(hits: Array<{ _id: string; _source: RecipePayload }>) {
  return {
    hits: { hits },
  };
}

/** Build a mock ES get response for a found document */
function makeGetResponse(id: string, source: RecipePayload) {
  return { found: true, _id: id, _source: source };
}

describe('autocompleteIngredients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const result = await autocompleteIngredients('', 'en');
    expect(result).toEqual([]);
    expect(mockClient.search).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const result = await autocompleteIngredients('   ', 'en');
    expect(result).toEqual([]);
  });

  it('returns matching english ingredients for lang=en', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeAggResponse(['200g pasta', '3 eggs']),
    );

    const result = await autocompleteIngredients('pas', 'en');
    expect(result).toContain('200g pasta');
    expect(result).not.toContain('200g makaron');
  });

  it('uses ingredients_pl field for lang=pl', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeAggResponse(['200g makaron', '3 jajka']),
    );

    const result = await autocompleteIngredients('mak', 'pl');
    // Verify the correct field was queried
    const callBody = mockClient.search.mock.calls[0][0].body;
    expect(callBody.aggs.ingredient_values.terms.field).toBe('ingredients_pl');
    expect(result).toContain('200g makaron');
    expect(result).not.toContain('200g pasta');
  });

  it('returns deduplicated ingredients (aggregation buckets are unique by key)', async () => {
    // ES aggregation buckets are already unique per term — mock returns each key once
    mockClient.search.mockResolvedValueOnce(
      makeAggResponse(['200g pasta']),
    );

    const result = await autocompleteIngredients('pas', 'en');
    const count = result.filter((s) => s === '200g pasta').length;
    expect(count).toBe(1);
  });

  it('returns at most 10 results', async () => {
    const manyKeys = Array.from({ length: 20 }, (_, i) => `pasta ${i}`);
    mockClient.search.mockResolvedValueOnce(makeAggResponse(manyKeys));

    const result = await autocompleteIngredients('pasta', 'en');
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('returns results sorted alphabetically', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeAggResponse(['zucchini', 'apple', 'mango']),
    );

    const result = await autocompleteIngredients('a', 'en');
    expect(result).toEqual([...result].sort());
  });

  it('returns empty array when no buckets match', async () => {
    mockClient.search.mockResolvedValueOnce(makeAggResponse([]));

    const result = await autocompleteIngredients('xyz', 'en');
    expect(result).toEqual([]);
  });
});

describe('searchRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns results sorted by missingIngredientsCount ascending', async () => {
    const payload2: RecipePayload = {
      ...basePayload,
      title_en: 'Simple Omelette',
      title_pl: 'Prosty Omlet',
      ingredients_en: ['3 eggs', 'salt'],
      ingredients_pl: ['3 jajka', 'sól'],
    };

    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([
        { _id: 'p1', _source: basePayload },
        { _id: 'p2', _source: payload2 },
      ]),
    );

    // Provide only '3 eggs' — carbonara has 3 more missing, omelette has 1 more missing
    const result = await searchRecipes(['3 eggs'], 'en');
    expect(result[0].missingIngredientsCount).toBeLessThanOrEqual(
      result[result.length - 1].missingIngredientsCount,
    );
  });

  it('projects english fields for lang=en', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([{ _id: 'p1', _source: basePayload }]),
    );

    const result = await searchRecipes(['pasta'], 'en');
    expect(result[0].title).toBe('Pasta Carbonara');
    expect(result[0].ingredients).toContain('200g pasta');
    expect(result[0].steps[0]).toBe('Boil pasta');
  });

  it('projects polish fields for lang=pl', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([{ _id: 'p1', _source: basePayload }]),
    );

    const result = await searchRecipes(['makaron'], 'pl');
    expect(result[0].title).toBe('Makaron Carbonara');
    expect(result[0].ingredients).toContain('200g makaron');
    expect(result[0].steps[0]).toBe('Ugotuj makaron');
  });

  it('maps source_page to sourceUrl and direct_url to directUrl', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([{ _id: 'p1', _source: basePayload }]),
    );

    const result = await searchRecipes(['pasta'], 'en');
    expect(result[0].sourceUrl).toBe('https://allrecipes.com');
    expect(result[0].directUrl).toBe(
      'https://allrecipes.com/recipe/123/pasta-carbonara',
    );
  });

  it('skips recipes with empty ingredient list for the requested lang', async () => {
    const emptyPayload: RecipePayload = {
      ...basePayload,
      ingredients_en: [],
    };

    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([{ _id: 'p1', _source: emptyPayload }]),
    );

    const result = await searchRecipes(['pasta'], 'en');
    expect(result).toHaveLength(0);
  });

  it('returns at most 50 results', async () => {
    const hits = Array.from({ length: 60 }, (_, i) => ({
      _id: `p${i}`,
      _source: { ...basePayload, ingredients_en: ['pasta'] },
    }));
    mockClient.search.mockResolvedValueOnce(makeHitsResponse(hits));

    const result = await searchRecipes(['pasta'], 'en');
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('computes missingIngredientsCount correctly using exact normalized matching', async () => {
    mockClient.search.mockResolvedValueOnce(
      makeHitsResponse([{ _id: 'p1', _source: basePayload }]),
    );

    // Ingredients: ['200g pasta','3 eggs','100g bacon','black pepper']
    // Providing '200g pasta' (exact normalized match) → 3 missing
    const result = await searchRecipes(['200g pasta'], 'en');
    expect(result[0].missingIngredientsCount).toBe(3);
  });
});

describe('getRecipeById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when point is not found', async () => {
    mockClient.get.mockResolvedValueOnce({ found: false, _id: 'nonexistent', _source: null });

    const result = await getRecipeById('nonexistent', 'en');
    expect(result).toBeNull();
  });

  it('returns null when ES throws a 404 error', async () => {
    const err = { statusCode: 404, message: 'Not Found' };
    mockClient.get.mockRejectedValueOnce(err);

    const result = await getRecipeById('missing', 'en');
    expect(result).toBeNull();
  });

  it('returns RecipeResult with english fields for lang=en', async () => {
    mockClient.get.mockResolvedValueOnce(makeGetResponse('p1', basePayload));

    const result = await getRecipeById('p1', 'en');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Pasta Carbonara');
    expect(result?.description).toBe('Classic Italian pasta');
    expect(result?.ingredients).toEqual(['200g pasta', '3 eggs', '100g bacon', 'black pepper']);
    expect(result?.steps[0]).toBe('Boil pasta');
  });

  it('returns RecipeResult with polish fields for lang=pl', async () => {
    mockClient.get.mockResolvedValueOnce(makeGetResponse('p1', basePayload));

    const result = await getRecipeById('p1', 'pl');
    expect(result?.title).toBe('Makaron Carbonara');
    expect(result?.description).toBe('Klasyczne włoskie danie');
    expect(result?.ingredients).toContain('200g makaron');
  });

  it('returns missingIngredientsCount of 0 for detail view', async () => {
    mockClient.get.mockResolvedValueOnce(makeGetResponse('p1', basePayload));

    const result = await getRecipeById('p1', 'en');
    expect(result?.missingIngredientsCount).toBe(0);
  });

  it('maps id, sourceUrl, directUrl, imageUrl correctly', async () => {
    mockClient.get.mockResolvedValueOnce(makeGetResponse('p1', basePayload));

    const result = await getRecipeById('p1', 'en');
    expect(result?.id).toBe('p1');
    expect(result?.sourceUrl).toBe('https://allrecipes.com');
    expect(result?.directUrl).toBe(
      'https://allrecipes.com/recipe/123/pasta-carbonara',
    );
    expect(result?.imageUrl).toBe('https://cdn.allrecipes.com/carbonara.jpg');
  });

  it('returns undefined description when description_en is absent', async () => {
    const noDescPayload: RecipePayload = {
      ...basePayload,
      description_en: undefined,
      description_pl: undefined,
    };
    mockClient.get.mockResolvedValueOnce(makeGetResponse('p1', noDescPayload));

    const result = await getRecipeById('p1', 'en');
    expect(result?.description).toBeUndefined();
  });

  it('rethrows non-404 errors', async () => {
    const err = { statusCode: 500, message: 'Internal Server Error' };
    mockClient.get.mockRejectedValueOnce(err);

    await expect(getRecipeById('p1', 'en')).rejects.toMatchObject({ statusCode: 500 });
  });
});
