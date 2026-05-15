import 'dotenv/config';
import { ensureCollection, countRecipes } from './services/store.js';
import { crawl } from './services/crawler.js';

async function main(): Promise<void> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Whip Up recipe crawler starting...');
  console.log(`Qdrant: ${process.env['QDRANT_URL'] ?? 'http://localhost:6333'}`);
  console.log(`Collection: ${process.env['QDRANT_COLLECTION'] ?? 'recipes'}`);

  await ensureCollection();

  const existing = await countRecipes();
  console.log(`Existing recipes in collection: ${existing}`);

  await crawl();

  const final = await countRecipes();
  console.log(`\nFinal recipe count: ${final}`);

  if (final < 5000) {
    console.warn(`Warning: target of 5000 not reached (got ${final})`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
