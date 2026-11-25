import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UI_TEXT } from '../i18n';
import type { FontScale, Locale } from '../types';

export function Navbar() {
  const { locale, setLocale, fontScale, setFontScale, pathname, navigate } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = UI_TEXT[locale];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/', label: t.navHome },
    { path: '/search', label: t.navSearch },
    { path: '/map', label: t.navMap },
    { path: '/about', label: t.navAbout },
    { path: '/admin', label: t.navAdmin },
  ];

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Main single-row 3-zone top navigation bar */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleNav(e, '/')}
          className="text-lg font-bold tracking-tight text-[#0F4C81] whitespace-nowrap shrink-0 hover:text-[#0B3B66] transition-colors"
        >
          {t.siteShort}
        </a>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => handleNav(e, item.path)}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive(item.path)
                  ? 'border-[#0F4C81] text-[#0F4C81] font-semibold'
                  : 'border-transparent hover:text-[#0F4C81] hover:border-slate-300'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate('/ai-match');
            }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] rounded-lg hover:bg-[#0D625B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navAI}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="開啟導覽選單"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNav(e, item.path)}
                className={`px-3 py-3 rounded-lg text-base font-medium ${
                  isActive(item.path) ? 'bg-[#0F4C81]/10 text-[#0F4C81] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate('/ai-match');
              }}
              className="mt-2 w-full py-3 px-4 rounded-lg bg-[#0F766E] text-white font-semibold text-base text-center cursor-pointer"
            >
              {t.navAI}
            </button>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['zh-MO', 'pt', 'en'] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    locale === l ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {l === 'zh-MO' ? '繁體中文' : l === 'pt' ? 'PT' : 'EN'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['normal', 'large', 'xlarge'] as FontScale[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFontScale(s)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    fontScale === s ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {s === 'normal' ? t.fontNormal : s === 'large' ? t.fontLarge : t.fontXLarge}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Non-sticky accessible utility bar rendered cleanly below the header on public pages:
 * Trilingual switcher (繁體中文 / PT / EN), Senior-friendly Font Scaling (標準 / 大 / 特大),
 * and Macau 24h emergency hotline quick reference.
 */
export function AccessibilityUtilityBar() {
  const { locale, setLocale, fontScale, setFontScale } = useApp();
  const t = UI_TEXT[locale];

  return (
    <div className="bg-[#F1F5F9] border-b border-slate-200 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-[#0F4C81]">{t.emergencyBarTitle}</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <a href="tel:+85328261126" className="font-mono-num hover:text-[#0F4C81] underline decoration-slate-300 underline-offset-2">
            {t.counseling24h}
          </a>
          <span aria-hidden="true" className="text-slate-400 hidden sm:inline">·</span>
          <a href="tel:+85328525222" className="font-mono-num hover:text-[#0F4C81] underline decoration-slate-300 underline-offset-2 hidden sm:inline">
            {t.caritasHotline}
          </a>
        </div>

        <div className="flex items-center gap-4">
          {/* Font Scale Controls for Seniors */}
          <div className="flex items-center gap-1.5" role="group" aria-label={t.fontSizeLabel}>
            <span className="text-slate-500 hidden sm:inline">{t.fontSizeLabel}:</span>
            {(['normal', 'large', 'xlarge'] as FontScale[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFontScale(s)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  fontScale === s
                    ? 'bg-[#0F4C81] text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-[#0F4C81]'
                }`}
              >
                {s === 'normal' ? t.fontNormal : s === 'large' ? t.fontLarge : t.fontXLarge}
              </button>
            ))}
          </div>

          {/* Trilingual Switcher */}
          <div className="flex items-center gap-1" role="group" aria-label="Language">
            {(['zh-MO', 'pt', 'en'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  locale === l
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-[#0F766E]'
                }`}
              >
                {l === 'zh-MO' ? '繁體' : l === 'pt' ? 'PT' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
