import { useTranslation } from 'react-i18next';
import type { Lang } from '../types';
import { IngredientInput } from './IngredientInput';
import { IngredientTags } from './IngredientTags';
import styles from './SearchPanel.module.css';

interface SearchPanelProps {
  ingredients: string[];
  isLoading: boolean;
  lang: Lang;
  onAdd: (ingredient: string) => void;
  onRemove: (ingredient: string) => void;
  onClear: () => void;
  onSearch: () => void;
}

export function SearchPanel({
  ingredients,
  isLoading,
  lang,
  onAdd,
  onRemove,
  onClear,
  onSearch,
}: SearchPanelProps) {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className={styles.panel} onSubmit={handleSubmit} aria-label={t('search.searchButton')}>
      <IngredientInput onAdd={onAdd} existingIngredients={ingredients} lang={lang} />

      {ingredients.length > 0 && (
        <div className={styles.tagsSection}>
          <IngredientTags ingredients={ingredients} onRemove={onRemove} />
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
          >
            {t('search.clearAll')}
          </button>
        </div>
      )}

      <button
        className={styles.searchButton}
        type="submit"
        disabled={ingredients.length === 0 || isLoading}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            {t('loading')}
          </>
        ) : (
          t('search.searchButton')
        )}
      </button>
    </form>
  );
}
