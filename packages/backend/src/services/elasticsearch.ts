import { Client } from '@elastic/elasticsearch';
import type { RecipePayload, RecipeResult, Language } from '../types/index.js';

const ELASTICSEARCH_URL = process.env['ELASTICSEARCH_URL'] ?? 'http://localhost:9200';
const INDEX = process.env['ELASTICSEARCH_INDEX'] ?? 'recipes';

export const client = new Client({ node: ELASTICSEARCH_URL });

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Escape special regex characters for use inside ES `include` pattern */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  const response = await client.search({
    index: INDEX,
    size: 0,
    body: {
      aggs: {
        ingredient_values: {
          terms: {
            field: `ingredients_${lang}`,
            size: 1000,
            include: `.*${escapeRegex(q)}.*`,
          },
        },
      },
    },
  });

  const buckets =
    (response.aggregations?.['ingredient_values'] as { buckets: Array<{ key: string }> })
      ?.buckets ?? [];

  return buckets
    .map((b) => b.key)
    .sort()
    .slice(0, 10);
}

export async function searchRecipes(
  ingredients: string[],
  lang: Language,
): Promise<RecipeResult[]> {
  const provided = new Set(ingredients.map(normalize));

  const response = await client.search({
    index: INDEX,
    size: 500,
    body: {
      query: {
        terms: { [`ingredients_${lang}`]: ingredients.map(normalize) },
      },
    },
  });

  const hits = (response.hits?.hits ?? []) as Array<{
    _id: string;
    _source: RecipePayload;
  }>;

  const recipes: RecipeResult[] = hits
    .map((hit) => {
      const payload = hit._source;
      const ings = ingredientsForLang(payload, lang);
      if (ings.length === 0) return null;
      const missing = ings.filter((i) => !provided.has(normalize(i))).length;
      return payloadToResult(hit._id, payload, lang, missing);
    })
    .filter((r): r is RecipeResult => r !== null);

  return recipes
    .sort((a, b) => a.missingIngredientsCount - b.missingIngredientsCount)
    .slice(0, 50);
}

export async function getRecipeById(id: string, lang: Language): Promise<RecipeResult | null> {
  try {
    const response = await client.get<RecipePayload>({ index: INDEX, id });
    if (!response.found) return null;
    const payload = response._source as RecipePayload;
    return payloadToResult(response._id, payload, lang, 0);
  } catch (err: unknown) {
    // Elasticsearch throws a ResponseError with statusCode 404 when doc not found
    if (
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 404
    ) {
      return null;
    }
    throw err;
  }
}
