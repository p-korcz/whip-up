import { useTranslation } from 'react-i18next';
import type { RecipeResult } from '../types';
import { RecipeCard } from './RecipeCard';
import styles from './RecipeGrid.module.css';

interface RecipeGridProps {
  recipes: RecipeResult[];
  error: boolean;
  hasSearched: boolean;
  onSelectRecipe: (recipe: RecipeResult) => void;
  onRetry: () => void;
}

export function RecipeGrid({ recipes, error, hasSearched, onSelectRecipe, onRetry }: RecipeGridProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <p className={styles.errorText}>{t('error.search')}</p>
        <button className={styles.retryButton} onClick={onRetry} type="button">
          {t('error.retry')}
        </button>
      </div>
    );
  }

  if (hasSearched && recipes.length === 0) {
    return (
      <div className={styles.state}>
        <p className={styles.emptyTitle}>{t('results.noResults')}</p>
        <p className={styles.emptyHint}>{t('results.noResultsHint')}</p>
      </div>
    );
  }

  if (!hasSearched) return null;

  return (
    <div className={styles.wrapper}>
      <p className={styles.count} aria-live="polite">
        {t('results.found', { count: recipes.length })}
      </p>
      <ul className={styles.grid} aria-label={t('results.found', { count: recipes.length })}>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} onSelect={onSelectRecipe} />
          </li>
        ))}
      </ul>
    </div>
  );
}
