import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Printer,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MacauMap } from '../components/MacauMap';
import { VerificationText } from '../components/ServiceCard';
import { formatTriState, getRegionLabel, UI_TEXT } from '../i18n';
import { apiFetchJson } from '../lib/apiClient';
import type { ServiceUnit } from '../types';

interface SiblingUnit {
  id: number;
  unit_name_zh: string;
  region: string;
  parish: string;
  phone: string;
  verification_status: ServiceUnit['verification_status'];
}

export function ServiceDetailPage({ id }: { id: number }) {
  const { locale, navigate } = useApp();
  const t = UI_TEXT[locale];
  const [unit, setUnit] = useState<ServiceUnit | null>(null);
  const [siblings, setSiblings] = useState<SiblingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'address' | 'link' | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiFetchJson<{ unit: ServiceUnit; siblings: SiblingUnit[] }>(`/api/v1/services/${id}`)
      .then((data) => {
        if (!active) return;
        setUnit(data.unit);
        setSiblings(Array.isArray(data.siblings) ? data.siblings : []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : '無法讀取資料');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleCopy = async (text: string, type: 'address' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(type);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Ignore clipboard failures in restricted iframes
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{error || '找不到資料'}</h1>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F4C81] text-white font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSearch}
        </button>
      </div>
    );
  }

  const primaryPhoneDigits = unit.phone.split('/')[0].replace(/\D/g, '');
  const hasDialablePhone = primaryPhoneDigits.length >= 8;
  const hasVerifiedCoords = typeof unit.latitude === 'number' && typeof unit.longitude === 'number';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Breadcrumb Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C81] hover:text-[#0B3B66] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSearch}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(window.location.href, 'link')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-xs font-semibold text-slate-700 cursor-pointer"
          >
            {copiedField === 'link' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedField === 'link' ? '已複製網址' : '分享網頁'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            列印資料卡
          </button>
        </div>
      </div>

      {/* Main Unit Title & Primary Contact Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-[#0F4C81]">{unit.category_name_zh}</span>
            {unit.sub_category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{unit.sub_category}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{getRegionLabel(unit.region, locale)}</span>
            {unit.parish && unit.parish !== '待核實' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{unit.parish}</span>
              </>
            )}
          </div>
          <VerificationText status={unit.verification_status} />
        </div>

        <div className="mt-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {unit.unit_name_zh}
          </h1>
          {(unit.unit_name_pt || unit.unit_name_en) && (
            <div className="mt-1.5 space-y-0.5 text-sm text-slate-500">
              {unit.unit_name_pt && <p>{unit.unit_name_pt}</p>}
              {unit.unit_name_en && <p>{unit.unit_name_en}</p>}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">所屬主辦機構（中／葡／英）</span>
              <p className="font-semibold text-slate-900 mt-0.5">{unit.org_name_zh}</p>
              {unit.org_name_pt && <p className="text-xs text-slate-500">{unit.org_name_pt}</p>}
              {unit.org_name_en && <p className="text-xs text-slate-500">{unit.org_name_en}</p>}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">機構性質</span>
              <p className="font-medium text-slate-800 mt-0.5">{unit.org_type}</p>
            </div>
          </div>
        </div>

        {/* Senior-friendly direct call & copy address bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-3">
          {hasDialablePhone && (
            <a
              href={`tel:+853${primaryPhoneDigits}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              致電 <span className="font-mono-num">{unit.phone}</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => handleCopy(unit.address, 'address')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            {copiedField === 'address' ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4" />}
            {copiedField === 'address' ? '已複製地址' : '複製地址'}
          </button>
          {unit.website && (
            <a
              href={unit.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-white hover:border-[#0F766E] text-[#0F766E] font-semibold text-sm transition-colors"
            >
              <Globe className="w-4 h-4" />
              瀏覽官方網站
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </section>

      {/* Complete 30-Field Encyclopedia Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Service Content & Eligibility */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-200">
              服務內容與申請須知
            </h2>
            <dl className="divide-y divide-slate-100 text-sm sm:text-base">
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">服務對象</dt>
                <dd className="text-slate-900 leading-relaxed">{unit.target_audience}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">詳細服務內容</dt>
                <dd className="text-slate-900 leading-relaxed whitespace-pre-line">{unit.service_details}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">申請資格</dt>
                <dd className="text-slate-900 leading-relaxed">{unit.eligibility}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">申請程序</dt>
                <dd className="text-slate-900 leading-relaxed">{unit.application_procedure}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">所需文件</dt>
                <dd className="text-slate-900 leading-relaxed">{unit.required_documents}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-semibold text-slate-500 mb-1">服務收費</dt>
                <dd className="text-slate-900 leading-relaxed">{unit.fees}</dd>
              </div>
            </dl>
          </section>

          {/* Service Attributes & Accessibility */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-200">
              服務條件與設施屬性
            </h2>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: '是否需要預約', val: unit.requires_appointment },
                { label: '是否接受轉介', val: unit.accepts_referral },
                { label: '是否需要評估', val: unit.requires_assessment },
                { label: '是否提供住宿', val: unit.provides_residential },
                { label: '是否提供日間服務', val: unit.provides_daycare },
                { label: '是否有無障礙設施', val: unit.is_barrier_free },
              ].map((attr) => (
                <div key={attr.label} className="p-3.5 rounded-lg bg-[#F7F9FC] border border-slate-200">
                  <span className="text-xs text-slate-500 block">{attr.label}</span>
                  <span
                    className={`mt-1 block font-bold ${
                      attr.val === 1
                        ? 'text-[#15803D]'
                        : attr.val === 0
                          ? 'text-slate-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {formatTriState(attr.val, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Location Map */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-lg font-bold text-slate-900">地點位置地圖</h2>
              {hasVerifiedCoords && (
                <span className="text-xs font-mono-num text-slate-500">
                  {unit.latitude!.toFixed(4)}, {unit.longitude!.toFixed(4)}
                </span>
              )}
            </div>
            {hasVerifiedCoords ? (
              <MacauMap units={[unit]} selectedUnitId={unit.id} heightClass="h-[320px]" singleUnitZoom={16} />
            ) : (
              <div className="p-5 rounded-lg bg-[#F7F9FC] border border-slate-200 text-sm text-slate-600 leading-relaxed">
                本服務單位屬於電話熱線、保密庇護地址或尚未完成精確座標核實，因此依照本平台「不隨意放置地圖標記」原則，暫不於地圖上顯示針點。請按上方地址或聯絡電話直接查詢。
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Contact Details, Provenance, and Sibling Branches */}
        <div className="space-y-6">
          {/* Contact Information */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              聯絡及開放時間
            </h2>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3">
                <dt className="text-xs font-semibold text-slate-500">地址</dt>
                <dd className="mt-1 text-slate-900 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
                  <span>{unit.address}</span>
                </dd>
              </div>
              <div className="py-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">所屬區域</dt>
                  <dd className="mt-1 text-slate-900 font-medium">{getRegionLabel(unit.region, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">所屬堂區</dt>
                  <dd className="mt-1 text-slate-900 font-medium">{unit.parish}</dd>
                </div>
              </div>
              <div className="py-3">
                <dt className="text-xs font-semibold text-slate-500">電話</dt>
                <dd className="mt-1 font-mono-num text-slate-900 font-semibold">{unit.phone}</dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-semibold text-slate-500">傳真</dt>
                <dd className="mt-1 font-mono-num text-slate-700">{unit.fax}</dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-semibold text-slate-500">電郵</dt>
                <dd className="mt-1 text-slate-700 break-all flex items-center gap-1.5">
                  {unit.email && unit.email !== '待核實' && <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span>{unit.email}</span>
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs font-semibold text-slate-500">開放時間</dt>
                <dd className="mt-1 text-slate-800 leading-relaxed">{unit.opening_hours}</dd>
              </div>
            </dl>
          </section>

          {/* Source & Verification Provenance */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              資料來源與核實追蹤
            </h2>
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5">
                <dt className="text-xs text-slate-500">官方資料來源</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{unit.source_name}</dd>
              </div>
              {unit.source_url && (
                <div className="py-2.5">
                  <dt className="text-xs text-slate-500">原始參考網址</dt>
                  <dd className="mt-0.5">
                    <a
                      href={unit.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#0F4C81] hover:underline break-all"
                    >
                      {unit.source_url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </dd>
                </div>
              )}
              <div className="py-2.5 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-slate-500">收集日期</dt>
                  <dd className="mt-0.5 font-mono-num text-slate-800">{unit.collected_date || '待核實'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">最後核實日期</dt>
                  <dd className="mt-0.5 font-mono-num text-slate-800">{unit.last_verified_date || '待核實'}</dd>
                </div>
              </div>
              <div className="py-2.5">
                <dt className="text-xs text-slate-500">核實狀態</dt>
                <dd className="mt-1">
                  <VerificationText status={unit.verification_status} />
                </dd>
              </div>
              {unit.notes && (
                <div className="py-2.5">
                  <dt className="text-xs text-slate-500">備註</dt>
                  <dd className="mt-0.5 text-slate-700 leading-relaxed">{unit.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Sibling Service Units under Same Organization */}
          {siblings.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
                同一主辦機構之其他獨立服務單位
              </h2>
              <ul className="divide-y divide-slate-100 mt-1">
                {siblings.map((sib) => (
                  <li key={sib.id} className="py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/service/${sib.id}`)}
                      className="text-left w-full group cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#0F4C81]">
                        {sib.unit_name_zh}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sib.region} · <span className="font-mono-num">{sib.phone}</span>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
