import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecipeSearch } from './useRecipeSearch';

const mockRecipes = [
  { id: '1', title: 'Recipe A', missingIngredientsCount: 2, sourceUrl: '', directUrl: '', ingredients: ['a', 'b', 'c'], steps: [], author: '' },
  { id: '2', title: 'Recipe B', missingIngredientsCount: 0, sourceUrl: '', directUrl: '', ingredients: ['a', 'b'], steps: [], author: '' },
  { id: '3', title: 'Recipe C', missingIngredientsCount: 1, sourceUrl: '', directUrl: '', ingredients: ['a', 'b', 'c', 'd'], steps: [], author: '' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useRecipeSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useRecipeSearch(), { wrapper });
    expect(result.current.recipes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it('returns recipes on successful search', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: mockRecipes }),
    });

    const { result } = renderHook(() => useRecipeSearch(), { wrapper });

    act(() => {
      result.current.search(['egg'], 'en');
    });

    await waitFor(() => expect(result.current.hasSearched).toBe(true));
    expect(result.current.recipes).toHaveLength(3);
    expect(result.current.error).toBe(false);
  });

  it('sets error on failed fetch', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useRecipeSearch(), { wrapper });

    act(() => {
      result.current.search(['egg'], 'en');
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.recipes).toEqual([]);
  });

  it('resets state on reset()', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: mockRecipes }),
    });

    const { result } = renderHook(() => useRecipeSearch(), { wrapper });

    act(() => {
      result.current.search(['egg'], 'en');
    });

    await waitFor(() => expect(result.current.hasSearched).toBe(true));

    act(() => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.hasSearched).toBe(false));
    expect(result.current.recipes).toEqual([]);
    expect(result.current.error).toBe(false);
  });
});
