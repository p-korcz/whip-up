import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../test/i18n';
import type { RecipeResult } from '../types';
import { RecipeCard } from './RecipeCard';

const baseRecipe: RecipeResult = {
  id: '1',
  title: 'Pasta Carbonara',
  author: 'Chef Mario',
  sourceUrl: 'https://kwestiasmaku.com/carbonara',
  directUrl: 'https://kwestiasmaku.com/carbonara',
  ingredients: ['pasta', 'eggs', 'bacon', 'cheese', 'pepper'],
  steps: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
  missingIngredientsCount: 0,
};

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('RecipeCard', () => {
  it('renders title and author', () => {
    renderWithI18n(<RecipeCard recipe={baseRecipe} onSelect={vi.fn()} />);
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Chef Mario')).toBeInTheDocument();
  });

  it('shows source hostname', () => {
    renderWithI18n(<RecipeCard recipe={baseRecipe} onSelect={vi.fn()} />);
    expect(screen.getByText('kwestiasmaku.com')).toBeInTheDocument();
  });

  it('shows no missing badge when missingIngredientsCount is 0', () => {
    renderWithI18n(<RecipeCard recipe={baseRecipe} onSelect={vi.fn()} />);
    expect(screen.getByText(/you have all ingredients/i)).toBeInTheDocument();
  });

  it('shows missing count badge when ingredients are missing', () => {
    const recipe: RecipeResult = { ...baseRecipe, missingIngredientsCount: 3 };
    renderWithI18n(<RecipeCard recipe={recipe} onSelect={vi.fn()} />);
    expect(screen.getByText(/missing 3 ingredient/i)).toBeInTheDocument();
  });

  it('shows total ingredients count', () => {
    renderWithI18n(<RecipeCard recipe={baseRecipe} onSelect={vi.fn()} />);
    expect(screen.getByText(/5 ingredients total/i)).toBeInTheDocument();
  });

  it('calls onSelect when view button is clicked', async () => {
    const onSelect = vi.fn();
    renderWithI18n(<RecipeCard recipe={baseRecipe} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /view recipe/i }));
    expect(onSelect).toHaveBeenCalledWith(baseRecipe);
  });
});
