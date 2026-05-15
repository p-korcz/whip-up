import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  getCollections: vi.fn().mockResolvedValue({ collections: [] }),
  createCollection: vi.fn().mockResolvedValue({}),
  createPayloadIndex: vi.fn().mockResolvedValue({}),
  upsert: vi.fn().mockResolvedValue({}),
  retrieve: vi.fn().mockResolvedValue([]),
  getCollection: vi.fn().mockResolvedValue({ points_count: 42 }),
}));

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn().mockImplementation(() => mockClient),
}));

import { recipeId, ensureCollection, countRecipes, recipeExists, upsertRecipe } from '../services/store.js';

const samplePayload = {
  id: 'will-be-overwritten-by-recipeId',
  title_en: 'Pasta Carbonara',
  title_pl: 'Makaron Carbonara',
  description_en: 'Classic Italian pasta',
  description_pl: 'Klasyczne włoskie danie',
  author: 'Chef Test',
  ingredients_en: ['200g pasta', '3 eggs', '100g bacon'],
  ingredients_pl: ['200g makaron', '3 jajka', '100g boczek'],
  steps_en: ['Boil pasta', 'Fry bacon', 'Mix'],
  steps_pl: ['Ugotuj makaron', 'Usmaż boczek', 'Wymieszaj'],
  source_page: 'https://example.com',
  direct_url: 'https://example.com/pasta-carbonara',
  language_origin: 'en' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('recipeId', () => {
  it('produces a UUID-like string', () => {
    const id = recipeId('https://example.com/pasta');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('is deterministic for same url', () => {
    const a = recipeId('https://example.com/pasta');
    const b = recipeId('https://example.com/pasta');
    expect(a).toBe(b);
  });

  it('differs by url', () => {
    const a = recipeId('https://example.com/pasta');
    const b = recipeId('https://example.com/soup');
    expect(a).not.toBe(b);
  });
});

describe('store operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.getCollections.mockResolvedValue({ collections: [] });
    mockClient.createCollection.mockResolvedValue({});
    mockClient.createPayloadIndex.mockResolvedValue({});
    mockClient.upsert.mockResolvedValue({});
    mockClient.retrieve.mockResolvedValue([]);
    mockClient.getCollection.mockResolvedValue({ points_count: 42 });
  });

  it('ensureCollection creates collection when missing', async () => {
    await ensureCollection();
    expect(mockClient.getCollections).toHaveBeenCalled();
    expect(mockClient.createCollection).toHaveBeenCalled();
  });

  it('ensureCollection skips creation when collection exists', async () => {
    mockClient.getCollections.mockResolvedValue({ collections: [{ name: 'recipes' }] });
    await ensureCollection();
    expect(mockClient.createCollection).not.toHaveBeenCalled();
  });

  it('countRecipes returns point count from collection info', async () => {
    const count = await countRecipes();
    expect(count).toBe(42);
  });

  it('recipeExists returns false when retrieve returns empty', async () => {
    const exists = await recipeExists('https://example.com/pasta');
    expect(exists).toBe(false);
  });

  it('recipeExists returns true when retrieve returns a point', async () => {
    mockClient.retrieve.mockResolvedValue([{ id: 'some-id' }]);
    const exists = await recipeExists('https://example.com/pasta');
    expect(exists).toBe(true);
  });

  it('upsertRecipe calls qdrant.upsert with deterministic id', async () => {
    await upsertRecipe('https://example.com/pasta', samplePayload);
    expect(mockClient.upsert).toHaveBeenCalled();
    const call = mockClient.upsert.mock.calls[0];
    expect(call[1].points[0].id).toBe(recipeId('https://example.com/pasta'));
  });

  it('upsertRecipe stores bilingual payload fields', async () => {
    await upsertRecipe('https://example.com/pasta', samplePayload);
    const call = mockClient.upsert.mock.calls[0];
    const stored = call[1].points[0].payload;
    expect(stored.title_en).toBe('Pasta Carbonara');
    expect(stored.title_pl).toBe('Makaron Carbonara');
    expect(stored.description_en).toBe('Classic Italian pasta');
    expect(stored.description_pl).toBe('Klasyczne włoskie danie');
    expect(stored.ingredients_en).toEqual(['200g pasta', '3 eggs', '100g bacon']);
    expect(stored.ingredients_pl).toEqual(['200g makaron', '3 jajka', '100g boczek']);
  });

  it('upsertRecipe stores id field in payload', async () => {
    const url = 'https://example.com/pasta';
    const payloadWithId = { ...samplePayload, id: recipeId(url) };
    await upsertRecipe(url, payloadWithId);
    const call = mockClient.upsert.mock.calls[0];
    const stored = call[1].points[0].payload;
    expect(stored.id).toBe(recipeId(url));
  });
});
