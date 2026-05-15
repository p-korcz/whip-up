import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../test/i18n';
import { IngredientTags } from './IngredientTags';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('IngredientTags', () => {
  it('renders nothing when ingredients list is empty', () => {
    const { container } = renderWithI18n(
      <IngredientTags ingredients={[]} onRemove={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders each ingredient as a tag', () => {
    renderWithI18n(
      <IngredientTags ingredients={['tomato', 'egg']} onRemove={vi.fn()} />
    );
    expect(screen.getByText('tomato')).toBeInTheDocument();
    expect(screen.getByText('egg')).toBeInTheDocument();
  });

  it('calls onRemove with the correct ingredient when remove button clicked', async () => {
    const onRemove = vi.fn();
    renderWithI18n(
      <IngredientTags ingredients={['tomato']} onRemove={onRemove} />
    );
    const removeBtn = screen.getByRole('button', { name: /tomato/i });
    await userEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('tomato');
  });
});
