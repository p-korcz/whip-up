export type Language = 'en' | 'pl';

export interface RecipeStep {
  order: number;
  description: string;
}

/** Shape stored in Qdrant — single bilingual record per recipe URL */
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

/** Raw output from Claude's structured extraction for one language */
export interface ParsedRecipe {
  title: string;
  description: string;
  author: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
}

/** Intermediate shape from the extract tool before flattening steps */
export interface ExtractedRecipeRaw {
  title: string;
  description: string;
  author: string;
  ingredients: string[];
  steps: Array<{ order: number; description: string }>;
  imageUrl?: string;
}
