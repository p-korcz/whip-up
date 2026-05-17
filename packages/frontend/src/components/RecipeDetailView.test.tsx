import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../test/i18n';
import { RecipeDetailView } from './RecipeDetailView';

const mockRecipe = {
  id: 'abc-123',
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta',
  author: 'Chef Mario',
  sourceUrl: 'https://allrecipes.com',
  directUrl: 'https://allrecipes.com/recipe/123/pasta-carbonara',
  ingredients: ['200g pasta', '3 eggs', '100g bacon'],
  steps: ['Boil pasta', 'Fry bacon', 'Mix eggs with pasta'],
  missingIngredientsCount: 0,
};

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(I18nextProvider, { i18n }, ui),
    ),
  );
}

describe('RecipeDetailView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while fetching', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('alert'),
      ).toBeInTheDocument(),
    );
  });

  it('renders recipe title, description and author on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument(),
    );

    expect(screen.getByText('Classic Italian pasta')).toBeInTheDocument();
    expect(screen.getByText('Chef Mario')).toBeInTheDocument();
  });

  it('renders all steps in order', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Boil pasta')).toBeInTheDocument(),
    );
    expect(screen.getByText('Fry bacon')).toBeInTheDocument();
    expect(screen.getByText('Mix eggs with pasta')).toBeInTheDocument();
  });

  it('renders "available" and "missing" ingredient groups when searchedIngredients provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={['pasta', 'eggs']}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/available ingredients/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/missing ingredients/i)).toBeInTheDocument();
    // '200g pasta' and '3 eggs' match 'pasta' and 'eggs'
    expect(screen.getByText('200g pasta')).toBeInTheDocument();
    expect(screen.getByText('3 eggs')).toBeInTheDocument();
    // '100g bacon' does not match
    expect(screen.getByText('100g bacon')).toBeInTheDocument();
  });

  it('renders all ingredients in a flat list when searchedIngredients is empty', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('200g pasta')).toBeInTheDocument(),
    );
    expect(screen.queryByText(/available ingredients/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/missing ingredients/i)).not.toBeInTheDocument();
  });

  it('renders a link to the original source', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipe,
    });

    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /view source/i }),
      ).toBeInTheDocument(),
    );

    const link = screen.getByRole('link', { name: /view source/i });
    expect(link).toHaveAttribute(
      'href',
      'https://allrecipes.com/recipe/123/pasta-carbonara',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onBack when the back button is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const onBack = vi.fn();
    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={onBack}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /back to results/i }),
    );
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows back button even during error state', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

    const onBack = vi.fn();
    renderWithProviders(
      <RecipeDetailView
        id="abc-123"
        lang="en"
        searchedIngredients={[]}
        onBack={onBack}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole('button', { name: /back to results/i }),
    );
    expect(onBack).toHaveBeenCalledOnce();
  });
});
