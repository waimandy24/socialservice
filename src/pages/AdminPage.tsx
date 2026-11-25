import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CopyCheck,
  Database,
  Download,
  Edit3,
  FileSpreadsheet,
  FolderTree,
  History,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VerificationText } from '../components/ServiceCard';
import { UnitFormModal } from '../components/admin/UnitFormModal';
import type {
  AuditLog,
  Category,
  DashboardStats,
  DataSource,
  DuplicateGroup,
  Organization,
  SearchSynonym,
  ServiceUnit,
  VerificationStatus,
} from '../types';

type AdminTab =
  | 'overview'
  | 'units'
  | 'organizations'
  | 'import-export'
  | 'categories'
  | 'synonyms'
  | 'sources'
  | 'duplicates'
  | 'audit';

interface ImportPreviewRow {
  row_index: number;
  unit_name_zh: string;
  org_name_zh: string;
  category_label: string;
  region: string;
  phone: string;
  verification_status: string;
  is_duplicate: boolean;
  error: string | null;
  [key: string]: unknown;
}

export function AdminPage() {
  const { adminToken, adminUsername, setAdminSession, clearAdminSession, navigate } = useApp();

  // Auth states
  const [authStatus, setAuthStatus] = useState<{ needsSetup: boolean; envControlled: boolean } | null>(null);
  const [authUsername, setAuthUsername] = useState('admin');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin workspace states
  const [tab, setTab] = useState<AdminTab>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [units, setUnits] = useState<ServiceUnit[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [synonyms, setSynonyms] = useState<SearchSynonym[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Units table filter & batch selection
  const [unitQuery, setUnitQuery] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingUnit, setEditingUnit] = useState<ServiceUnit | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Inline create forms
  const [newOrg, setNewOrg] = useState({ name_zh: '', name_pt: '', name_en: '', org_type: '社工局受資助服務機構', website: '', phone: '' });
  const [newSyn, setNewSyn] = useState({ canonical_term: '', synonyms: '', category_slug: '', notes: '' });
  const [newSource, setNewSource] = useState({ name: '', url: '', authority_type: '官方來源', description: '' });

  // Import/Export state
  const [importPreview, setImportPreview] = useState<{
    filename: string;
    total_rows: number;
    valid_rows: number;
    duplicate_rows: number;
    rows: ImportPreviewRow[];
  } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const adminFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers ?? {});
      if (adminToken) headers.set('Authorization', `Bearer ${adminToken}`);
      const res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        clearAdminSession();
        throw new Error('登入工作階段已過期，請重新登入。');
      }
      return res;
    },
    [adminToken, clearAdminSession]
  );

  // Check whether initial admin setup is needed
  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((s) => setAuthStatus(s))
      .catch(() => setAuthStatus({ needsSetup: false, envControlled: false }));
  }, []);

  const loadAllAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [sRes, uRes, oRes, cRes, synRes, srcRes, dupRes, logRes] = await Promise.all([
        fetch('/api/v1/stats'),
        adminFetch('/api/admin/units'),
        fetch('/api/v1/organizations'),
        fetch('/api/v1/categories'),
        adminFetch('/api/admin/synonyms'),
        fetch('/api/v1/sources'),
        adminFetch('/api/admin/duplicates'),
        adminFetch('/api/admin/audit-logs'),
      ]);
      setStats(await sRes.json());
      setUnits(await uRes.json());
      setOrganizations(await oRes.json());
      setCategories(await cRes.json());
      setSynonyms(await synRes.json());
      setSources(await srcRes.json());
      setDuplicates(await dupRes.json());
      setAuditLogs(await logRes.json());
    } catch (err) {
      console.error('Admin load error:', err);
    }
  }, [adminToken, adminFetch]);

  useEffect(() => {
    if (adminToken) {
      loadAllAdminData();
    }
  }, [adminToken, loadAllAdminData]);

  // Handle First-Run Setup or Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authStatus?.needsSetup && authPassword !== authConfirm) {
      setAuthError('兩次輸入的密碼不一致。');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = authStatus?.needsSetup ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '驗證失敗');
      }
      setAdminSession(data.token, data.username);
      setAuthPassword('');
      setAuthConfirm('');
      setAuthStatus({ needsSetup: false, envControlled: authStatus?.envControlled ?? false });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setAuthLoading(false);
    }
  };

  // Unit CRUD handlers
  const handleSaveUnit = async (payload: Record<string, unknown>, id?: number) => {
    const res = await adminFetch(id ? `/api/admin/units/${id}` : '/api/admin/units', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '儲存失敗');
    showToast(id ? '已更新服務單位資料' : '已成功新增服務單位');
    await loadAllAdminData();
  };

  const handleDeleteUnit = async (u: ServiceUnit) => {
    const res = await adminFetch(`/api/admin/units/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`已刪除「${u.unit_name_zh}」`);
      setSelectedIds((prev) => prev.filter((x) => x !== u.id));
      await loadAllAdminData();
    }
  };

  const handleBatchStatus = async (status: VerificationStatus) => {
    if (selectedIds.length === 0) return;
    const res = await adminFetch('/api/admin/units/batch-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, verification_status: status }),
    });
    if (res.ok) {
      showToast(`已批量更新 ${selectedIds.length} 個單位狀態`);
      setSelectedIds([]);
      await loadAllAdminData();
    }
  };

  const handleQuickVerify = async (u: ServiceUnit, status: VerificationStatus) => {
    await handleSaveUnit({ verification_status: status }, u.id);
  };

  // Import preview & commit
  const handleFilePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setImporting(true);
    try {
      const res = await adminFetch('/api/admin/import/preview', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解析失敗');
      setImportPreview(data);
      showToast(`已解析 ${data.total_rows} 列資料，請確認後匯入`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '檔案解析失敗');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleCommitImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const validRows = importPreview.rows.filter((r) => !r.error);
      const res = await adminFetch('/api/admin/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows, skip_duplicates: skipDuplicates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '匯入失敗');
      showToast(`批量匯入完成：新增 ${data.inserted} 筆，略過 ${data.skipped} 筆`);
      setImportPreview(null);
      await loadAllAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '批量匯入失敗');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const res = await adminFetch(url);
      if (!res.ok) throw new Error('匯出失敗');
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      showToast(`已下載 ${filename}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '下載失敗');
    }
  };

  // Unauthenticated view: First-Run Setup or Login Gate
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-7 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F4C81]">
              <KeyRound className="w-4 h-4" />
              <span>澳門社會服務百科 · 管理員後台</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {authStatus?.needsSetup ? '首次設定管理員帳號' : '管理員安全登入'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {authStatus?.needsSetup
                ? '系統偵測到尚未建立管理員密碼。請立即設定您的專屬管理員帳號與密碼（最少 8 個字元），設定完成後即可進入全澳資料庫核實與匯入後台。'
                : '本後台與市民前台分離，僅供授權管理員進行機構建檔、CSV／Excel 匯入、核實與同義詞維護。'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!authStatus?.envControlled && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">管理員帳號</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {authStatus?.needsSetup ? '設定管理員密碼（至少 8 字元）' : '管理員密碼'}
              </label>
              <input
                type="password"
                required
                minLength={authStatus?.needsSetup ? 8 : 1}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none"
              />
            </div>
            {authStatus?.needsSetup && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">再次確認密碼</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authConfirm}
                  onChange={(e) => setAuthConfirm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] disabled:opacity-50 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {authLoading ? '驗證中……' : authStatus?.needsSetup ? '完成設定並進入後台' : '登入管理後台'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F4C81] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回《澳門社會服務百科》市民前台
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered units for table
  const filteredUnits = units.filter((u) => {
    if (unitStatusFilter !== 'all' && u.verification_status !== unitStatusFilter) return false;
    if (unitQuery.trim()) {
      const q = unitQuery.trim().toLowerCase();
      return (
        u.unit_name_zh.toLowerCase().includes(q) ||
        u.org_name_zh.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingQueue = units.filter((u) => u.verification_status === 'pending' || u.verification_status === 'needs_update');

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'overview', label: '總覽與待核實', icon: ShieldCheck, badge: pendingQueue.length },
    { id: 'units', label: '服務單位管理', icon: Database, badge: units.length },
    { id: 'organizations', label: '主辦機構管理', icon: Building2 },
    { id: 'import-export', label: 'CSV / Excel 匯入匯出', icon: FileSpreadsheet },
    { id: 'categories', label: '12 大分類管理', icon: FolderTree },
    { id: 'synonyms', label: '搜尋同義詞庫', icon: Tag },
    { id: 'sources', label: '官方資料來源', icon: RefreshCw },
    { id: 'duplicates', label: '重複資料檢查', icon: CopyCheck, badge: duplicates.length },
    { id: 'audit', label: '更新紀錄審計', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col lg:flex-row">
      {/* Left Admin Sidebar (240px desktop) */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200">
          <div className="text-base font-bold text-[#0F4C81]">澳門社會服務百科</div>
          <div className="text-xs text-slate-500 mt-0.5">資料庫管理與核實後台</div>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-[#0F4C81] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`font-mono-num text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-200 space-y-2 hidden lg:block">
          <div className="text-xs text-slate-500">登入帳號：{adminUsername}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              返回前台網站
            </button>
            <button
              type="button"
              onClick={clearAdminSession}
              aria-label="登出管理後台"
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0">
        {/* Top Admin Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">管理後台 / {navItems.find((n) => n.id === tab)?.label}</div>
            <h1 className="text-xl font-bold text-slate-900">{navItems.find((n) => n.id === tab)?.label}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditingUnit(null);
                setShowUnitModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增服務單位
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="lg:hidden px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              回前台
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-[#15803D]/10 border border-[#15803D]/30 text-sm font-medium text-[#15803D]">
            {toast}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* TAB 1: OVERVIEW & VERIFICATION QUEUE */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: '總服務單位', val: stats?.total_units ?? 0, color: 'text-[#0F4C81]' },
                  { label: '已核實資料', val: stats?.verified_units ?? 0, color: 'text-[#15803D]' },
                  { label: '待核實資料', val: stats?.pending_units ?? 0, color: 'text-slate-800' },
                  { label: '需要更新', val: stats?.needs_update_units ?? 0, color: 'text-amber-700' },
                  { label: '已停用單位', val: stats?.inactive_units ?? 0, color: 'text-rose-700' },
                ].map((k) => (
                  <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className={`text-2xl font-bold font-mono-num ${k.color}`}>{k.val}</div>
                    <div className="text-xs text-slate-600 mt-1">{k.label}</div>
                  </div>
                ))}
              </div>

              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    待核實及需要更新資料隊列（{pendingQueue.length} 筆）
                  </h2>
                </div>
                {pendingQueue.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    目前所有記錄均已完成核實。
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingQueue.map((u) => (
                      <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono-num">#{u.id}</span>
                            <span>·</span>
                            <span>{u.category_name_zh}</span>
                            <span>·</span>
                            <VerificationText status={u.verification_status} />
                          </div>
                          <div className="font-bold text-slate-900">{u.unit_name_zh}</div>
                          <div className="text-xs text-slate-600">
                            {u.address} · 電話：{u.phone}
                          </div>
                          {u.notes && <div className="text-xs text-amber-700">備註：{u.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnit(u);
                              setShowUnitModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            編輯核對
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickVerify(u, 'verified')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            標記已核實
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: SERVICE UNITS CRUD & BATCH UPDATE */}
          {tab === 'units' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 bg-white flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={unitQuery}
                      onChange={(e) => setUnitQuery(e.target.value)}
                      placeholder="篩選單位名稱、機構、地址或電話……"
                      className="w-full text-sm focus:outline-none"
                    />
                  </div>
                  <select
                    value={unitStatusFilter}
                    onChange={(e) => setUnitStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="all">全部狀態</option>
                    <option value="verified">已核實</option>
                    <option value="pending">待核實</option>
                    <option value="needs_update">需要更新</option>
                    <option value="inactive">已停止服務</option>
                  </select>
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-[#0F4C81]">已選 {selectedIds.length} 項：</span>
                    <button
                      type="button"
                      onClick={() => handleBatchStatus('verified')}
                      className="px-2.5 py-1.5 rounded bg-[#15803D] text-white font-semibold cursor-pointer"
                    >
                      批量已核實
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatus('needs_update')}
                      className="px-2.5 py-1.5 rounded bg-amber-600 text-white font-semibold cursor-pointer"
                    >
                      標記需更新
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatus('inactive')}
                      className="px-2.5 py-1.5 rounded bg-rose-700 text-white font-semibold cursor-pointer"
                    >
                      停用服務
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#F7F9FC] border-b border-slate-200 text-slate-600">
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredUnits.length > 0 && selectedIds.length === filteredUnits.length}
                          onChange={(e) =>
                            setSelectedIds(e.target.checked ? filteredUnits.map((u) => u.id) : [])
                          }
                        />
                      </th>
                      <th className="p-3 font-semibold">服務單位 / 所屬機構</th>
                      <th className="p-3 font-semibold">分類</th>
                      <th className="p-3 font-semibold">區域</th>
                      <th className="p-3 font-semibold">電話</th>
                      <th className="p-3 font-semibold">狀態</th>
                      <th className="p-3 font-semibold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnits.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked ? [...prev, u.id] : prev.filter((x) => x !== u.id)
                              )
                            }
                          />
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-slate-900">{u.unit_name_zh}</div>
                          <div className="text-xs text-slate-500">{u.org_name_zh}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-700">{u.category_name_zh}</td>
                        <td className="p-3 whitespace-nowrap text-slate-700">{u.region}</td>
                        <td className="p-3 whitespace-nowrap font-mono-num text-slate-700">{u.phone}</td>
                        <td className="p-3 whitespace-nowrap">
                          <VerificationText status={u.verification_status} />
                        </td>
                        <td className="p-3 whitespace-nowrap text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnit(u);
                              setShowUnitModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:border-[#0F4C81] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORGANIZATIONS */}
          {tab === 'organizations' && (
            <div className="space-y-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/organizations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newOrg),
                  });
                  if (res.ok) {
                    setNewOrg({ name_zh: '', name_pt: '', name_en: '', org_type: '社工局受資助服務機構', website: '', phone: '' });
                    showToast('已新增主辦機構');
                    await loadAllAdminData();
                  } else {
                    const err = await res.json();
                    showToast(err.error || '新增失敗');
                  }
                }}
                className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
              >
                <input
                  type="text"
                  required
                  placeholder="機構中文名稱 *"
                  value={newOrg.name_zh}
                  onChange={(e) => setNewOrg({ ...newOrg, name_zh: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="機構葡文名稱（選填）"
                  value={newOrg.name_pt}
                  onChange={(e) => setNewOrg({ ...newOrg, name_pt: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="機構英文名稱（選填）"
                  value={newOrg.name_en}
                  onChange={(e) => setNewOrg({ ...newOrg, name_en: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <select
                  value={newOrg.org_type}
                  onChange={(e) => setNewOrg({ ...newOrg, org_type: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="政府社會服務單位">政府社會服務單位</option>
                  <option value="社工局受資助服務機構">社工局受資助服務機構</option>
                  <option value="非受資助社會服務機構">非受資助社會服務機構</option>
                  <option value="民間非牟利社會服務團體">民間非牟利社會服務團體</option>
                </select>
                <input
                  type="text"
                  placeholder="總機電話"
                  value={newOrg.phone}
                  onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold py-2 px-4 cursor-pointer"
                >
                  新增主辦機構
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#F7F9FC] border-b border-slate-200 text-xs text-slate-600">
                      <th className="p-3.5">主辦機構名稱</th>
                      <th className="p-3.5">性質</th>
                      <th className="p-3.5">聯絡電話</th>
                      <th className="p-3.5">轄下分點數</th>
                      <th className="p-3.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {organizations.map((o) => (
                      <tr key={o.id}>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{o.name_zh}</div>
                          <div className="text-xs text-slate-500">{o.name_pt || o.name_en}</div>
                        </td>
                        <td className="p-3.5 text-xs text-slate-700">{o.org_type}</td>
                        <td className="p-3.5 text-xs font-mono-num text-slate-700">{o.phone || '—'}</td>
                        <td className="p-3.5 text-xs font-mono-num font-bold text-[#0F4C81]">{o.unit_count ?? 0}</td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await adminFetch(`/api/admin/organizations/${o.id}`, { method: 'DELETE' });
                              showToast(`已刪除機構「${o.name_zh}」`);
                              await loadAllAdminData();
                            }}
                            className="text-xs text-rose-700 hover:underline cursor-pointer"
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CSV / EXCEL BULK IMPORT & EXPORT */}
          {tab === 'import-export' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export & Template */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">匯出資料庫及下載標準匯入範本</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    可將全澳社會服務資料庫完整匯出為 Excel（.xlsx）或 UTF-8 CSV 檔案作離線核實及備份；匯入新資料前建議先下載標準範本。
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile('/api/admin/export?format=xlsx', 'macau_social_services.xlsx')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white text-sm font-semibold cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      匯出 Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile('/api/admin/export?format=csv', 'macau_social_services.csv')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:border-[#0F4C81] text-slate-800 text-sm font-semibold cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      匯出 CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile('/api/admin/template', 'macau_services_import_template.xlsx')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E]/5 text-sm font-semibold cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      下載匯入範本 (.xlsx)
                    </button>
                  </div>
                </section>

                {/* Upload Import File */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">批量匯入 CSV / Excel 真實資料</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    支援中英文表頭（如「服務單位名稱 / unit_name_zh」、「機構中文名稱 / org_name_zh」、「服務類別」、「地址」、「電話」等），上傳後先預覽並自動標記重複項目。
                  </p>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {importing ? '解析中……' : '選擇 CSV 或 Excel (.xlsx) 檔案'}
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFilePreview}
                      className="hidden"
                    />
                  </label>
                </section>
              </div>

              {/* Import Preview Table */}
              {importPreview && (
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        匯入預覽：{importPreview.filename}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        共 {importPreview.total_rows} 列 · 有效 {importPreview.valid_rows} 列 · 偵測到重複 {importPreview.duplicate_rows} 列
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                        自動略過重複單位名稱
                      </label>
                      <button
                        type="button"
                        disabled={importing}
                        onClick={handleCommitImport}
                        className="px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        確認寫入資料庫
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F7F9FC] border-b border-slate-200 text-slate-600">
                          <th className="p-2.5">行號</th>
                          <th className="p-2.5">服務單位名稱</th>
                          <th className="p-2.5">所屬機構</th>
                          <th className="p-2.5">分類</th>
                          <th className="p-2.5">區域</th>
                          <th className="p-2.5">電話</th>
                          <th className="p-2.5">檢查結果</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.rows.map((r) => (
                          <tr key={r.row_index}>
                            <td className="p-2.5 font-mono-num">{r.row_index}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{r.unit_name_zh || '—'}</td>
                            <td className="p-2.5">{r.org_name_zh}</td>
                            <td className="p-2.5">{r.category_label}</td>
                            <td className="p-2.5">{r.region}</td>
                            <td className="p-2.5 font-mono-num">{r.phone}</td>
                            <td className="p-2.5">
                              {r.error ? (
                                <span className="text-rose-700 font-semibold">{r.error}</span>
                              ) : r.is_duplicate ? (
                                <span className="text-amber-700 font-semibold">疑似重複</span>
                              ) : (
                                <span className="text-[#15803D] font-semibold">可匯入</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {tab === 'categories' && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {categories.map((c) => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono-num text-slate-500">
                      #{c.sort_order} · {c.slug} · {c.unit_count ?? 0} 間服務單位
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {c.name_zh} / {c.name_pt} / {c.name_en}
                    </div>
                    <p className="text-xs text-slate-600">{c.description_zh}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: SYNONYMS */}
          {tab === 'synonyms' && (
            <div className="space-y-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/synonyms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSyn),
                  });
                  if (res.ok) {
                    setNewSyn({ canonical_term: '', synonyms: '', category_slug: '', notes: '' });
                    showToast('已新增同義詞組並即時套用於搜尋引擎');
                    await loadAllAdminData();
                  }
                }}
                className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
              >
                <input
                  type="text"
                  required
                  placeholder="標準服務詞彙（例：安老院舍）"
                  value={newSyn.canonical_term}
                  onChange={(e) => setNewSyn({ ...newSyn, canonical_term: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="同義詞與口語（以逗號分隔）"
                  value={newSyn.synonyms}
                  onChange={(e) => setNewSyn({ ...newSyn, synonyms: e.target.value })}
                  className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold py-2 px-4 cursor-pointer"
                >
                  新增同義詞組
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {synonyms.map((s) => (
                  <div key={s.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">
                        {s.canonical_term}
                        {s.category_slug && (
                          <span className="ml-2 text-xs font-mono-num text-[#0F4C81]">({s.category_slug})</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{s.synonyms}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminFetch(`/api/admin/synonyms/${s.id}`, { method: 'DELETE' });
                        showToast('已刪除同義詞組');
                        await loadAllAdminData();
                      }}
                      className="text-xs text-rose-700 hover:underline shrink-0 cursor-pointer"
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: DATA SOURCES */}
          {tab === 'sources' && (
            <div className="space-y-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/sources', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSource),
                  });
                  if (res.ok) {
                    setNewSource({ name: '', url: '', authority_type: '官方來源', description: '' });
                    showToast('已新增資料來源');
                    await loadAllAdminData();
                  }
                }}
                className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
              >
                <input
                  type="text"
                  required
                  placeholder="來源名稱 *"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="url"
                  placeholder="官方網址 (https://...)"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="說明備註"
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-semibold py-2 px-4 cursor-pointer"
                >
                  新增資料來源
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {sources.map((s) => (
                  <div key={s.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {s.authority_type} · 最後檢視：{s.last_checked_date} · 關聯單位：{s.unit_count ?? 0}
                      </div>
                      <div className="text-xs text-[#0F4C81] mt-1">{s.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminFetch(`/api/admin/sources/${s.id}`, { method: 'DELETE' });
                        showToast('已刪除資料來源');
                        await loadAllAdminData();
                      }}
                      className="text-xs text-rose-700 hover:underline shrink-0 cursor-pointer"
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: DUPLICATES CHECK */}
          {tab === 'duplicates' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">自動重複資料檢查結果</h2>
                <button
                  type="button"
                  onClick={loadAllAdminData}
                  className="text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
                >
                  重新掃描
                </button>
              </div>
              {duplicates.length === 0 ? (
                <p className="text-sm text-[#15803D] font-medium py-6 text-center">
                  未發現重複的服務單位名稱或衝突直線電話，資料庫狀態良好。
                </p>
              ) : (
                <div className="space-y-4">
                  {duplicates.map((g, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
                      <div className="text-xs font-bold text-amber-800">
                        {g.reason}（比對鍵值：{g.key}）
                      </div>
                      <div className="divide-y divide-amber-200/60">
                        {g.units.map((u) => (
                          <div key={u.id} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono-num text-slate-500 mr-2">#{u.id}</span>
                              <span className="font-bold text-slate-900">{u.unit_name_zh}</span>
                              <span className="text-slate-600 ml-2">{u.phone}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const full = units.find((x) => x.id === u.id);
                                if (full) {
                                  setEditingUnit(full);
                                  setShowUnitModal(true);
                                }
                              }}
                              className="text-[#0F4C81] font-semibold hover:underline cursor-pointer"
                            >
                              檢視編輯
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-slate-200 text-xs text-slate-600">
                    <th className="p-3.5">時間 (UTC)</th>
                    <th className="p-3.5">操作</th>
                    <th className="p-3.5">執行者</th>
                    <th className="p-3.5">更新內容摘要</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3.5 whitespace-nowrap font-mono-num text-xs text-slate-500">{log.created_at}</td>
                      <td className="p-3.5 whitespace-nowrap font-mono-num text-xs font-semibold text-[#0F4C81]">{log.action}</td>
                      <td className="p-3.5 whitespace-nowrap text-xs text-slate-700">{log.actor}</td>
                      <td className="p-3.5 text-slate-800">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Unit Modal */}
      {showUnitModal && (
        <UnitFormModal
          unit={editingUnit}
          categories={categories}
          organizations={organizations}
          sources={sources}
          onClose={() => {
            setShowUnitModal(false);
            setEditingUnit(null);
          }}
          onSave={handleSaveUnit}
        />
      )}
    </div>
  );
}
