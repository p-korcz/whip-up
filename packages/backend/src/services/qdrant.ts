import { QdrantClient } from '@qdrant/js-client-rest';
import type { RecipePayload, RecipeResult, Language } from '../types/index.js';

const QDRANT_URL = process.env['QDRANT_URL'] ?? 'http://localhost:6333';
const COLLECTION = process.env['QDRANT_COLLECTION'] ?? 'recipes';

export const qdrant = new QdrantClient({ url: QDRANT_URL });

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function ingredientsForLang(payload: RecipePayload, lang: Language): string[] {
  return lang === 'en' ? payload.ingredients_en : payload.ingredients_pl;
}

function payloadToResult(
  id: string,
  payload: RecipePayload,
  lang: Language,
  missingCount: number,
): RecipeResult {
  return {
    id,
    title: lang === 'en' ? payload.title_en : payload.title_pl,
    description: lang === 'en' ? payload.description_en : payload.description_pl,
    author: payload.author,
    sourceUrl: payload.source_page,
    directUrl: payload.direct_url,
    ingredients: ingredientsForLang(payload, lang),
    steps: lang === 'en' ? payload.steps_en : payload.steps_pl,
    missingIngredientsCount: missingCount,
    imageUrl: payload.imageUrl,
  };
}

export async function autocompleteIngredients(
  query: string,
  lang: Language,
): Promise<string[]> {
  const q = normalize(query);
  if (!q) return [];

  const result = await qdrant.scroll(COLLECTION, {
    limit: 1000,
    with_payload: true,
    with_vector: false,
  });

  const seen = new Set<string>();
  for (const point of result.points) {
    const payload = point.payload as unknown as RecipePayload | undefined;
    if (!payload) continue;
    const ings = ingredientsForLang(payload, lang);
    for (const ing of ings) {
      const normalized = normalize(ing);
      if (normalized.includes(q) && !seen.has(normalized)) {
        seen.add(normalized);
      }
    }
  }

  return [...seen].sort().slice(0, 10);
}

export async function searchRecipes(
  ingredients: string[],
  lang: Language,
): Promise<RecipeResult[]> {
  const provided = new Set(ingredients.map(normalize));

  const result = await qdrant.scroll(COLLECTION, {
    limit: 500,
    with_payload: true,
    with_vector: false,
  });

  const recipes: RecipeResult[] = result.points
    .map((point) => {
      const payload = point.payload as unknown as RecipePayload;
      const ings = ingredientsForLang(payload, lang);
      if (ings.length === 0) return null;
      const missing = ings.filter((i) => !provided.has(normalize(i))).length;
      return payloadToResult(String(point.id), payload, lang, missing);
    })
    .filter((r): r is RecipeResult => r !== null);

  return recipes
    .sort((a, b) => a.missingIngredientsCount - b.missingIngredientsCount)
    .slice(0, 50);
}

export async function getRecipeById(id: string, lang: Language): Promise<RecipeResult | null> {
  const results = await qdrant.retrieve(COLLECTION, {
    ids: [id],
    with_payload: true,
    with_vector: false,
  });

  if (results.length === 0) return null;

  const point = results[0];
  const payload = point.payload as unknown as RecipePayload;
  return payloadToResult(String(point.id), payload, lang, 0);
}
