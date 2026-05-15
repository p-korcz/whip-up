const en = {
  translation: {
    app: {
      title: 'Whip Up',
      subtitle: 'Find recipes from what you have in your fridge',
    },
    search: {
      placeholder: 'Type an ingredient...',
      addIngredient: 'Add ingredient',
      removeIngredient: 'Remove {{name}}',
      searchButton: 'Search recipes',
      clearAll: 'Clear all',
      ingredientsSelected: '{{count}} ingredient selected',
      ingredientsSelected_one: '{{count}} ingredient selected',
      ingredientsSelected_other: '{{count}} ingredients selected',
      noIngredients: 'No ingredients selected',
    },
    results: {
      found: 'Found {{count}} recipe',
      found_one: 'Found {{count}} recipe',
      found_other: 'Found {{count}} recipes',
      noResults: 'No recipes found',
      noResultsHint: 'Try adding more ingredients or change your selection',
      missingIngredients: 'Missing {{count}} ingredient',
      missingIngredients_one: 'Missing {{count}} ingredient',
      missingIngredients_other: 'Missing {{count}} ingredients',
      noMissing: 'You have all ingredients!',
      viewRecipe: 'View recipe',
    },
    recipe: {
      ingredients: 'Ingredients',
      ingredientsTotal: 'ingredients total',
      steps: 'Steps',
      author: 'Author',
      source: 'Source',
      viewSource: 'View source',
      back: 'Back to results',
      missingIngredients: 'Missing ingredients',
      availableIngredients: 'Available ingredients',
    },
    language: {
      toggle: 'PL',
      current: 'EN',
    },
    loading: 'Loading...',
    error: {
      autocomplete: 'Failed to fetch suggestions',
      search: 'Failed to fetch recipes. Please try again.',
      retry: 'Try again',
    },
  },
} as const;

export default en;
