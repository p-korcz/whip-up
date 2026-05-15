import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { parseRecipePage, translateRecipe } from '../services/parser.js';

const sampleExtractToolInput = {
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta dish',
  author: 'Chef Test',
  ingredients: ['200g pasta', '3 eggs', '100g bacon'],
  steps: [
    { order: 1, description: 'Boil pasta' },
    { order: 2, description: 'Fry bacon' },
    { order: 3, description: 'Mix eggs with pasta' },
  ],
};

const sampleParsedRecipe = {
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta dish',
  author: 'Chef Test',
  ingredients: ['200g pasta', '3 eggs', '100g bacon'],
  steps: ['Boil pasta', 'Fry bacon', 'Mix eggs with pasta'],
};

function makeToolResponse(name: string, input: unknown) {
  return {
    content: [{ type: 'tool_use' as const, id: 'test-id', name, input }],
  };
}

describe('parseRecipePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for very short page text', async () => {
    const result = await parseRecipePage('too short', 'https://example.com');
    expect(result).toBeNull();
  });

  it('returns null when Claude returns no tool use', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'No recipe here' }] });
    const result = await parseRecipePage('a'.repeat(300), 'https://example.com');
    expect(result).toBeNull();
  });

  it('returns null when ingredients array is empty', async () => {
    mockCreate.mockResolvedValueOnce(
      makeToolResponse('extract_recipe', { ...sampleExtractToolInput, ingredients: [], steps: [] }),
    );
    const result = await parseRecipePage('a'.repeat(300), 'https://example.com');
    expect(result).toBeNull();
  });

  it('returns parsed recipe with string ingredients and flattened steps', async () => {
    mockCreate.mockResolvedValueOnce(makeToolResponse('extract_recipe', sampleExtractToolInput));
    const result = await parseRecipePage('a'.repeat(300), 'https://example.com');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Pasta Carbonara');
    expect(result?.ingredients).toEqual(['200g pasta', '3 eggs', '100g bacon']);
    expect(result?.steps).toEqual(['Boil pasta', 'Fry bacon', 'Mix eggs with pasta']);
  });

  it('returns null when API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await parseRecipePage('a'.repeat(300), 'https://example.com');
    expect(result).toBeNull();
  });
});

describe('translateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns original recipe when translation API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    const result = await translateRecipe(sampleParsedRecipe, 'pl');
    expect(result).toEqual(sampleParsedRecipe);
  });

  it('returns original recipe when no tool use in response', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] });
    const result = await translateRecipe(sampleParsedRecipe, 'pl');
    expect(result).toEqual(sampleParsedRecipe);
  });

  it('returns translated fields with string ingredients and steps', async () => {
    const translatedInput = {
      title: 'Makaron Carbonara',
      description: 'Klasyczne włoskie danie',
      ingredients: ['200g makaron', '3 jajka', '100g boczek'],
      steps: ['Ugotuj makaron', 'Usmaż boczek', 'Wymieszaj jajka z makaronem'],
    };
    mockCreate.mockResolvedValueOnce(makeToolResponse('translate_recipe', translatedInput));

    const result = await translateRecipe(sampleParsedRecipe, 'pl');
    expect(result.title).toBe('Makaron Carbonara');
    expect(result.ingredients).toEqual(['200g makaron', '3 jajka', '100g boczek']);
    expect(result.steps).toEqual(['Ugotuj makaron', 'Usmaż boczek', 'Wymieszaj jajka z makaronem']);
    // Preserves author from original
    expect(result.author).toBe('Chef Test');
  });
});
