import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

vi.mock('../services/elasticsearch.js', () => ({
  autocompleteIngredients: vi.fn(),
  searchRecipes: vi.fn(),
  getRecipeById: vi.fn(),
}));

import { autocompleteIngredients, searchRecipes, getRecipeById } from '../services/elasticsearch.js';

const app = createApp();

const mockRecipe = {
  id: '1',
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta',
  author: 'Chef A',
  sourceUrl: 'https://example.com',
  directUrl: 'https://example.com/pasta-carbonara',
  ingredients: ['200g pasta', '3 eggs', '100g bacon'],
  steps: ['Boil pasta', 'Fry bacon', 'Mix eggs with pasta'],
  missingIngredientsCount: 1,
};

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/ingredients/autocomplete', () => {
  beforeEach(() => {
    vi.mocked(autocompleteIngredients).mockResolvedValue(['pasta', 'parsley']);
  });

  it('returns ingredients key for valid query', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete?q=pa&lang=en');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ingredients: ['pasta', 'parsley'] });
  });

  it('defaults lang to en when omitted', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete?q=pa');
    expect(res.status).toBe(200);
    expect(vi.mocked(autocompleteIngredients)).toHaveBeenCalledWith('pa', 'en');
  });

  it('passes lang=pl to service', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete?q=ma&lang=pl');
    expect(res.status).toBe(200);
    expect(vi.mocked(autocompleteIngredients)).toHaveBeenCalledWith('ma', 'pl');
  });

  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when q is empty string', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete?q=');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid lang', async () => {
    const res = await request(app).get('/api/ingredients/autocomplete?q=pa&lang=de');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/recipes/search', () => {
  beforeEach(() => {
    vi.mocked(searchRecipes).mockResolvedValue([mockRecipe]);
  });

  it('returns recipes for valid body', async () => {
    const res = await request(app)
      .post('/api/recipes/search')
      .send({ ingredients: ['pasta', 'eggs'], lang: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.recipes).toHaveLength(1);
    expect(res.body.recipes[0].title).toBe('Pasta Carbonara');
    expect(res.body.recipes[0].ingredients).toEqual(['200g pasta', '3 eggs', '100g bacon']);
  });

  it('returns 400 when ingredients is empty', async () => {
    const res = await request(app)
      .post('/api/recipes/search')
      .send({ ingredients: [], lang: 'en' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when lang is invalid', async () => {
    const res = await request(app)
      .post('/api/recipes/search')
      .send({ ingredients: ['pasta'], lang: 'de' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/api/recipes/search').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns recipe when found', async () => {
    vi.mocked(getRecipeById).mockResolvedValue(mockRecipe);
    const res = await request(app).get('/api/recipes/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Pasta Carbonara');
    expect(res.body.ingredients).toEqual(['200g pasta', '3 eggs', '100g bacon']);
  });

  it('defaults lang to en when omitted', async () => {
    vi.mocked(getRecipeById).mockResolvedValue(mockRecipe);
    await request(app).get('/api/recipes/1');
    expect(vi.mocked(getRecipeById)).toHaveBeenCalledWith('1', 'en');
  });

  it('passes lang=pl to service', async () => {
    vi.mocked(getRecipeById).mockResolvedValue(mockRecipe);
    await request(app).get('/api/recipes/1?lang=pl');
    expect(vi.mocked(getRecipeById)).toHaveBeenCalledWith('1', 'pl');
  });

  it('returns 404 when recipe not found', async () => {
    vi.mocked(getRecipeById).mockResolvedValue(null);
    const res = await request(app).get('/api/recipes/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Recipe not found' });
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(getRecipeById).mockRejectedValue(new Error('DB down'));
    const res = await request(app).get('/api/recipes/1');
    expect(res.status).toBe(500);
  });
});
