import 'dotenv/config';
import { ensureIndex, countRecipes } from './services/store.js';
import { crawl } from './services/crawler.js';

async function main(): Promise<void> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Whip Up recipe crawler starting...');
  console.log(`Elasticsearch: ${process.env['ELASTICSEARCH_URL'] ?? 'http://localhost:9200'}`);
  console.log(`Index: ${process.env['ELASTICSEARCH_INDEX'] ?? 'recipes'}`);

  await ensureIndex();

  const before = await countRecipes();
  console.log(`Existing recipes: ${before}`);

  await crawl();

  const after = await countRecipes();
  console.log(`\nRun complete. Recipes: ${before} → ${after} (+${after - before} new)`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
