import { QdrantClient } from '@qdrant/js-client-rest';
import { createHash } from 'crypto';
import type { RecipePayload } from '../types/index.js';

const QDRANT_URL = process.env['QDRANT_URL'] ?? 'http://localhost:6333';
const COLLECTION = process.env['QDRANT_COLLECTION'] ?? 'recipes';

const VECTOR_SIZE = 1;

export const qdrant = new QdrantClient({ url: QDRANT_URL });

export async function ensureCollection(): Promise<void> {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION);

  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });

    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: 'language_origin',
      field_schema: 'keyword',
    });

    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: 'source_page',
      field_schema: 'keyword',
    });

    console.log(`Created Qdrant collection: ${COLLECTION}`);
  }
}

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

export async function upsertRecipe(url: string, payload: RecipePayload): Promise<void> {
  const id = recipeId(url);
  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: [
      {
        id,
        vector: [0],
        payload: payload as unknown as Record<string, unknown>,
      },
    ],
  });
}

export async function recipeExists(url: string): Promise<boolean> {
  const id = recipeId(url);
  const results = await qdrant.retrieve(COLLECTION, {
    ids: [id],
    with_payload: false,
    with_vector: false,
  });
  return results.length > 0;
}

export async function countRecipes(): Promise<number> {
  const info = await qdrant.getCollection(COLLECTION);
  return info.points_count ?? 0;
}
