export type Language = 'en' | 'pl';

/** Qdrant payload shape — single bilingual record per recipe */
export interface RecipePayload {
  id: string;
  title_en: string;
  title_pl: string;
  description_en?: string;
  description_pl?: string;
  author?: string;
  ingredients_en: string[];
  ingredients_pl: string[];
  steps_en: string[];
  steps_pl: string[];
  source_page: string;
  direct_url: string;
  language_origin: Language;
  created_at: string;
  imageUrl?: string;
}

/** Shape returned to the frontend for a recipe result */
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
