import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = vi.hoisted(() => ({
  indices: {
    exists: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue({}),
  },
  index: vi.fn().mockResolvedValue({}),
  exists: vi.fn().mockResolvedValue(false),
  count: vi.fn().mockResolvedValue({ count: 42 }),
}));

vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => mockClient),
}));

import { recipeId, ensureIndex, countRecipes, recipeExists, upsertRecipe } from '../services/store.js';

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
    mockClient.indices.exists.mockResolvedValue(false);
    mockClient.indices.create.mockResolvedValue({});
    mockClient.index.mockResolvedValue({});
    mockClient.exists.mockResolvedValue(false);
    mockClient.count.mockResolvedValue({ count: 42 });
  });

  it('ensureIndex creates index when missing', async () => {
    await ensureIndex();
    expect(mockClient.indices.exists).toHaveBeenCalled();
    expect(mockClient.indices.create).toHaveBeenCalled();
  });

  it('ensureIndex skips creation when index exists', async () => {
    mockClient.indices.exists.mockResolvedValue(true);
    await ensureIndex();
    expect(mockClient.indices.create).not.toHaveBeenCalled();
  });

  it('countRecipes returns count from response', async () => {
    const count = await countRecipes();
    expect(count).toBe(42);
  });

  it('recipeExists returns false when exists returns false', async () => {
    const exists = await recipeExists('https://example.com/pasta');
    expect(exists).toBe(false);
  });

  it('recipeExists returns true when exists returns true', async () => {
    mockClient.exists.mockResolvedValue(true);
    const exists = await recipeExists('https://example.com/pasta');
    expect(exists).toBe(true);
  });

  it('upsertRecipe calls client.index with deterministic id', async () => {
    await upsertRecipe('https://example.com/pasta', samplePayload);
    expect(mockClient.index).toHaveBeenCalled();
    const call = mockClient.index.mock.calls[0][0];
    expect(call.id).toBe(recipeId('https://example.com/pasta'));
  });

  it('upsertRecipe stores bilingual payload fields', async () => {
    await upsertRecipe('https://example.com/pasta', samplePayload);
    const call = mockClient.index.mock.calls[0][0];
    const stored = call.document;
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
    const call = mockClient.index.mock.calls[0][0];
    const stored = call.document;
    expect(stored.id).toBe(recipeId(url));
  });
});
