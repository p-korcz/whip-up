import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../test/i18n';
import type { RecipeResult } from '../types';
import { RecipeGrid } from './RecipeGrid';

const mockRecipe: RecipeResult = {
  id: '1',
  title: 'Test Recipe',
  author: 'Tester',
  sourceUrl: 'https://example.com/recipe',
  directUrl: 'https://example.com/recipe',
  ingredients: ['milk', 'eggs', 'flour', 'sugar'],
  steps: ['Mix', 'Bake'],
  missingIngredientsCount: 1,
};

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('RecipeGrid', () => {
  it('renders nothing when search has not been triggered', () => {
    const { container } = renderWithI18n(
      <RecipeGrid recipes={[]} error={false} hasSearched={false} onSelectRecipe={vi.fn()} onRetry={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows empty state after search with no results', () => {
    renderWithI18n(
      <RecipeGrid recipes={[]} error={false} hasSearched={true} onSelectRecipe={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.getByText(/no recipes found/i)).toBeInTheDocument();
  });

  it('renders recipe cards when results exist', () => {
    renderWithI18n(
      <RecipeGrid recipes={[mockRecipe]} error={false} hasSearched={true} onSelectRecipe={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    renderWithI18n(
      <RecipeGrid recipes={[]} error={true} hasSearched={true} onSelectRecipe={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
