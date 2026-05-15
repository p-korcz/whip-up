import { useTranslation } from 'react-i18next';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import type { Lang } from '../types';
import styles from './RecipeDetail.module.css';

interface RecipeDetailViewProps {
  id: string;
  lang: Lang;
  searchedIngredients: string[];
  onBack: () => void;
}

const BackButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button className={styles.back} onClick={onClick} type="button">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label}
  </button>
);

export function RecipeDetailView({ id, lang, searchedIngredients, onBack }: RecipeDetailViewProps) {
  const { t } = useTranslation();
  const { data: recipe, isLoading, isError } = useRecipeDetail(id, lang);

  const backLabel = t('recipe.back');

  if (isLoading) {
    return (
      <div className={styles.container}>
        <BackButton onClick={onBack} label={backLabel} />
        <div className={styles.loadingState} aria-live="polite">{t('loading')}</div>
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className={styles.container}>
        <BackButton onClick={onBack} label={backLabel} />
        <p className={styles.errorState} role="alert">{t('error.search')}</p>
      </div>
    );
  }

  const lowerSearched = searchedIngredients.map((s) => s.toLowerCase());

  const available = recipe.ingredients.filter((ing) =>
    lowerSearched.some((s) => ing.toLowerCase().includes(s))
  );
  const missing = recipe.ingredients.filter(
    (ing) => !lowerSearched.some((s) => ing.toLowerCase().includes(s))
  );

  return (
    <div className={styles.container}>
      <BackButton onClick={onBack} label={backLabel} />

      <header className={styles.header}>
        <h1 className={styles.title}>{recipe.title}</h1>
        <div className={styles.meta}>
          {recipe.author && (
            <span className={styles.metaItem}>
              <strong>{t('recipe.author')}:</strong> {recipe.author}
            </span>
          )}
          {recipe.sourceUrl && (
            <span className={styles.metaItem}>
              <strong>{t('recipe.source')}:</strong> {new URL(recipe.sourceUrl).hostname}
            </span>
          )}
        </div>
        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
        )}
      </header>

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="ingredients-heading">
          <h2 id="ingredients-heading" className={styles.sectionTitle}>
            {t('recipe.ingredients')}
          </h2>

          {searchedIngredients.length > 0 ? (
            <>
              {available.length > 0 && (
                <div className={styles.ingredientGroup}>
                  <h3 className={styles.groupLabel}>{t('recipe.availableIngredients')}</h3>
                  <ul className={styles.ingredientList}>
                    {available.map((ing) => (
                      <li key={ing} className={`${styles.ingredient} ${styles.ingredientAvailable}`}>
                        <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {missing.length > 0 && (
                <div className={styles.ingredientGroup}>
                  <h3 className={styles.groupLabel}>{t('recipe.missingIngredients')}</h3>
                  <ul className={styles.ingredientList}>
                    {missing.map((ing) => (
                      <li key={ing} className={`${styles.ingredient} ${styles.ingredientMissing}`}>
                        <svg className={styles.missingIcon} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <ul className={styles.ingredientList}>
              {recipe.ingredients.map((ing) => (
                <li key={ing} className={styles.ingredient}>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section} aria-labelledby="steps-heading">
          <h2 id="steps-heading" className={styles.sectionTitle}>
            {t('recipe.steps')}
          </h2>
          <ol className={styles.stepList}>
            {recipe.steps.map((step, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <p className={styles.stepText}>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.directUrl && (
        <footer className={styles.footer}>
          <a
            href={recipe.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceLink}
          >
            {t('recipe.viewSource')}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M6 3H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8M8 2h4m0 0v4m0-4L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </footer>
      )}
    </div>
  );
}
