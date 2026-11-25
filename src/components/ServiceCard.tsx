import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRegionLabel, getStatusLabel, UI_TEXT } from '../i18n';
import type { ServiceUnit } from '../types';

interface ServiceCardProps {
  unit: ServiceUnit;
  highlightNote?: string;
  actionNote?: string;
}

export function VerificationText({ status }: { status: ServiceUnit['verification_status'] }) {
  const { locale } = useApp();
  const label = getStatusLabel(status, locale);

  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  if (status === 'needs_update') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      {label}
    </span>
  );
}

export function ServiceCard({ unit, highlightNote, actionNote }: ServiceCardProps) {
  const { locale, navigate } = useApp();
  const t = UI_TEXT[locale];

  const categoryName =
    locale === 'pt'
      ? unit.category_name_pt || unit.category_name_zh
      : locale === 'en'
        ? unit.category_name_en || unit.category_name_zh
        : unit.category_name_zh;

  const secondaryTitle =
    locale === 'pt'
      ? unit.unit_name_pt
      : locale === 'en'
        ? unit.unit_name_en
        : unit.unit_name_pt || unit.unit_name_en;

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/service/${unit.id}`);
  };

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-[#0F4C81]/50 transition-colors">
      {/* Unboxed metadata header line with typographic separators (zero pills) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#0F4C81]">{categoryName}</span>
          {unit.sub_category && (
            <>
              <span aria-hidden="true">·</span>
              <span>{unit.sub_category}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>
            {getRegionLabel(unit.region, locale)}
            {unit.parish && unit.parish !== '待核實' ? ` / ${unit.parish}` : ''}
          </span>
        </div>
        <VerificationText status={unit.verification_status} />
      </div>

      {/* Primary Title & Parent Organization */}
      <div className="mb-3">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          <a
            href={`/service/${unit.id}`}
            onClick={handleOpen}
            className="hover:text-[#0F4C81] transition-colors"
          >
            {unit.unit_name_zh}
          </a>
        </h3>
        {secondaryTitle && (
          <p className="text-xs text-slate-500 mt-0.5">{secondaryTitle}</p>
        )}
        <p className="text-sm text-slate-600 mt-1">
          {unit.org_name_zh}
          <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-500">{unit.org_type}</span>
        </p>
      </div>

      {/* AI Match personalized reason if rendered inside AI Matcher */}
      {highlightNote && (
        <div className="mb-3 p-3.5 rounded-lg bg-[#0F766E]/5 border border-[#0F766E]/20 text-sm text-slate-800 space-y-1">
          <p className="font-semibold text-[#0F766E]">
            {locale === 'en' ? 'Why this fits' : locale === 'pt' ? 'Motivo da recomendação' : '推薦原因'}
          </p>
          <p className="leading-relaxed">{highlightNote}</p>
          {actionNote && (
            <p className="text-xs text-slate-600 pt-1">
              <span className="font-semibold text-slate-800">
                {locale === 'en' ? 'Next step: ' : locale === 'pt' ? 'Próximo passo: ' : '建議步驟：'}
              </span>
              {actionNote}
            </p>
          )}
        </div>
      )}

      {/* Concise Service Summary */}
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 mb-4">
        {unit.service_details}
      </p>

      {/* Contact & Key Location Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700 pt-3 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-[#0F4C81] mt-0.5 shrink-0" />
          <span className="font-mono-num break-words">{unit.phone}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#0F766E] mt-0.5 shrink-0" />
          <span className="break-words">{unit.address}</span>
        </div>
      </div>

      {/* Attributes summary text & CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {unit.provides_residential === 1 && <span>提供住宿</span>}
          {unit.provides_daycare === 1 && <span>提供日間服務</span>}
          {unit.is_barrier_free === 1 && <span>無障礙設施</span>}
          {unit.accepts_referral === 1 && <span>接受轉介</span>}
          {unit.last_verified_date && (
            <span className="font-mono-num">
              {locale === 'en' ? 'Verified ' : locale === 'pt' ? 'Verif. ' : '核實：'}
              {unit.last_verified_date}
            </span>
          )}
        </div>

        <a
          href={`/service/${unit.id}`}
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C81] hover:text-[#0B3B66] whitespace-nowrap shrink-0"
        >
          {t.viewDetails}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}
