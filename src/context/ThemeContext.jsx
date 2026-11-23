import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/client';
import { applyPublishedPlatformTheme } from '../theme/platformTheme';
import defaultBrandLogo from '../assets/logo 2.PNG';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'ka-card-theme';
const isLiveApi = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';

const normalizeTheme = (value) => (value === 'light' || value === 'dark' ? value : null);

const getInitialTheme = () => {
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) || 'dark';
  } catch {
    return 'dark';
  }
};

export const useTheme = () => useContext(ThemeContext);

export const usePlatformBrand = () => {
  const { publishedPlatformTheme } = useTheme();
  const brand = publishedPlatformTheme?.brand || {};
  const rawConfiguredName = typeof brand.platformName === 'string' ? brand.platformName.trim() : '';
  const configuredName = /^(?:Clash Cash|Lool Store)$/i.test(rawConfiguredName) ? 'KM اولاد مصر' : rawConfiguredName;
  const socialMedia = brand.socialMedia && typeof brand.socialMedia === 'object' ? brand.socialMedia : {};

  return {
    platformName: configuredName || 'KM اولاد مصر',
    logoPath: null,
    logoUrl: defaultBrandLogo,
    slides: Array.isArray(brand.slides) ? brand.slides : [],
    socialMedia: {
      phone: typeof socialMedia.phone === 'string' ? socialMedia.phone : '',
      whatsapp: typeof socialMedia.whatsapp === 'string' ? socialMedia.whatsapp : '',
      instagram: typeof socialMedia.instagram === 'string' ? socialMedia.instagram : '',
      facebook: typeof socialMedia.facebook === 'string' ? socialMedia.facebook : '',
    },
  };
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [publishedPlatformTheme, setPublishedPlatformTheme] = useState(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    let active = true;
    const loadPublishedTheme = async () => {
      if (!isLiveApi) return;
      try {
        const response = await apiClient.platformTheme.getPublished();
        if (active) setPublishedPlatformTheme(response?.published || null);
      } catch {
        if (active) setPublishedPlatformTheme(null);
      }
    };
    const handleRefresh = (event) => {
      if (event && Object.hasOwn(event, 'detail')) setPublishedPlatformTheme(event.detail || null);
      void loadPublishedTheme();
    };
    if (isLiveApi) void loadPublishedTheme();
    window.addEventListener('platform-theme-published', handleRefresh);
    if (isLiveApi) {
      window.addEventListener('platform-theme-subscription-updated', handleRefresh);
      window.addEventListener('storage', handleRefresh);
    }
    return () => {
      active = false;
      window.removeEventListener('platform-theme-published', handleRefresh);
      if (isLiveApi) {
        window.removeEventListener('platform-theme-subscription-updated', handleRefresh);
        window.removeEventListener('storage', handleRefresh);
      }
    };
  }, []);

  useEffect(() => {
    applyPublishedPlatformTheme(publishedPlatformTheme, theme);
  }, [publishedPlatformTheme, theme]);

  useEffect(() => {
    const brand = publishedPlatformTheme?.brand || {};
    const rawPlatformName = typeof brand.platformName === 'string' && brand.platformName.trim()
      ? brand.platformName.trim()
      : 'KM اولاد مصر';
    const platformName = /^(?:Clash Cash|Lool Store)$/i.test(rawPlatformName) ? 'KM اولاد مصر' : rawPlatformName;
    document.querySelectorAll('.boot-loader__logo').forEach((image) => {
      image.src = defaultBrandLogo;
      image.alt = platformName;
    });
  }, [publishedPlatformTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked in private browsing; the visual theme still applies.
    }
  }, [isDark, theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme;
      return normalizeTheme(resolvedTheme) || currentTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setTheme,
      publishedPlatformTheme,
    }),
    [theme, isDark, toggleTheme, setTheme, publishedPlatformTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
