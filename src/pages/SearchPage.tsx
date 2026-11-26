import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceCard } from '../components/ServiceCard';
import { getCategoryName, getRegionLabel, UI_TEXT } from '../i18n';
import { apiFetchJson } from '../lib/apiClient';
import { MACAU_PARISHES, MACAU_REGIONS, type Category, type SearchResponse } from '../types';

export function SearchPage() {
  const { locale, search, navigate } = useApp();
  const t = UI_TEXT[locale];

  const params = new URLSearchParams(search);
  const [queryInput, setQueryInput] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? 'all');
  const [region, setRegion] = useState(params.get('region') ?? 'all');
  const [parish, setParish] = useState(params.get('parish') ?? 'all');
  const [status, setStatus] = useState(params.get('status') ?? 'all');
  const [residential, setResidential] = useState(params.get('residential') === '1');
  const [daycare, setDaycare] = useState(params.get('daycare') === '1');
  const [barrierFree, setBarrierFree] = useState(params.get('barrierFree') === '1');
  const [acceptsReferral, setAcceptsReferral] = useState(params.get('acceptsReferral') === '1');
  const [sort, setSort] = useState<'relevance' | 'verified' | 'name'>(
    (params.get('sort') as 'relevance' | 'verified' | 'name') || 'relevance'
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Sync state when URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    const p = new URLSearchParams(search);
    setQueryInput(p.get('q') ?? '');
    setCategory(p.get('category') ?? 'all');
    setRegion(p.get('region') ?? 'all');
    setParish(p.get('parish') ?? 'all');
    setStatus(p.get('status') ?? 'all');
    setResidential(p.get('residential') === '1');
    setDaycare(p.get('daycare') === '1');
    setBarrierFree(p.get('barrierFree') === '1');
    setAcceptsReferral(p.get('acceptsReferral') === '1');
  }, [search]);

  useEffect(() => {
    apiFetchJson<Category[]>('/api/v1/categories')
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const buildQueryString = useCallback(
    (overrides?: Partial<Record<string, string | boolean>>) => {
      const qs = new URLSearchParams();
      const qVal = (overrides?.q !== undefined ? String(overrides.q) : queryInput).trim();
      const catVal = overrides?.category !== undefined ? String(overrides.category) : category;
      const regVal = overrides?.region !== undefined ? String(overrides.region) : region;
      const parVal = overrides?.parish !== undefined ? String(overrides.parish) : parish;
      const stVal = overrides?.status !== undefined ? String(overrides.status) : status;
      const resVal = overrides?.residential !== undefined ? Boolean(overrides.residential) : residential;
      const dayVal = overrides?.daycare !== undefined ? Boolean(overrides.daycare) : daycare;
      const bfVal = overrides?.barrierFree !== undefined ? Boolean(overrides.barrierFree) : barrierFree;
      const refVal = overrides?.acceptsReferral !== undefined ? Boolean(overrides.acceptsReferral) : acceptsReferral;
      const sortVal = overrides?.sort !== undefined ? String(overrides.sort) : sort;

      if (qVal) qs.set('q', qVal);
      if (catVal && catVal !== 'all') qs.set('category', catVal);
      if (regVal && regVal !== 'all') qs.set('region', regVal);
      if (parVal && parVal !== 'all') qs.set('parish', parVal);
      if (stVal && stVal !== 'all') qs.set('status', stVal);
      if (resVal) qs.set('residential', '1');
      if (dayVal) qs.set('daycare', '1');
      if (bfVal) qs.set('barrierFree', '1');
      if (refVal) qs.set('acceptsReferral', '1');
      if (sortVal && sortVal !== 'relevance') qs.set('sort', sortVal);
      return qs.toString();
    },
    [queryInput, category, region, parish, status, residential, daycare, barrierFree, acceptsReferral, sort]
  );

  // Fetch search results whenever filters change
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const qs = buildQueryString();
    apiFetchJson<SearchResponse>(`/api/v1/services${qs ? `?${qs}` : ''}`)
      .then((data: SearchResponse) => {
        if (active) setResults(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : '無法載入搜尋結果');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [buildQueryString]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = buildQueryString();
    navigate(`/search${qs ? `?${qs}` : ''}`);
  };

  const resetAll = () => {
    setQueryInput('');
    setCategory('all');
    setRegion('all');
    setParish('all');
    setStatus('all');
    setResidential(false);
    setDaycare(false);
    setBarrierFree(false);
    setAcceptsReferral(false);
    setSort('relevance');
    navigate('/search');
  };

  const availableParishes =
    region === 'all' ? MACAU_PARISHES : MACAU_PARISHES.filter((p) => p.region === region);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header & Search Input */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {locale === 'en' ? 'Smart Service Directory' : locale === 'pt' ? 'Pesquisa de Serviços Sociais' : '全澳社會服務智能搜尋'}
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-600">
          {locale === 'en'
            ? 'Supports Traditional & Simplified Chinese, Portuguese, English, colloquial phrases, synonyms, and Macau districts.'
            : locale === 'pt'
              ? 'Suporta chinês tradicional/simplificado, português, inglês, sinónimos e pesquisa por freguesia.'
              : '支援繁體／簡體中文、葡英關鍵字、口語描述（如「老人院」、「屋企經濟困難」、「小朋友有自閉症」）及澳門各堂區篩選。'}
        </p>

        <form onSubmit={handleSubmitSearch} className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-300 focus-within:border-[#0F4C81] rounded-xl px-4 py-1">
            <Search className="w-5 h-5 text-[#0F4C81] shrink-0" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full py-2.5 text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold text-base whitespace-nowrap cursor-pointer"
          >
            {t.searchBtn}
          </button>
          <button
            type="button"
            onClick={() => setShowFiltersMobile((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            篩選條件
          </button>
        </form>
      </div>

      {/* Main Split: Filter Sidebar + Results List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className={`lg:col-span-3 space-y-6 bg-white border border-slate-200 rounded-xl p-5 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {locale === 'en' ? 'Filters' : locale === 'pt' ? 'Filtros' : '條件篩選'}
            </h2>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F4C81] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {locale === 'en' ? 'Reset' : locale === 'pt' ? 'Limpar' : '重設'}
            </button>
          </div>

          {/* Service Category */}
          <div>
            <label htmlFor="filter-category" className="block text-sm font-semibold text-slate-800 mb-2">
              {locale === 'en' ? 'Service Category' : locale === 'pt' ? 'Categoria' : '12 大服務分類'}
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0F4C81] focus:outline-none"
            >
              <option value="all">全部服務分類</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {getCategoryName(c, locale)} ({c.unit_count ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label htmlFor="filter-region" className="block text-sm font-semibold text-slate-800 mb-2">
              {locale === 'en' ? 'Region' : locale === 'pt' ? 'Zona' : '所屬區域'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['all', ...MACAU_REGIONS] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRegion(r);
                    setParish('all');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    region === r
                      ? 'bg-[#0F4C81] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? t.allMacau : getRegionLabel(r, locale)}
                </button>
              ))}
            </div>
          </div>

          {/* Parish */}
          <div>
            <label htmlFor="filter-parish" className="block text-sm font-semibold text-slate-800 mb-2">
              {locale === 'en' ? 'Parish' : locale === 'pt' ? 'Freguesia' : '所屬堂區'}
            </label>
            <select
              id="filter-parish"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0F4C81] focus:outline-none"
            >
              <option value="all">全部堂區</option>
              {availableParishes.map((p) => (
                <option key={p.name} value={p.name}>
                  {locale === 'pt' ? p.pt : locale === 'en' ? p.en : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label htmlFor="filter-status" className="block text-sm font-semibold text-slate-800 mb-2">
              {locale === 'en' ? 'Verification Status' : locale === 'pt' ? 'Estado de Verificação' : '資料核實狀態'}
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#0F4C81] focus:outline-none"
            >
              <option value="all">全部狀態</option>
              <option value="verified">{t.verified}</option>
              <option value="pending">{t.pending}</option>
              <option value="needs_update">{t.needs_update}</option>
            </select>
          </div>

          {/* Facility Attributes */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <span className="block text-sm font-semibold text-slate-800">
              {locale === 'en' ? 'Service Attributes' : locale === 'pt' ? 'Características' : '設施與服務條件'}
            </span>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={residential}
                onChange={(e) => setResidential(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F4C81]"
              />
              提供住宿服務
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={daycare}
                onChange={(e) => setDaycare(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F4C81]"
              />
              提供日間服務／護理
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={barrierFree}
                onChange={(e) => setBarrierFree(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F4C81]"
              />
              具備無障礙設施
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptsReferral}
                onChange={(e) => setAcceptsReferral(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F4C81]"
              />
              接受社工轉介
            </label>
          </div>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-5">
          {/* Medical vs Social Services Notice (when user searches "心理醫生" etc.) */}
          {results?.medical_distinction_notice && (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed space-y-1">
                <p className="font-bold">醫療服務與社會服務的重要區分</p>
                <p>
                  如需要精神科醫生診斷或處方藥物，屬於<strong>醫療服務範疇</strong>，請聯絡衛生局各區衛生中心或仁伯爵綜合醫院精神科。
                  下方列出的是澳門可核實的<strong>社會服務心理輔導、情緒支援熱線及社區精神康復單位</strong>；如有緊急情緒危機，請即致電社工局 24 小時熱線{' '}
                  <span className="font-mono-num font-semibold">2826 1126</span> 或明愛生命熱線{' '}
                  <span className="font-mono-num font-semibold">2852 5222</span>。
                </p>
              </div>
            </div>
          )}

          {/* Synonym Expansion & Result Count Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="text-sm text-slate-600">
              {loading ? (
                <span>正在檢索澳門社會服務資料庫……</span>
              ) : (
                <>
                  共找到 <strong className="font-mono-num text-slate-900">{results?.total ?? 0}</strong> 個服務單位
                  {results?.detected_region && (
                    <span className="ml-2 text-xs text-[#0F4C81]">
                      （已自動優先匹配地區：{results.detected_region}）
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-slate-500 whitespace-nowrap">
                排序方式：
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as 'relevance' | 'verified' | 'name')}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="relevance">按相關程度排列</option>
                <option value="verified">按最後核實日期</option>
                <option value="name">按單位名稱</option>
              </select>
            </div>
          </div>

          {/* Expanded Synonym Insight Line */}
          {!loading && results && results.expanded_terms.length > 0 && (
            <p className="text-xs text-slate-500">
              智能同義詞擴展檢索：{results.expanded_terms.slice(0, 8).join(' · ')}
            </p>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
              ))}
            </div>
          )}

          {/* Results List */}
          {!loading && results && results.items.length > 0 && (
            <div className="space-y-4">
              {results.items.map((unit) => (
                <ServiceCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results && results.items.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900">暫未找到完全符合條件的服務單位</h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                您可以嘗試減少篩選條件、使用較寬泛的關鍵字，或使用 AI 智能服務配對以自然語言描述您的困難；亦可直接致電澳門社會工作局查詢（2836 7878）。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-sm font-semibold text-slate-800 cursor-pointer"
                >
                  清除所有篩選
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/ai-match${queryInput.trim() ? `?q=${encodeURIComponent(queryInput.trim())}` : ''}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  改用 AI 智能服務配對
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
