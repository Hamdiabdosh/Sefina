import i18n from '../../../lib/i18n';

export type LocalizedString = {
  en: string;
  am?: string;
  ar?: string;
};

export const getLocalizedValue = (value: LocalizedString | unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const record = value as LocalizedString;
  const lang = i18n.language?.split('-')[0] ?? 'en';
  if (lang === 'am' && record.am) return record.am;
  if (lang === 'ar' && record.ar) return record.ar;
  return record.en ?? '';
};
