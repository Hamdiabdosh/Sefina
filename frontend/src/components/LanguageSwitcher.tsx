import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'am', label: 'አማ' },
  { code: 'ar', label: 'ع' },
] as const;

type LanguageSwitcherProps = {
  variant?: 'default' | 'book';
};

export const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  if (variant === 'book') {
    return (
      <div className="book-login-lang" role="group" aria-label="Language">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => void i18n.changeLanguage(lang.code)}
            className={i18n.language.startsWith(lang.code) ? 'is-active' : undefined}
          >
            {lang.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2 mb-6">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => void i18n.changeLanguage(lang.code)}
          className={`text-[11px] px-2 py-1 rounded-full font-medium ${
            i18n.language.startsWith(lang.code) ? 'bg-white/25 text-white' : 'text-white/60'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
