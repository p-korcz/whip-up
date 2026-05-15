import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAutocomplete } from '../api';
import type { Lang } from '../types';

interface UseAutocompleteResult {
  suggestions: string[];
  isLoading: boolean;
  error: boolean;
  query: string;
  setQuery: (q: string) => void;
  clearSuggestions: () => void;
}

export function useAutocomplete(lang: Lang, debounceMs = 250): UseAutocompleteResult {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(false);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(false);

      try {
        const results = await fetchAutocomplete(query.trim(), lang, controller.signal);
        setSuggestions(results);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(true);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, lang, debounceMs]);

  return { suggestions, isLoading, error, query, setQuery, clearSuggestions };
}
