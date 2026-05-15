import { useQuery } from '@tanstack/react-query';
import { fetchRecipeDetail } from '../api';
import type { Lang } from '../types';

export function useRecipeDetail(id: string | null, lang: Lang) {
  return useQuery({
    queryKey: ['recipe', id, lang],
    queryFn: () => fetchRecipeDetail(id!, lang),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
}
