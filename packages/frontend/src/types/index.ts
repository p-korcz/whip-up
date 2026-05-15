export type Lang = 'en' | 'pl';

/** Matches backend RecipeResult — used for both search results and detail */
export interface RecipeResult {
  id: string;
  title: string;
  description?: string;
  author?: string;
  sourceUrl: string;
  directUrl: string;
  ingredients: string[];
  steps: string[];
  missingIngredientsCount: number;
  imageUrl?: string;
}

export interface AutocompleteResponse {
  ingredients: string[];
}

export interface SearchResponse {
  recipes: RecipeResult[];
}
