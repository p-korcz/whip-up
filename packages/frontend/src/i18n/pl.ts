const pl = {
  translation: {
    app: {
      title: 'Whip Up',
      subtitle: 'Znajdź przepis z tego, co masz w lodówce',
    },
    search: {
      placeholder: 'Wpisz składnik...',
      addIngredient: 'Dodaj składnik',
      removeIngredient: 'Usuń {{name}}',
      searchButton: 'Szukaj przepisów',
      clearAll: 'Wyczyść wszystko',
      ingredientsSelected: '{{count}} składnik wybrany',
      ingredientsSelected_one: '{{count}} składnik wybrany',
      ingredientsSelected_other: '{{count}} składników wybranych',
      noIngredients: 'Nie wybrano żadnych składników',
    },
    results: {
      found: 'Znaleziono {{count}} przepis',
      found_one: 'Znaleziono {{count}} przepis',
      found_other: 'Znaleziono {{count}} przepisów',
      noResults: 'Nie znaleziono przepisów',
      noResultsHint: 'Spróbuj dodać więcej składników lub zmień swój wybór',
      missingIngredients: 'Brakuje {{count}} składnika',
      missingIngredients_one: 'Brakuje {{count}} składnika',
      missingIngredients_other: 'Brakuje {{count}} składników',
      noMissing: 'Masz wszystkie składniki!',
      viewRecipe: 'Zobacz przepis',
    },
    recipe: {
      ingredients: 'Składniki',
      ingredientsTotal: 'składników łącznie',
      steps: 'Kroki',
      author: 'Autor',
      source: 'Źródło',
      viewSource: 'Zobacz źródło',
      back: 'Wróć do wyników',
      missingIngredients: 'Brakujące składniki',
      availableIngredients: 'Dostępne składniki',
    },
    language: {
      toggle: 'EN',
      current: 'PL',
    },
    loading: 'Ładowanie...',
    error: {
      autocomplete: 'Nie udało się pobrać podpowiedzi',
      search: 'Nie udało się pobrać przepisów. Spróbuj ponownie.',
      retry: 'Spróbuj ponownie',
    },
  },
} as const;

export default pl;
