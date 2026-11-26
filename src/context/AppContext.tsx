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

function shouldUseHashRouting(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('.github.io') ||
    window.location.protocol === 'file:' ||
    window.location.hash.startsWith('#/')
  );
}

function readCurrentRoute(): { pathname: string; search: string } {
  if (typeof window === 'undefined') return { pathname: '/', search: '' };
  if (shouldUseHashRouting()) {
    const rawHash = window.location.hash.replace(/^#/, '');
    if (rawHash.startsWith('/')) {
      const qIdx = rawHash.indexOf('?');
      if (qIdx >= 0) {
        return {
          pathname: rawHash.slice(0, qIdx) || '/',
          search: rawHash.slice(qIdx),
        };
      }
      return { pathname: rawHash || '/', search: '' };
    }
    return { pathname: '/', search: window.location.search || '' };
  }
  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh-MO');
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');
  const [route, setRoute] = useState<{ pathname: string; search: string }>(() => readCurrentRoute());
  // Strictly in-memory admin session token (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  useEffect(() => {
    const syncRoute = () => setRoute(readCurrentRoute());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
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
    const targetPath = url.pathname || '/';
    const targetSearch = url.search || '';

    if (shouldUseHashRouting()) {
      window.location.hash = `#${targetPath}${targetSearch}`;
      setRoute({ pathname: targetPath, search: targetSearch });
    } else {
      window.history.pushState({}, '', targetPath + targetSearch);
      setRoute({ pathname: targetPath, search: targetSearch });
    }
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
        pathname: route.pathname,
        search: route.search,
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
