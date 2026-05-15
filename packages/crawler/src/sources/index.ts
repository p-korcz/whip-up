export interface SiteConfig {
  name: string;
  lang: 'en' | 'pl';
  /** Index pages to crawl for recipe links */
  indexUrls: string[];
  /** Regex that a URL must match to be considered a recipe page */
  recipePattern: RegExp;
  /** Additional paginated index pages (generated) */
  paginatedIndexes?: (page: number) => string;
  maxPages?: number;
}

export const SITES: SiteConfig[] = [
  // ── English sites ──────────────────────────────────────────────────────────
  {
    name: 'AllRecipes',
    lang: 'en',
    indexUrls: [
      'https://www.allrecipes.com/recipes/80/main-dish/',
      'https://www.allrecipes.com/recipes/76/salad/',
      'https://www.allrecipes.com/recipes/79/soups-stews-and-chili/',
      'https://www.allrecipes.com/recipes/156/bread/',
      'https://www.allrecipes.com/recipes/78/pasta-and-noodles/',
      'https://www.allrecipes.com/recipes/95/desserts/',
    ],
    recipePattern: /allrecipes\.com\/recipe\/\d+\//,
    paginatedIndexes: (p) => `https://www.allrecipes.com/recipes/?page=${p}`,
    maxPages: 60,
  },
  {
    name: 'BBC Good Food',
    lang: 'en',
    indexUrls: [
      'https://www.bbcgoodfood.com/recipes/collection/easy-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/chicken-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/pasta-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/soup-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/salad-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/dessert-recipes',
      'https://www.bbcgoodfood.com/recipes/collection/vegetarian-recipes',
    ],
    recipePattern: /bbcgoodfood\.com\/recipes\/[a-z0-9-]+-\d*[a-z0-9-]+$/,
    paginatedIndexes: (p) => `https://www.bbcgoodfood.com/recipes?page=${p}`,
    maxPages: 60,
  },
  {
    name: 'Food.com',
    lang: 'en',
    indexUrls: [
      'https://www.food.com/recipes/main-dish',
      'https://www.food.com/recipes/salad',
      'https://www.food.com/recipes/soup',
      'https://www.food.com/recipes/breakfast',
      'https://www.food.com/recipes/pasta',
      'https://www.food.com/recipes/desserts',
    ],
    recipePattern: /food\.com\/recipe\/[a-z0-9-]+-\d+$/,
    paginatedIndexes: (p) => `https://www.food.com/recipes?pn=${p}`,
    maxPages: 60,
  },

  // ── Polish sites ────────────────────────────────────────────────────────────
  {
    name: 'Przepisy.pl',
    lang: 'pl',
    indexUrls: [
      'https://www.przepisy.pl/przepisy',
      'https://www.przepisy.pl/przepisy/dania-glowne',
      'https://www.przepisy.pl/przepisy/zupy',
      'https://www.przepisy.pl/przepisy/salatki',
      'https://www.przepisy.pl/przepisy/desery',
      'https://www.przepisy.pl/przepisy/sniadania',
    ],
    recipePattern: /przepisy\.pl\/przepis\//,
    paginatedIndexes: (p) => `https://www.przepisy.pl/przepisy?strona=${p}`,
    maxPages: 80,
  },
  {
    name: 'Kuchnia WP',
    lang: 'pl',
    indexUrls: [
      'https://kuchnia.wp.pl/przepisy',
      'https://kuchnia.wp.pl/przepisy/dania-glowne',
      'https://kuchnia.wp.pl/przepisy/zupy',
      'https://kuchnia.wp.pl/przepisy/salatki',
      'https://kuchnia.wp.pl/przepisy/desery',
    ],
    recipePattern: /kuchnia\.wp\.pl\/przepisy\/[a-z0-9-]+-[0-9]+/,
    paginatedIndexes: (p) => `https://kuchnia.wp.pl/przepisy?strona=${p}`,
    maxPages: 80,
  },
  {
    name: 'Gotujmy.pl',
    lang: 'pl',
    indexUrls: [
      'https://gotujmy.pl/przepisy',
      'https://gotujmy.pl/przepisy,dania-glowne',
      'https://gotujmy.pl/przepisy,zupy',
      'https://gotujmy.pl/przepisy,salatki',
      'https://gotujmy.pl/przepisy,desery',
      'https://gotujmy.pl/przepisy,sniadania',
    ],
    recipePattern: /gotujmy\.pl\/[a-z0-9,-]+-przepis-[0-9]+\.html$/,
    paginatedIndexes: (p) => `https://gotujmy.pl/przepisy?strona=${p}`,
    maxPages: 80,
  },
];
