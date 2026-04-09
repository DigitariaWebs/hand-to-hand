import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import fr from '@/i18n/fr';
import en from '@/i18n/en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<string, any> = { fr, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const locale = useMemo(() => {
    try {
      const locales = getLocales();
      const lang = locales[0]?.languageCode ?? 'fr';
      return lang in translations ? lang : 'fr';
    } catch {
      return 'fr';
    }
  }, []);

  const t = useMemo(() => {
    const dict = (translations[locale] ?? translations['fr']) as Record<string, unknown>;
    return (key: string): string => getNestedValue(dict, key);
  }, [locale]);

  return { t, locale };
}
