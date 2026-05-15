import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '../test/i18n';
import { LanguageToggle } from './LanguageToggle';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('LanguageToggle', () => {
  it('renders current language and toggle target', () => {
    i18n.changeLanguage('en');
    renderWithI18n(<LanguageToggle />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('PL')).toBeInTheDocument();
  });

  it('switches language on click', async () => {
    i18n.changeLanguage('en');
    renderWithI18n(<LanguageToggle />);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(i18n.language).toBe('pl');
  });

  it('is keyboard accessible', () => {
    renderWithI18n(<LanguageToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label');
  });
});
