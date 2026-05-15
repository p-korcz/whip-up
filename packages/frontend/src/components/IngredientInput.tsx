import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutocomplete } from '../hooks/useAutocomplete';
import type { Lang } from '../types';
import styles from './IngredientInput.module.css';

interface IngredientInputProps {
  onAdd: (ingredient: string) => void;
  existingIngredients: string[];
  lang: Lang;
}

export function IngredientInput({ onAdd, existingIngredients, lang }: IngredientInputProps) {
  const { t } = useTranslation();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const { query, setQuery, suggestions, isLoading, clearSuggestions } = useAutocomplete(lang);

  const filteredSuggestions = suggestions.filter(
    (s) => !existingIngredients.includes(s)
  );

  useEffect(() => {
    setIsOpen(filteredSuggestions.length > 0 && query.length >= 2);
    setActiveIndex(-1);
  }, [filteredSuggestions, query]);

  const commit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || existingIngredients.includes(trimmed)) return;
    onAdd(trimmed);
    setQuery('');
    clearSuggestions();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        commit(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          commit(filteredSuggestions[activeIndex]);
        } else if (query.trim()) {
          commit(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!listRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={styles.wrapper} role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={t('search.placeholder')}
          aria-label={t('search.addIngredient')}
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
        />
        <button
          className={styles.addButton}
          onClick={() => commit(query)}
          disabled={!query.trim()}
          aria-label={t('search.addIngredient')}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className={styles.loading} aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      )}

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          className={styles.listbox}
          role="listbox"
          aria-label={t('search.addIngredient')}
        >
          {filteredSuggestions.map((suggestion, i) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.option} ${i === activeIndex ? styles.optionActive : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
