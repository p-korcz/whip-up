import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './components/LanguageToggle';
import { RecipeDetailView } from './components/RecipeDetailView';
import { RecipeGrid } from './components/RecipeGrid';
import { SearchPanel } from './components/SearchPanel';
import { useRecipeSearch } from './hooks/useRecipeSearch';
import type { Lang, RecipeResult } from './types';
import styles from './App.module.css';

export function App() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'pl' ? 'pl' : 'en') as Lang;

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { recipes, isLoading, error, hasSearched, search, reset } = useRecipeSearch();

  const addIngredient = (name: string) => {
    setIngredients((prev) => (prev.includes(name) ? prev : [...prev, name]));
  };

  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name));
  };

  const clearAll = () => {
    setIngredients([]);
    reset();
  };

  const handleSearch = () => {
    search(ingredients, lang);
  };

  const handleSelectRecipe = (recipe: RecipeResult) => {
    setSelectedId(recipe.id);
  };

  if (selectedId) {
    return (
      <div className={styles.layout}>
        <header className={styles.header}>
          <span className={styles.logo}>{t('app.title')}</span>
          <LanguageToggle />
        </header>
        <main className={styles.main}>
          <RecipeDetailView
            id={selectedId}
            lang={lang}
            searchedIngredients={ingredients}
            onBack={() => setSelectedId(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>{t('app.title')}</span>
        <LanguageToggle />
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{t('app.title')}</h1>
          <p className={styles.heroSubtitle}>{t('app.subtitle')}</p>
        </div>

        <div className={styles.searchWrapper}>
          <SearchPanel
            ingredients={ingredients}
            isLoading={isLoading}
            lang={lang}
            onAdd={addIngredient}
            onRemove={removeIngredient}
            onClear={clearAll}
            onSearch={handleSearch}
          />
        </div>

        <RecipeGrid
          recipes={recipes}
          error={error}
          hasSearched={hasSearched}
          onSelectRecipe={handleSelectRecipe}
          onRetry={handleSearch}
        />
      </main>
    </div>
  );
}
