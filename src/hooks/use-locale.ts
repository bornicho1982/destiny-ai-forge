'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPreferredLocale, setLocale as persistLocale, t as translate, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocaleState(getPreferredLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
  }, []);

  const t = useCallback((key: string) => {
    return translate(key, locale);
  }, [locale]);

  return { locale, setLocale, t, mounted, SUPPORTED_LOCALES };
}
