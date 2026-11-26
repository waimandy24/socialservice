import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Phone, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceCard } from '../components/ServiceCard';
import { getRegionLabel } from '../i18n';
import { apiFetchJson } from '../lib/apiClient';
import { MACAU_REGIONS, type AIMatchResponse } from '../types';

const EXAMPLE_PROMPTS = [
  '我媽媽80歲，行動不方便，家人白天要上班，想找長者日間照顧或院舍支援。',
  '小朋友懷疑有自閉症及語言發展遲緩，想找澳門的評估、早療及康復資源。',
  '屋企最近失業出現經濟困難，急需短期食物補助及經濟援助申請資訊。',
  '最近情緒好低落成日失眠，想找心理醫生或專業情緒輔導熱線。',
];

export function AIMatchPage() {
  const { locale, search } = useApp();
  const initialQuery = new URLSearchParams(search).get('q') ?? '';
  const [prompt, setPrompt] = useState(initialQuery);
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIMatchResponse | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setPrompt(initialQuery);
    }
  }, [initialQuery]);

  const handleAnalyze = async (customPrompt?: string) => {
    const q = (customPrompt ?? prompt).trim();
    if (!q) return;
    if (customPrompt) setPrompt(customPrompt);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = await apiFetchJson<AIMatchResponse>('/api/v1/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, locale, region }),
      });
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E]">
          <Sparkles className="w-4 h-4" />
          <span>AI 智能服務配對</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {locale === 'en'
            ? 'Describe Your Need in Everyday Words'
            : locale === 'pt'
              ? 'Descreva a Sua Situação em Linguagem Simples'
              : '用日常語言講出你的需要，為你配對澳門真實社會服務'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          系統分析您的情況後，會<strong>嚴格根據本平台資料庫中的真實機構與服務單位</strong>提供建議方向、聯絡電話及申請步驟。系統絕不編造機構資料，亦不保證申請結果。
        </p>
      </div>

      {/* Input Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="ai-match-input" className="block text-sm font-semibold text-slate-800 mb-2">
              請描述您或家人的情況（毋須透露身份證號碼或個人敏感私隱）
            </label>
            <textarea
              id="ai-match-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：我媽媽80歲，行動不方便，家人白天要上班，住喺氹仔……"
              className="w-full rounded-xl border border-slate-300 focus:border-[#0F4C81] p-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">優先地區：</span>
              {(['all', ...MACAU_REGIONS] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    region === r
                      ? 'bg-[#0F4C81] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? '全澳門' : getRegionLabel(r, locale)}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || prompt.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] disabled:opacity-50 text-white font-semibold text-base transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? '正在分析並比對真實資料庫……' : '分析並推薦服務'}
            </button>
          </div>
        </form>

        {/* Example Scenarios */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2.5">點擊常見情境快速體驗：</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={loading}
                onClick={() => handleAnalyze(ex)}
                className="text-left p-3 rounded-lg bg-[#F7F9FC] hover:bg-[#EFF6FF] border border-slate-200 hover:border-[#0F4C81]/40 text-xs sm:text-sm text-slate-700 transition-colors cursor-pointer"
              >
                「{ex}」
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm leading-relaxed">
          <p className="font-bold mb-1">無法完成 AI 配對分析</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Medical vs Social Distinction Alert */}
          {result.medical_vs_social_notice && (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <p className="font-bold mb-1">醫療服務與社會服務之重要區分</p>
                <p>{result.medical_vs_social_notice}</p>
              </div>
            </div>
          )}

          {/* Analysis Summary & Service Types */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">需求分析與建議方向</h2>
              <p className="mt-2 text-base text-slate-700 leading-relaxed">{result.summary}</p>
            </div>

            {result.recommended_service_types.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-2">建議優先考慮的服務類型</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                  {result.recommended_service_types.map((stype) => (
                    <li key={stype} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span className="font-medium">{stype}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.general_steps.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-2">建議申請及查詢步驟</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700 leading-relaxed">
                  {result.general_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {/* Insufficient Data Honest Notice */}
          {result.insufficient_data_notice && (
            <div className="p-5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-slate-800 text-sm leading-relaxed">
              <p className="font-bold text-[#0F4C81] mb-1">資料庫涵蓋提醒</p>
              <p>{result.insufficient_data_notice}</p>
            </div>
          )}

          {/* Matched Real Database Service Units */}
          {result.recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  從本平台真實資料庫為您配對的服務單位（{result.recommendations.length} 間）
                </h2>
              </div>
              <div className="space-y-4">
                {result.recommendations.map(
                  (rec) =>
                    rec.unit && (
                      <ServiceCard
                        key={rec.unit_id}
                        unit={rec.unit}
                        highlightNote={rec.reason}
                        actionNote={rec.suggested_action}
                      />
                    )
                )}
              </div>
            </div>
          )}

          {/* Official IAS Fallback Card */}
          <section className="bg-[#F1F5F9] border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                仍不確定資格或需要跨部門協助？
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                建議直接聯絡 {result.ias_fallback.name} 查詢最新申請資格及分區社工跟進。
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <a
                href={`tel:+853${result.ias_fallback.hotline.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0F4C81] text-white text-xs sm:text-sm font-semibold font-mono-num"
              >
                <Phone className="w-4 h-4" />
                {result.ias_fallback.hotline}
              </a>
              <a
                href={`tel:+853${result.ias_fallback.counseling_24h.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0F766E] text-white text-xs sm:text-sm font-semibold font-mono-num"
              >
                <Phone className="w-4 h-4" />
                24小時 {result.ias_fallback.counseling_24h}
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
