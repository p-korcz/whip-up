import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecipeDetail } from './useRecipeDetail';

const mockRecipe = {
  id: 'abc-123',
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta',
  author: 'Chef Mario',
  sourceUrl: 'https://allrecipes.com',
  directUrl: 'https://allrecipes.com/recipe/123',
  ingredients: ['200g pasta', '3 eggs', '100g bacon'],
  steps: ['Boil pasta', 'Fry bacon', 'Mix'],
  missingIngredientsCount: 0,
  imageUrl: undefined,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useRecipeDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not fetch when id is null', () => {
    renderHook(() => useRecipeDetail(null, 'en'), { wrapper });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches and returns recipe data on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    const { result } = renderHook(() => useRecipeDetail('abc-123', 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Pasta Carbonara');
    expect(result.current.data?.ingredients).toEqual([
      '200g pasta',
      '3 eggs',
      '100g bacon',
    ]);
  });

  it('sets isError on failed fetch', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useRecipeDetail('bad-id', 'en'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('uses id and lang in the query key (refetches when lang changes)', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockRecipe, title: 'Pasta Carbonara' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockRecipe, title: 'Makaron Carbonara' }) });

    const { result, rerender } = renderHook(
      ({ lang }: { lang: 'en' | 'pl' }) => useRecipeDetail('abc-123', lang),
      { wrapper, initialProps: { lang: 'en' } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Pasta Carbonara');

    rerender({ lang: 'pl' });
    await waitFor(() =>
      expect(result.current.data?.title).toBe('Makaron Carbonara'),
    );
  });

  it('includes lang query param in the fetch URL', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderHook(() => useRecipeDetail('abc-123', 'pl'), { wrapper });

    await waitFor(() =>
      expect(fetch as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
    );

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('lang=pl');
    expect(url).toContain('abc-123');
  });
});
