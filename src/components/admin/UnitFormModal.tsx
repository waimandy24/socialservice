import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  MACAU_PARISHES,
  MACAU_REGIONS,
  type Category,
  type DataSource,
  type Organization,
  type ServiceUnit,
  type VerificationStatus,
} from '../../types';

interface UnitFormModalProps {
  unit: ServiceUnit | null;
  categories: Category[];
  organizations: Organization[];
  sources: DataSource[];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>, id?: number) => Promise<void>;
}

export function UnitFormModal({
  unit,
  categories,
  organizations,
  sources,
  onClose,
  onSave,
}: UnitFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    organization_id: unit?.organization_id ? String(unit.organization_id) : '',
    org_name_zh: unit?.org_name_zh ?? '',
    org_name_pt: unit?.org_name_pt ?? '',
    org_name_en: unit?.org_name_en ?? '',
    org_type: unit?.org_type ?? '社工局受資助服務機構',
    unit_name_zh: unit?.unit_name_zh ?? '',
    unit_name_pt: unit?.unit_name_pt ?? '',
    unit_name_en: unit?.unit_name_en ?? '',
    category_id: unit?.category_id ? String(unit.category_id) : String(categories[0]?.id ?? 1),
    sub_category: unit?.sub_category ?? '',
    target_audience: unit?.target_audience ?? '待核實',
    service_details: unit?.service_details ?? '待核實',
    eligibility: unit?.eligibility ?? '待核實',
    application_procedure: unit?.application_procedure ?? '待核實',
    required_documents: unit?.required_documents ?? '待核實',
    address: unit?.address ?? '待核實',
    parish: unit?.parish ?? '花地瑪堂區',
    region: unit?.region ?? '澳門半島',
    phone: unit?.phone ?? '待核實',
    fax: unit?.fax ?? '待核實',
    email: unit?.email ?? '待核實',
    website: unit?.website ?? '',
    opening_hours: unit?.opening_hours ?? '待核實',
    fees: unit?.fees ?? '待核實',
    requires_appointment: unit?.requires_appointment ?? -1,
    accepts_referral: unit?.accepts_referral ?? -1,
    requires_assessment: unit?.requires_assessment ?? -1,
    provides_residential: unit?.provides_residential ?? -1,
    provides_daycare: unit?.provides_daycare ?? -1,
    is_barrier_free: unit?.is_barrier_free ?? -1,
    latitude: unit?.latitude !== null && unit?.latitude !== undefined ? String(unit.latitude) : '',
    longitude: unit?.longitude !== null && unit?.longitude !== undefined ? String(unit.longitude) : '',
    data_source_id: unit?.data_source_id ? String(unit.data_source_id) : '',
    source_name: unit?.source_name ?? '澳門特別行政區政府社會工作局（IAS）',
    source_url: unit?.source_url ?? 'https://www.ias.gov.mo/',
    collected_date: unit?.collected_date ?? new Date().toISOString().slice(0, 10),
    last_verified_date: unit?.last_verified_date ?? '',
    verification_status: (unit?.verification_status ?? 'pending') as VerificationStatus,
    notes: unit?.notes ?? '',
  });

  const handleOrgSelect = (orgId: string) => {
    const found = organizations.find((o) => String(o.id) === orgId);
    setForm((prev) => ({
      ...prev,
      organization_id: orgId,
      org_name_zh: found ? found.name_zh : prev.org_name_zh,
      org_name_pt: found ? found.name_pt : prev.org_name_pt,
      org_name_en: found ? found.name_en : prev.org_name_en,
      org_type: found ? found.org_type : prev.org_type,
    }));
  };

  const handleSourceSelect = (sourceId: string) => {
    const found = sources.find((s) => String(s.id) === sourceId);
    setForm((prev) => ({
      ...prev,
      data_source_id: sourceId,
      source_name: found ? found.name : prev.source_name,
      source_url: found && !prev.source_url ? found.url : prev.source_url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_name_zh.trim()) {
      setErr('請輸入服務單位中文名稱。');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(
        {
          ...form,
          organization_id: form.organization_id ? Number(form.organization_id) : null,
          category_id: Number(form.category_id),
          data_source_id: form.data_source_id ? Number(form.data_source_id) : null,
          latitude: form.latitude.trim() === '' ? null : Number(form.latitude),
          longitude: form.longitude.trim() === '' ? null : Number(form.longitude),
        },
        unit?.id
      );
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {unit ? `編輯服務單位 #${unit.id}` : '新增獨立服務單位'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-sm">
          {err && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">{err}</div>}

          {/* Section 1: Basic Identification */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#0F4C81] border-b border-slate-200 pb-1.5">1. 單位及所屬機構識別</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">服務單位中文名稱 *</label>
                <input
                  type="text"
                  required
                  value={form.unit_name_zh}
                  onChange={(e) => setForm({ ...form, unit_name_zh: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">服務單位葡文名稱（如有）</label>
                <input
                  type="text"
                  value={form.unit_name_pt}
                  onChange={(e) => setForm({ ...form, unit_name_pt: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">服務單位英文名稱（如有）</label>
                <input
                  type="text"
                  value={form.unit_name_en}
                  onChange={(e) => setForm({ ...form, unit_name_en: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">關聯主辦機構</label>
                <select
                  value={form.organization_id}
                  onChange={(e) => handleOrgSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">-- 手動填寫或選擇現有機構 --</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name_zh}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">機構中文名稱</label>
                <input
                  type="text"
                  value={form.org_name_zh}
                  onChange={(e) => setForm({ ...form, org_name_zh: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">機構性質</label>
                <select
                  value={form.org_type}
                  onChange={(e) => setForm({ ...form, org_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="政府社會服務單位">政府社會服務單位</option>
                  <option value="社工局受資助服務機構">社工局受資助服務機構</option>
                  <option value="非受資助社會服務機構">非受資助社會服務機構</option>
                  <option value="民間非牟利社會服務團體">民間非牟利社會服務團體</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">12 大服務分類 *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_zh}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">細分類別</label>
                <input
                  type="text"
                  value={form.sub_category}
                  onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                  placeholder="例如：安老院舍、受資助托兒所"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Service Details & Eligibility */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#0F4C81] border-b border-slate-200 pb-1.5">2. 服務內容與申請資訊</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">服務對象</label>
                <input
                  type="text"
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">詳細服務內容</label>
                <textarea
                  rows={3}
                  value={form.service_details}
                  onChange={(e) => setForm({ ...form, service_details: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">申請資格</label>
                  <textarea
                    rows={2}
                    value={form.eligibility}
                    onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">申請程序</label>
                  <textarea
                    rows={2}
                    value={form.application_procedure}
                    onChange={(e) => setForm({ ...form, application_procedure: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">所需文件</label>
                  <input
                    type="text"
                    value={form.required_documents}
                    onChange={(e) => setForm({ ...form, required_documents: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">服務收費</label>
                  <input
                    type="text"
                    value={form.fees}
                    onChange={(e) => setForm({ ...form, fees: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Location & Contact */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#0F4C81] border-b border-slate-200 pb-1.5">3. 地點、聯絡方式及核實座標</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">地址</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">所屬區域</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  {MACAU_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">所屬堂區</label>
                <select
                  value={form.parish}
                  onChange={(e) => setForm({ ...form, parish: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="待核實">待核實</option>
                  {MACAU_PARISHES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">開放時間</label>
                <input
                  type="text"
                  value={form.opening_hours}
                  onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">電話</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">傳真</label>
                <input
                  type="text"
                  value={form.fax}
                  onChange={(e) => setForm({ ...form, fax: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">電郵</label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">官方網站（https://）</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GPS 緯度（僅填已核實）</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="例：22.1984（未核實請留空）"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GPS 經度（僅填已核實）</label>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="例：113.5482（未核實請留空）"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Attributes */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#0F4C81] border-b border-slate-200 pb-1.5">4. 服務屬性</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(
                [
                  ['requires_appointment', '是否需要預約'],
                  ['accepts_referral', '是否接受轉介'],
                  ['requires_assessment', '是否需要評估'],
                  ['provides_residential', '是否提供住宿'],
                  ['provides_daycare', '是否提供日間服務'],
                  ['is_barrier_free', '是否有無障礙設施'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                  <select
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value={-1}>待核實</option>
                    <option value={1}>是</option>
                    <option value={0}>否</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Provenance & Verification */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#0F4C81] border-b border-slate-200 pb-1.5">5. 資料來源與核實狀態</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">選擇資料來源名錄</label>
                <select
                  value={form.data_source_id}
                  onChange={(e) => handleSourceSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">-- 手動填寫或選擇官方來源 --</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">官方資料來源名稱</label>
                <input
                  type="text"
                  value={form.source_name}
                  onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">原始網址</label>
                <input
                  type="url"
                  value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">核實狀態</label>
                <select
                  value={form.verification_status}
                  onChange={(e) => setForm({ ...form, verification_status: e.target.value as VerificationStatus })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="verified">已核實</option>
                  <option value="pending">待核實</option>
                  <option value="needs_update">需要更新</option>
                  <option value="inactive">已停止服務</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">收集日期</label>
                <input
                  type="date"
                  value={form.collected_date}
                  onChange={(e) => setForm({ ...form, collected_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">最後核實日期</label>
                <input
                  type="date"
                  value={form.last_verified_date}
                  onChange={(e) => setForm({ ...form, last_verified_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">管理備註</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] disabled:opacity-50 text-white font-semibold cursor-pointer"
            >
              {saving ? '儲存中……' : '儲存服務單位資料'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
