import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.css';

export function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(next);
  };

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${t('language.toggle')} language`}
    >
      <span className={styles.current}>{t('language.current')}</span>
      <span className={styles.divider}>/</span>
      <span className={styles.next}>{t('language.toggle')}</span>
    </button>
  );
}
