import type { AutocompleteResponse, Lang, RecipeResult, SearchResponse } from './types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function fetchAutocomplete(
  q: string,
  lang: Lang,
  signal?: AbortSignal
): Promise<string[]> {
  const url = `${BASE}/api/ingredients/autocomplete?q=${encodeURIComponent(q)}&lang=${lang}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('autocomplete_failed');
  const data = (await res.json()) as AutocompleteResponse;
  return data.ingredients ?? [];
}

export async function searchRecipes(
  ingredients: string[],
  lang: Lang
): Promise<SearchResponse> {
  const res = await fetch(`${BASE}/api/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, lang }),
  });
  if (!res.ok) throw new Error('search_failed');
  return res.json() as Promise<SearchResponse>;
}

export async function fetchRecipeDetail(id: string, lang: Lang): Promise<RecipeResult> {
  const res = await fetch(
    `${BASE}/api/recipes/${encodeURIComponent(id)}?lang=${lang}`
  );
  if (!res.ok) throw new Error('recipe_not_found');
  return res.json() as Promise<RecipeResult>;
}
