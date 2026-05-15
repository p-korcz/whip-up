import pLimit from 'p-limit';
import { fetchPage, discoverRecipeLinks } from './fetcher.js';
import { parseRecipePage, translateRecipe } from './parser.js';
import { upsertRecipe, recipeExists, countRecipes, recipeId } from './store.js';
import { SITES } from '../sources/index.js';
import type { RecipePayload } from '../types/index.js';

const CONCURRENCY = 3;
const TARGET = 5000;

interface CrawlStats {
  discovered: number;
  parsed: number;
  stored: number;
  skipped: number;
  errors: number;
}

async function processRecipeUrl(
  url: string,
  lang: 'en' | 'pl',
  sourcePage: string,
  stats: CrawlStats,
): Promise<void> {
  if (await recipeExists(url)) {
    stats.skipped++;
    return;
  }

  const page = await fetchPage(url);
  if (!page) {
    stats.errors++;
    return;
  }

  const parsed = await parseRecipePage(page.text, url);
  if (!parsed) {
    stats.errors++;
    return;
  }

  const otherLang = lang === 'en' ? 'pl' : 'en';
  const translated = await translateRecipe(parsed, otherLang);

  const [en, pl] = lang === 'en' ? [parsed, translated] : [translated, parsed];

  const id = recipeId(url);
  const payload: RecipePayload = {
    id,
    title_en: en.title,
    title_pl: pl.title,
    description_en: en.description || undefined,
    description_pl: pl.description || undefined,
    author: parsed.author || undefined,
    ingredients_en: en.ingredients,
    ingredients_pl: pl.ingredients,
    steps_en: en.steps,
    steps_pl: pl.steps,
    source_page: sourcePage,
    direct_url: url,
    language_origin: lang,
    created_at: new Date().toISOString(),
    imageUrl: parsed.imageUrl,
  };

  await upsertRecipe(url, payload);
  stats.parsed++;
  stats.stored++;

  const total = await countRecipes();
  process.stdout.write(
    `\r[${lang}] Stored: ${stats.stored} | Total in DB: ${total} | Skipped: ${stats.skipped} | Errors: ${stats.errors}  `,
  );
}

export async function crawl(): Promise<void> {
  const stats: CrawlStats = { discovered: 0, parsed: 0, stored: 0, skipped: 0, errors: 0 };
  const limit = pLimit(CONCURRENCY);

  for (const site of SITES) {
    const currentCount = await countRecipes();
    if (currentCount >= TARGET) {
      console.log(`\nReached target of ${TARGET} recipes. Stopping.`);
      break;
    }

    console.log(`\nCrawling ${site.name} (${site.lang})...`);

    const indexUrls = [...site.indexUrls];
    if (site.paginatedIndexes && site.maxPages) {
      for (let p = 2; p <= site.maxPages; p++) {
        indexUrls.push(site.paginatedIndexes(p));
      }
    }

    const recipeUrls = new Set<string>();
    for (const indexUrl of indexUrls) {
      const links = await discoverRecipeLinks(indexUrl, site.recipePattern);
      links.forEach((l) => recipeUrls.add(l));
      if (recipeUrls.size > TARGET / SITES.length) break;
    }

    stats.discovered += recipeUrls.size;
    console.log(`  Discovered ${recipeUrls.size} recipe URLs`);

    const tasks = [...recipeUrls].map((url) =>
      limit(() => processRecipeUrl(url, site.lang, new URL(url).origin, stats)),
    );

    await Promise.all(tasks);
  }

  console.log('\n\nCrawl complete:');
  console.log(`  Discovered: ${stats.discovered}`);
  console.log(`  Parsed:     ${stats.parsed}`);
  console.log(`  Stored:     ${stats.stored}`);
  console.log(`  Skipped:    ${stats.skipped}`);
  console.log(`  Errors:     ${stats.errors}`);
}
