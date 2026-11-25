import React, { useEffect, useState } from 'react';
import { Code2, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import type { DashboardStats, DataSource } from '../types';

export function AboutPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/sources').then((r) => r.json()),
      fetch('/api/v1/stats').then((r) => r.json()),
    ])
      .then(([src, st]) => {
        setSources(Array.isArray(src) ? src : []);
        setStats(st);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          資料來源、核實準則與開放資料架構
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
          《澳門社會服務百科》是一個持續收集、核實及擴充的公共社會服務資料庫。我們堅持「不編造機構、不虛構統計、不隨意插針」的原則，所有尚未查實的細節均會明確標註為「待核實」，並歡迎透過管理後台的 CSV／Excel 匯入及核實流程不斷補全全澳數百個服務分點。
        </p>
      </div>

      {/* Live Verification Status Breakdown */}
      {stats && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F4C81] mb-4">
            <Database className="w-4 h-4" />
            <span>資料庫即時核實進度（動態統計）</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#F7F9FC] border border-slate-200">
              <div className="text-2xl font-bold font-mono-num text-[#15803D]">{stats.verified_units}</div>
              <div className="text-xs text-slate-600 mt-1">已核實服務單位</div>
            </div>
            <div className="p-4 rounded-lg bg-[#F7F9FC] border border-slate-200">
              <div className="text-2xl font-bold font-mono-num text-slate-800">{stats.pending_units}</div>
              <div className="text-xs text-slate-600 mt-1">待核實服務單位</div>
            </div>
            <div className="p-4 rounded-lg bg-[#F7F9FC] border border-slate-200">
              <div className="text-2xl font-bold font-mono-num text-amber-700">{stats.needs_update_units}</div>
              <div className="text-xs text-slate-600 mt-1">標記需要更新</div>
            </div>
            <div className="p-4 rounded-lg bg-[#F7F9FC] border border-slate-200">
              <div className="text-2xl font-bold font-mono-num text-[#0F4C81]">{stats.total_organizations}</div>
              <div className="text-xs text-slate-600 mt-1">已建檔主辦機構</div>
            </div>
          </div>
        </section>
      )}

      {/* Official Data Sources Registry */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F4C81]">
          <ShieldCheck className="w-4 h-4" />
          <span>官方及可核實公開資料來源名錄</span>
        </div>
        <div className="divide-y divide-slate-100">
          {sources.map((s) => (
            <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#0F766E]">{s.authority_type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">最後檢視：{s.last_checked_date || '待核實'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">關聯單位：{s.unit_count ?? 0} 間</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{s.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C81] hover:underline whitespace-nowrap shrink-0"
                >
                  前往來源 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Open Data API Endpoints */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F4C81]">
          <Code2 className="w-4 h-4" />
          <span>預留開放資料 API 介面（支援日後接駁政府公開數據）</span>
        </div>
        <p className="text-sm text-slate-600">
          本平台已建立標準化唯讀 JSON API，便於社區夥伴、學術研究或未來自動同步澳門特區政府開放數據平台（data.gov.mo）：
        </p>
        <div className="space-y-2 text-xs font-mono-num bg-[#F7F9FC] border border-slate-200 rounded-lg p-4 text-slate-800">
          <div>GET /api/v1/services?q=&amp;category=&amp;region=&amp;parish=</div>
          <div>GET /api/v1/services/:id</div>
          <div>GET /api/v1/categories</div>
          <div>GET /api/v1/organizations</div>
          <div>GET /api/v1/stats</div>
          <div>GET /api/v1/map?category=&amp;region=</div>
          <div>GET /api/v1/sources</div>
        </div>
      </section>
    </div>
  );
}
