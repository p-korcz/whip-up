import { useTranslation } from 'react-i18next';
import type { RecipeResult } from '../types';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeResult;
  onSelect: (recipe: RecipeResult) => void;
}

function hostnameOrEmpty(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  const { t } = useTranslation();

  const missingCount = recipe.missingIngredientsCount;
  const missingLabel =
    missingCount === 0
      ? t('results.noMissing')
      : t('results.missingIngredients', { count: missingCount });

  const missingClass = missingCount === 0 ? styles.badgeSuccess : styles.badgeMissing;
  const sourceName = recipe.sourceUrl ? hostnameOrEmpty(recipe.sourceUrl) : '';

  return (
    <article className={styles.card}>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={`${styles.badge} ${missingClass}`}>{missingLabel}</span>
          {sourceName && <span className={styles.source}>{sourceName}</span>}
        </div>
        <h3 className={styles.title}>{recipe.title}</h3>
        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
        )}
        <p className={styles.meta}>
          {recipe.author && (
            <span>{t('recipe.author')}: <strong>{recipe.author}</strong></span>
          )}
          <span className={styles.totalCount}>
            {recipe.ingredients.length} {t('recipe.ingredientsTotal')}
          </span>
        </p>
      </div>
      <div className={styles.footer}>
        <button
          className={styles.viewButton}
          onClick={() => onSelect(recipe)}
          aria-label={`${t('results.viewRecipe')}: ${recipe.title}`}
          type="button"
        >
          {t('results.viewRecipe')}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}
