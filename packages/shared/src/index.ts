export type Language = 'en' | 'pl';

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeStep {
  order: number;
  description: string;
}

/** Shape stored in Qdrant — one record per language */
export interface RecipePayload {
  title: string;
  description: string;
  author: string;
  sourceUrl: string;
  sourcePage: string;
  lang: Language;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  imageUrl?: string;
}

export interface RecipeSearchRequest {
  ingredients: string[];
  lang: Language;
}

export interface RecipeResult extends RecipePayload {
  id: string;
  missingIngredientsCount: number;
}

export interface RecipeSearchResponse {
  recipes: RecipeResult[];
}

export interface AutocompleteResponse {
  ingredients: string[];
}
