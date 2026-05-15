import { useMutation } from '@tanstack/react-query';
import { searchRecipes } from '../api';
import type { Lang, RecipeResult } from '../types';

interface SearchVariables {
  ingredients: string[];
  lang: Lang;
}

interface UseRecipeSearchResult {
  recipes: RecipeResult[];
  isLoading: boolean;
  error: boolean;
  hasSearched: boolean;
  search: (ingredients: string[], lang: Lang) => void;
  reset: () => void;
}

export function useRecipeSearch(): UseRecipeSearchResult {
  const mutation = useMutation({
    mutationFn: ({ ingredients, lang }: SearchVariables) =>
      searchRecipes(ingredients, lang),
  });

  return {
    recipes: mutation.data?.recipes ?? [],
    isLoading: mutation.isPending,
    error: mutation.isError,
    hasSearched: mutation.isSuccess || mutation.isError,
    search: (ingredients, lang) => mutation.mutate({ ingredients, lang }),
    reset: () => mutation.reset(),
  };
}
