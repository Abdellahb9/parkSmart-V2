import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { LANGUAGES, setLanguage } from '../../i18n';

/**
 * Toggles French ↔ Arabic. Each button names its language in that language
 * (« Français », « العربية »), so someone who cannot read the current UI can
 * still find their own.
 */
export function LanguageSwitch({ className }) {
  const { t, i18n } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('shell.switchLanguage')}
      className={cn('inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5', className)}
    >
      <Languages aria-hidden="true" className="mx-1.5 size-4 text-text-muted" />
      {LANGUAGES.map((lang) => {
        const active = i18n.language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            dir={lang.dir}
            aria-pressed={active}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'h-8 rounded px-2.5 text-xs font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              active ? 'bg-primary text-on-primary' : 'text-text-muted hover:bg-surface-alt hover:text-text'
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitch;
