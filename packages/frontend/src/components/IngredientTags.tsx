import { useTranslation } from 'react-i18next';
import styles from './IngredientTags.module.css';

interface IngredientTagsProps {
  ingredients: string[];
  onRemove: (ingredient: string) => void;
}

export function IngredientTags({ ingredients, onRemove }: IngredientTagsProps) {
  const { t } = useTranslation();

  if (ingredients.length === 0) return null;

  return (
    <ul className={styles.list} aria-label={t('search.ingredientsSelected', { count: ingredients.length })}>
      {ingredients.map((name) => (
        <li key={name} className={styles.tag}>
          <span className={styles.name}>{name}</span>
          <button
            className={styles.remove}
            onClick={() => onRemove(name)}
            aria-label={t('search.removeIngredient', { name })}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
