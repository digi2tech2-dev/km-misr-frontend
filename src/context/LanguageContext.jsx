import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translations as legacyTranslations } from '../data/translations';
import { usePlatformBrand } from './ThemeContext';

const LanguageContext = createContext();

const normalizeLanguage = (lng) => {
  const value = String(lng || '').toLowerCase();
  return value.startsWith('en') ? 'en' : 'ar';
};

// Keep the layout direction fixed to avoid UI shifts when switching languages.
const getDirection = () => 'rtl';

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { platformName } = usePlatformBrand();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const dir = getDirection(language);

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      i18n.changeLanguage(normalized);
    },
    [i18n]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const applyPlatformName = useCallback((value) => (
    typeof value === 'string' ? value.replace(/KM اولاد مصر|Lool Store/gi, platformName) : value
  ), [platformName]);

  const t = useCallback(
    (key, options = {}) => {
      const direct = i18n.t(key, { ...options, defaultValue: '__missing__' });
      if (typeof direct === 'string' && direct !== '__missing__' && direct !== key) {
        return applyPlatformName(direct);
      }

      const legacyScoped = i18n.t(`legacy.${key}`, { ...options, defaultValue: '__missing__' });
      if (typeof legacyScoped === 'string' && legacyScoped !== '__missing__') {
        return applyPlatformName(legacyScoped);
      }

      const legacy = legacyTranslations?.[language]?.[key] ?? legacyTranslations?.ar?.[key];
      if (legacy) return applyPlatformName(legacy);

      return applyPlatformName(options.defaultValue || key);
    },
    [applyPlatformName, i18n, language]
  );

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const value = useMemo(
    () => ({
      language,
      dir,
      setLanguage,
      toggleLanguage,
      t,
      translations: legacyTranslations
    }),
    [dir, language, setLanguage, t, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
