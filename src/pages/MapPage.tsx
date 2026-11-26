import React, { useEffect, useState } from 'react';
import { ArrowRight, Info, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MacauMap } from '../components/MacauMap';
import { VerificationText } from '../components/ServiceCard';
import { getCategoryName, getRegionLabel } from '../i18n';
import { apiFetchJson } from '../lib/apiClient';
import { MACAU_REGIONS, type Category, type ServiceUnit } from '../types';

const PRESET_MAP_LAYERS = [
  { slug: 'all', label_zh: '全部服務單位地圖', label_pt: 'Todos os Serviços', label_en: 'All Services' },
  { slug: 'elderly', label_zh: '長者服務地圖', label_pt: 'Serviços p/ Idosos', label_en: 'Elderly Map' },
  { slug: 'rehab', label_zh: '復康服務地圖', label_pt: 'Reabilitação', label_en: 'Rehab Map' },
  { slug: 'children-youth', label_zh: '托兒及兒童地圖', label_pt: 'Creches e Jovens', label_en: 'Childcare Map' },
  { slug: 'family-marriage', label_zh: '家庭服務地圖', label_pt: 'Apoio Familiar', label_en: 'Family Map' },
  { slug: 'community-volunteer', label_zh: '社區服務地圖', label_pt: 'Serviços Comunitários', label_en: 'Community Map' },
];

interface MapPayload {
  total_matching: number;
  mapped_count: number;
  unmapped_count: number;
  mapped: ServiceUnit[];
  unmapped: ServiceUnit[];
}

export function MapPage() {
  const { locale, navigate } = useApp();
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<MapPayload | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ServiceUnit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchJson<Category[]>('/api/v1/categories')
      .then((c) => setCategories(Array.isArray(c) ? c : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = new URLSearchParams();
    if (category !== 'all') qs.set('category', category);
    if (region !== 'all') qs.set('region', region);
    apiFetchJson<MapPayload>(`/api/v1/map?${qs.toString()}`)
      .then((payload: MapPayload) => {
        if (!active) return;
        setData(payload);
        setSelectedUnit(null);
      })
      .catch((err) => console.error('Map fetch error:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, region]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {locale === 'en'
            ? 'Interactive Macau Social Services Map'
            : locale === 'pt'
              ? 'Mapa Interativo de Serviços Sociais de Macau'
              : '互動式澳門社會服務地圖'}
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-slate-600">
          {locale === 'en'
            ? 'Powered by OpenStreetMap. Displays only verified Macau coordinates — confidential shelters and phone-only hotlines are listed separately.'
            : locale === 'pt'
              ? 'Baseado em OpenStreetMap. Mostra apenas unidades com coordenadas verificadas em Macau.'
              : '採用 OpenStreetMap 街道圖，僅標示具備已核實真實座標的澳門服務單位；點擊標記可即時查看地址、電話並進入完整資料頁。'}
        </p>
      </div>

      {/* Map Layer & Region Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_MAP_LAYERS.map((layer) => (
            <button
              key={layer.slug}
              type="button"
              onClick={() => setCategory(layer.slug)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                category === layer.slug
                  ? 'bg-[#0F4C81] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {locale === 'pt' ? layer.label_pt : locale === 'en' ? layer.label_en : layer.label_zh}
            </button>
          ))}

          <select
            aria-label="選擇其他服務分類圖層"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800"
          >
            <option value="all">全部 12 大分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {getCategoryName(c, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', ...MACAU_REGIONS] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  region === r
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-[#0F766E]'
                }`}
              >
                {r === 'all' ? '全澳門' : getRegionLabel(r, locale)}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0F4C81] shrink-0" />
            <span>
              地圖顯示 <strong className="font-mono-num text-slate-900">{data?.mapped_count ?? 0}</strong> 個已核實座標單位
              {data && data.unmapped_count > 0 && (
                <span className="text-slate-500">
                  （另有 <strong className="font-mono-num">{data.unmapped_count}</strong> 個電話熱線／保密庇護／待補座標單位列於清單下方）
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Map + Synced Unit List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <MacauMap
            units={data?.mapped ?? []}
            selectedUnitId={selectedUnit?.id ?? null}
            onSelectUnit={(u) => setSelectedUnit(u)}
            onNavigateDetail={(id) => navigate(`/service/${id}`)}
            heightClass="h-[520px] sm:h-[600px]"
          />
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 bg-[#F7F9FC] border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">地圖標示單位清單</h2>
            <span className="text-xs font-mono-num text-slate-500">{data?.mapped_count ?? 0} 間</span>
          </div>

          <div className="max-h-[545px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">載入地圖單位中……</div>
            ) : data && data.mapped.length > 0 ? (
              data.mapped.map((u) => {
                const active = selectedUnit?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-4 transition-colors ${active ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedUnit(u)}
                      className="text-left w-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#0F4C81]">{u.category_name_zh}</span>
                        <VerificationText status={u.verification_status} />
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                        {u.unit_name_zh}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 shrink-0" />
                        <span>{u.address}</span>
                      </p>
                      <p className="mt-1 text-xs font-mono-num text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0F4C81] shrink-0" />
                        <span>{u.phone}</span>
                      </p>
                    </button>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigate(`/service/${u.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
                      >
                        查看完整資料卡 <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-sm text-slate-500">此篩選條件下暫無已核實座標之服務單位。</div>
            )}

            {/* Unmapped / Confidential / Hotline units listed honestly */}
            {!loading && data && data.unmapped.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <p className="text-xs font-bold text-slate-700">
                  電話熱線／保密庇護／待補座標單位（{data.unmapped.length} 間）
                </p>
                {data.unmapped.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => navigate(`/service/${u.id}`)}
                    className="block w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#0F4C81] cursor-pointer"
                  >
                    <p className="text-xs font-bold text-slate-900">{u.unit_name_zh}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono-num">{u.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
