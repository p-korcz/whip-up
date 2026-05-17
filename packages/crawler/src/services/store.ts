import { Client } from '@elastic/elasticsearch';
import { createHash } from 'crypto';
import type { RecipePayload } from '../types/index.js';

const ELASTICSEARCH_URL = process.env['ELASTICSEARCH_URL'] ?? 'http://localhost:9200';
const INDEX = process.env['ELASTICSEARCH_INDEX'] ?? 'recipes';

export const client = new Client({ node: ELASTICSEARCH_URL });

/** Deterministic UUID-style ID from the recipe's direct URL */
export function recipeId(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

export async function ensureIndex(): Promise<void> {
  const exists = await client.indices.exists({ index: INDEX });

  if (!exists) {
    await client.indices.create({
      index: INDEX,
      body: {
        mappings: {
          properties: {
            title_en: { type: 'text' },
            title_pl: { type: 'text' },
            description_en: { type: 'text' },
            description_pl: { type: 'text' },
            author: { type: 'keyword' },
            ingredients_en: { type: 'keyword' },
            ingredients_pl: { type: 'keyword' },
            steps_en: { type: 'text' },
            steps_pl: { type: 'text' },
            source_page: { type: 'keyword' },
            direct_url: { type: 'keyword' },
            language_origin: { type: 'keyword' },
            created_at: { type: 'date' },
            imageUrl: { type: 'keyword' },
          },
        },
      },
    });

    console.log(`Created Elasticsearch index: ${INDEX}`);
  }
}

export async function upsertRecipe(url: string, payload: RecipePayload): Promise<void> {
  const id = recipeId(url);
  await client.index({
    index: INDEX,
    id,
    document: payload as unknown as Record<string, unknown>,
  });
}

export async function recipeExists(url: string): Promise<boolean> {
  const id = recipeId(url);
  return client.exists({ index: INDEX, id });
}

export async function countRecipes(): Promise<number> {
  const response = await client.count({ index: INDEX });
  return response.count;
}
