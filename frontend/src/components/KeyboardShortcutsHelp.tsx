import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { getShortcutsForUser } from '../config/keyboardShortcuts';
import type { CurrentUser } from '../features/auth/types/auth.types';

type KeyboardShortcutsHelpProps = {
  user: CurrentUser;
  onClose: () => void;
};

export const KeyboardShortcutsHelp = ({ user, onClose }: KeyboardShortcutsHelpProps) => {
  const { t } = useTranslation();
  const shortcuts = getShortcutsForUser(user);

  const navigation = shortcuts.filter((s) => s.chord);
  const general = shortcuts.filter((s) => !s.chord);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-12 md:pt-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-cream-dark bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cream-dark px-5 py-4">
          <h2 id="shortcuts-title" className="text-base font-medium text-foreground">
            {t('shortcuts.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-cream-dark"
            aria-label={t('shortcuts.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-teal-600">
              {t('shortcuts.general')}
            </h3>
            <ShortcutList items={general} t={t} />
          </section>

          {navigation.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-teal-600">
                {t('shortcuts.navigation')}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">{t('shortcuts.chordHint')}</p>
              <ShortcutList items={navigation} t={t} />
            </section>
          ) : null}
        </div>

        <p className="border-t border-cream-dark px-5 py-3 text-center text-[11px] text-muted-foreground">
          {t('shortcuts.footerHint')}
        </p>
      </div>
    </div>
  );
};

function ShortcutList({
  items,
  t,
}: {
  items: ReturnType<typeof getShortcutsForUser>;
  t: (key: string) => string;
}) {
  const seen = new Set<string>();

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const id = `${item.labelKey}-${item.keysDisplay}`;
        if (seen.has(id)) return null;
        seen.add(id);
        return (
          <li
            key={id}
            className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-cream/80"
          >
            <span className="text-sm text-foreground">{t(`shortcuts.${item.labelKey}`)}</span>
            <kbd className="shrink-0 rounded border border-cream-dark bg-cream px-2 py-0.5 font-mono text-[11px] text-teal-800">
              {item.keysDisplay}
            </kbd>
          </li>
        );
      })}
    </ul>
  );
}
