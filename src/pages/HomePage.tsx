import React, { useEffect, useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Baby,
  Brain,
  Briefcase,
  Coins,
  HeartHandshake,
  Home as HomeIcon,
  LifeBuoy,
  MapPin,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryDesc, getCategoryName, getRegionLabel, UI_TEXT } from '../i18n';
import { MACAU_PARISHES, MACAU_REGIONS, type Category, type DashboardStats } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake,
  Accessibility,
  Baby,
  Home: HomeIcon,
  Brain,
  Coins,
  ShieldCheck,
  LifeBuoy,
  Briefcase,
  RefreshCw,
  Users,
  Scale,
};

const QUICK_SEARCH_EXAMPLES = [
  { label: '老人院', q: '老人院' },
  { label: '氹仔長者中心', q: '氹仔長者中心' },
  { label: '路環托兒所', q: '路環托兒所' },
  { label: '黑沙環家庭服務', q: '黑沙環家庭服務' },
  { label: '小朋友有自閉症', q: '小朋友有自閉症' },
  { label: '屋企經濟困難', q: '屋企經濟困難' },
  { label: '心理輔導', q: '心理醫生' },
];

export function HomePage() {
  const { locale, navigate } = useApp();
  const t = UI_TEXT[locale];
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/v1/stats').then((r) => r.json()),
      fetch('/api/v1/categories').then((r) => r.json()),
    ])
      .then(([sData, cData]) => {
        if (!active) return;
        setStats(sData);
        setCategories(Array.isArray(cData) ? cData : []);
      })
      .catch((err) => console.error('Failed to load homepage data:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/search');
    }
  };

  const statItems = [
    { label: t.statsTotal, value: stats?.active_units ?? 0, href: '/search' },
    { label: t.statsElderly, value: stats?.elderly_units ?? 0, href: '/search?category=elderly' },
    { label: t.statsRehab, value: stats?.rehab_units ?? 0, href: '/search?category=rehab' },
    { label: t.statsChildren, value: stats?.children_units ?? 0, href: '/search?category=children-youth' },
    { label: t.statsFamily, value: stats?.family_units ?? 0, href: '/search?category=family-marriage' },
    { label: t.statsVerified, value: stats?.verified_units ?? 0, href: '/search?status=verified' },
  ];

  return (
    <div>
      {/* Hero Section with Macau Civic Architectural Photography & Measured Contrast Scrim */}
      <section className="relative overflow-hidden bg-[#0F4C81] text-white">
        {!heroImgFailed && (
          <img
            src="/src/assets/images/macau_civic_hero_1795612004794.jpg"
            alt="澳門半島與氹仔跨海大橋及社區綠化景觀"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A2E52]/95 via-[#0F4C81]/88 to-[#0F766E]/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-emerald-200 mb-3 tracking-wide">
              {t.slogan}
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              {t.siteTitle}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>

            {/* Large Central Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-8" role="search">
              <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2 rounded-xl shadow-lg">
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search className="w-5 h-5 text-[#0F4C81] shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    aria-label={t.searchPlaceholder}
                    className="w-full py-2.5 text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold text-base rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.searchBtn}
                </button>
              </div>
            </form>

            {/* Colloquial / Common Citizen Search Quick Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-blue-200 mr-1">
                {locale === 'en' ? 'Try searching:' : locale === 'pt' ? 'Exemplos:' : '常見搜尋：'}
              </span>
              {QUICK_SEARCH_EXAMPLES.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item.q)}`)}
                  className="px-3 py-1 rounded-md bg-white/12 hover:bg-white/22 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Live Database Stats Strip (Full-Width Row Below Hero) */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {statItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.href)}
                className="text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="text-2xl sm:text-3xl font-bold text-[#0F4C81] font-mono-num group-hover:text-[#0F766E] transition-colors">
                  {loading ? '—' : item.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-slate-600">{item.label}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">{t.statsNote}</p>
        </div>
      </section>

      {/* AI Smart Service Matching & Interactive Map Action Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E] mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{locale === 'en' ? 'AI Service Matching' : locale === 'pt' ? 'Correspondência Inteligente' : 'AI 智能服務配對'}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t.aiPromoTitle}</h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.aiPromoDesc}</p>
              <p className="mt-3 text-sm text-slate-500">
                {locale === 'en'
                  ? 'Example: “My 80-year-old mother has mobility issues and our family works during the day.”'
                  : locale === 'pt'
                    ? 'Exemplo: “A minha mãe tem 80 anos, dificuldade de locomoção e a família trabalha de dia.”'
                    : '例子：「我媽媽80歲，行動不方便，家人白天要上班。」'}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/ai-match')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.aiPromoBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.viewAllServices}
              </button>
            </div>
          </div>

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F4C81] mb-2">
                <MapPin className="w-4 h-4" />
                <span>{locale === 'en' ? 'Interactive Macau Map' : locale === 'pt' ? 'Mapa Interativo' : '全澳互動服務地圖'}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {locale === 'en'
                  ? 'Explore Verified Facilities on the Map'
                  : locale === 'pt'
                    ? 'Explorar Unidades no Mapa'
                    : '按區域與分類瀏覽地圖標記'}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {locale === 'en'
                  ? `Currently displays ${stats?.mapped_units ?? 0} verified Macau locations across Peninsula, Taipa, and Coloane.`
                  : locale === 'pt'
                    ? `Apresenta ${stats?.mapped_units ?? 0} locais com coordenadas verificadas em Macau.`
                    : `目前已標示 ${stats?.mapped_units ?? 0} 個已核實真實座標之澳門服務單位，支援長者、復康、托兒、家庭及社區圖層切換。`}
              </p>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.navMap}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12 Service Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t.categoriesTitle}</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">{t.categoriesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C81] hover:text-[#0B3B66] whitespace-nowrap cursor-pointer"
          >
            {t.viewAllServices}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
              ))
            : categories.map((cat, index) => {
                const IconComp = ICON_MAP[cat.icon] ?? HeartHandshake;
                const num = String(index + 1).padStart(2, '0');
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigate(`/search?category=${encodeURIComponent(cat.slug)}`)}
                    className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-[#0F4C81] transition-colors group flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0F4C81]/8 text-[#0F4C81] flex items-center justify-center group-hover:bg-[#0F4C81] group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono-num text-slate-500">
                          {num} · {cat.unit_count ?? 0} {t.unitCountUnit}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0F4C81] transition-colors">
                        {getCategoryName(cat, locale)}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {getCategoryDesc(cat, locale)}
                      </p>
                    </div>
                  </button>
                );
              })}
        </div>
      </section>

      {/* All-Macau Region & Parish Quick Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t.regionTitle}</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">{t.regionSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MACAU_REGIONS.map((region) => {
            const parishes = MACAU_PARISHES.filter((p) => p.region === region);
            const count = stats?.by_region?.[region] ?? 0;
            return (
              <div key={region} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">{getRegionLabel(region, locale)}</h3>
                    <span className="text-sm font-mono-num font-semibold text-[#0F4C81]">
                      {count} {t.unitCountUnit}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {parishes.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          navigate(`/search?region=${encodeURIComponent(region)}&parish=${encodeURIComponent(p.name)}`)
                        }
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-[#0F4C81] hover:text-white text-slate-700 rounded-md transition-colors cursor-pointer"
                      >
                        {locale === 'pt' ? p.pt : locale === 'en' ? p.en : p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`/search?region=${encodeURIComponent(region)}`)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C81] hover:text-[#0B3B66] cursor-pointer"
                  >
                    {locale === 'en'
                      ? `Browse ${getRegionLabel(region, locale)}`
                      : locale === 'pt'
                        ? `Explorar ${getRegionLabel(region, locale)}`
                        : `查看${region}全部服務單位`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
