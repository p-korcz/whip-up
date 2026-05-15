import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  },
}));

import axios from 'axios';
import { fetchPage, discoverRecipeLinks } from '../services/fetcher.js';

const mockAxiosInstance = axios.create();

describe('fetchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null on network error', async () => {
    vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchPage('https://example.com/recipe');
    expect(result).toBeNull();
  });

  it('returns page data on success', async () => {
    vi.mocked(mockAxiosInstance.get).mockResolvedValueOnce({
      data: '<html><head><title>Pasta Recipe</title></head><body><p>Great pasta recipe with eggs and bacon.</p></body></html>',
    });

    const result = await fetchPage('https://example.com/recipe');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Pasta Recipe');
    expect(result?.url).toBe('https://example.com/recipe');
    expect(result?.text).toContain('pasta recipe');
  });

  it('extracts h1 as title when no title tag', async () => {
    vi.mocked(mockAxiosInstance.get).mockResolvedValueOnce({
      data: '<html><body><h1>Carbonara</h1><p>Steps here</p></body></html>',
    });

    const result = await fetchPage('https://example.com/recipe');
    expect(result?.title).toBe('Carbonara');
  });
});

describe('discoverRecipeLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array on fetch failure', async () => {
    vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce(new Error('Network error'));
    const links = await discoverRecipeLinks('https://example.com', /\/recipe\//);
    expect(links).toEqual([]);
  });

  it('extracts matching links from page', async () => {
    vi.mocked(mockAxiosInstance.get).mockResolvedValueOnce({
      data: `<html><body>
        <a href="/recipe/pasta">Pasta</a>
        <a href="/recipe/soup">Soup</a>
        <a href="/about">About</a>
        <a href="https://other.com/recipe/cake">External</a>
      </body></html>`,
    });

    const links = await discoverRecipeLinks('https://example.com', /example\.com\/recipe\//);
    expect(links).toHaveLength(2);
    expect(links).toContain('https://example.com/recipe/pasta');
    expect(links).toContain('https://example.com/recipe/soup');
  });

  it('deduplicates links', async () => {
    vi.mocked(mockAxiosInstance.get).mockResolvedValueOnce({
      data: `<html><body>
        <a href="/recipe/pasta">Pasta 1</a>
        <a href="/recipe/pasta">Pasta 2</a>
      </body></html>`,
    });

    const links = await discoverRecipeLinks('https://example.com', /example\.com\/recipe\//);
    expect(links).toHaveLength(1);
  });
});
