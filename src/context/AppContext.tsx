import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { FontScale, Locale } from '../types';

interface AppContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;
  pathname: string;
  search: string;
  navigate: (to: string) => void;
  adminToken: string | null;
  adminUsername: string | null;
  setAdminSession: (token: string, username: string) => void;
  clearAdminSession: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-MO');
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [search, setSearch] = useState<string>(() => window.location.search || '');
  // Strictly in-memory admin session token (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
      setSearch(window.location.search || '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-large', 'font-scale-xlarge');
    if (fontScale === 'large') root.classList.add('font-scale-large');
    if (fontScale === 'xlarge') root.classList.add('font-scale-xlarge');
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-MO' : locale === 'en' ? 'en' : 'zh-Hant-MO';
  }, [locale]);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', url.pathname + url.search);
    setPathname(url.pathname);
    setSearch(url.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s);
  }, []);

  const setAdminSession = useCallback((token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
  }, []);

  const clearAdminSession = useCallback(() => {
    setAdminToken(null);
    setAdminUsername(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        fontScale,
        setFontScale,
        pathname,
        search,
        navigate,
        adminToken,
        adminUsername,
        setAdminSession,
        clearAdminSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
