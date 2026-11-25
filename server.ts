import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import {
  db,
  findDuplicateUnits,
  getAllUnitsWithCategory,
  getDynamicStats,
  getUnitById,
  initDatabase,
  logAudit,
} from './server/db.ts';
import {
  createInitialAdmin,
  getAdminAuthStatus,
  requireAdmin,
  signAdminToken,
  verifyAdminCredentials,
  type AdminRequest,
} from './server/auth.ts';
import { performSmartSearch } from './server/searchEngine.ts';
import { runAIServiceMatch } from './server/aiMatcher.ts';
import type { Locale } from './src/types.ts';

initDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

function parseTriState(val: unknown): number {
  if (val === 1 || val === true || val === '1' || val === '是' || val === 'true' || val === 'Yes') return 1;
  if (val === 0 || val === false || val === '0' || val === '否' || val === 'false' || val === 'No') return 0;
  return -1;
}

function parseNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function validateMacauCoords(lat: number | null, lng: number | null): { lat: number | null; lng: number | null } {
  if (lat === null || lng === null) return { lat: null, lng: null };
  // Valid bounding box for Macau SAR (Peninsula, Taipa, Cotai, Coloane, UM Hengqin campus)
  if (lat >= 22.10 && lat <= 22.23 && lng >= 113.52 && lng <= 113.60) {
    return { lat, lng };
  }
  return { lat: null, lng: null };
}

// ============================================================
// PUBLIC & OPEN DATA API (/api/v1/*)
// Reserved clean REST schema for future gov/data.gov.mo integration
// ============================================================

app.get('/api/v1/stats', (_req, res) => {
  try {
    res.json(getDynamicStats());
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: '無法讀取統計資料。' });
  }
});

app.get('/api/v1/categories', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT c.*, COUNT(CASE WHEN u.verification_status != 'inactive' THEN u.id END) as unit_count
        FROM categories c
        LEFT JOIN service_units u ON u.category_id = c.id
        GROUP BY c.id
        ORDER BY c.sort_order ASC
      `
      )
      .all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: '無法讀取服務分類。' });
  }
});

app.get('/api/v1/organizations', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT o.*, COUNT(u.id) as unit_count
        FROM organizations o
        LEFT JOIN service_units u ON u.organization_id = o.id
        GROUP BY o.id
        ORDER BY o.id ASC
      `
      )
      .all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ error: '無法讀取機構資料。' });
  }
});

app.get('/api/v1/sources', (_req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT s.*, COUNT(u.id) as unit_count
        FROM data_sources s
        LEFT JOIN service_units u ON u.data_source_id = s.id
        GROUP BY s.id
        ORDER BY s.id ASC
      `
      )
      .all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching data sources:', err);
    res.status(500).json({ error: '無法讀取資料來源。' });
  }
});

app.get('/api/v1/services', (req, res) => {
  try {
    const result = performSmartSearch({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      region: typeof req.query.region === 'string' ? req.query.region : undefined,
      parish: typeof req.query.parish === 'string' ? req.query.parish : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      residential: req.query.residential === '1' || req.query.residential === 'true',
      daycare: req.query.daycare === '1' || req.query.daycare === 'true',
      barrierFree: req.query.barrierFree === '1' || req.query.barrierFree === 'true',
      acceptsReferral: req.query.acceptsReferral === '1' || req.query.acceptsReferral === 'true',
      sort:
        req.query.sort === 'verified' || req.query.sort === 'name' || req.query.sort === 'relevance'
          ? req.query.sort
          : 'relevance',
    });
    res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: '搜尋服務時發生錯誤。' });
  }
});

app.get('/api/v1/services/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: '無效的服務單位編號。' });
    return;
  }
  const unit = getUnitById(id);
  if (!unit) {
    res.status(404).json({ error: '找不到指定的服務單位。' });
    return;
  }
  // Also fetch sibling units from the same parent organization
  const siblings = unit.organization_id
    ? db
        .prepare(
          `SELECT id, unit_name_zh, region, parish, phone, verification_status
           FROM service_units
           WHERE organization_id = ? AND id != ? AND verification_status != 'inactive'
           ORDER BY id ASC LIMIT 8`
        )
        .all(unit.organization_id, unit.id)
    : [];

  res.json({ unit, siblings });
});

app.get('/api/v1/map', (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : 'all';
    const region = typeof req.query.region === 'string' ? req.query.region : 'all';
    const allUnits = getAllUnitsWithCategory(false);

    const filtered = allUnits.filter((u) => {
      if (category && category !== 'all' && u.category_slug !== category) return false;
      if (region && region !== 'all' && u.region !== region) return false;
      return true;
    });

    const mapped = filtered.filter((u) => u.latitude !== null && u.longitude !== null);
    const unmapped = filtered.filter((u) => u.latitude === null || u.longitude === null);

    res.json({
      total_matching: filtered.length,
      mapped_count: mapped.length,
      unmapped_count: unmapped.length,
      mapped,
      unmapped,
    });
  } catch (err) {
    console.error('Map endpoint error:', err);
    res.status(500).json({ error: '無法載入地圖資料。' });
  }
});

app.post('/api/v1/ai-match', async (req, res) => {
  try {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const locale: Locale =
      req.body?.locale === 'pt' || req.body?.locale === 'en' ? req.body.locale : 'zh-MO';
    const region = typeof req.body?.region === 'string' ? req.body.region : undefined;

    if (!query || query.length < 2) {
      res.status(400).json({ error: '請詳細描述您或家人的情況（至少 2 個字）。' });
      return;
    }
    if (query.length > 1000) {
      res.status(400).json({ error: '描述字數請控制在 1000 字以內。' });
      return;
    }

    const result = await runAIServiceMatch(query, locale, region);
    res.json(result);
  } catch (err: unknown) {
    console.error('AI Match error:', err);
    const message = err instanceof Error ? err.message : 'AI 智能服務配對暫時無法回應，請稍後再試。';
    res.status(500).json({ error: message });
  }
});

// ============================================================
// ADMIN AUTHENTICATION ROUTES
// ============================================================

app.get('/api/admin/status', (_req, res) => {
  res.json(getAdminAuthStatus());
});

app.post('/api/admin/setup', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const result = createInitialAdmin(username, password);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  const token = signAdminToken(username.trim());
  res.json({ ok: true, username: username.trim(), token });
});

app.post('/api/admin/login', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : 'admin';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const check = verifyAdminCredentials(username, password);
  if (!check.valid) {
    res.status(401).json({ error: check.error || '登入失敗。' });
    return;
  }
  const token = signAdminToken(check.username);
  logAudit('LOGIN', 'admin_account', null, `管理員登入後台（${check.username}）`, check.username);
  res.json({ ok: true, username: check.username, token });
});

app.get('/api/admin/me', requireAdmin, (req: AdminRequest, res) => {
  res.json({ authenticated: true, username: req.adminUser?.username });
});

// ============================================================
// PROTECTED ADMIN MANAGEMENT ROUTES
// ============================================================

app.get('/api/admin/units', requireAdmin, (req, res) => {
  const result = performSmartSearch({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    region: typeof req.query.region === 'string' ? req.query.region : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    includeInactive: true,
    sort: 'relevance',
  });
  res.json(result.items);
});

app.post('/api/admin/units', requireAdmin, (req: AdminRequest, res) => {
  try {
    const b = req.body ?? {};
    const unitNameZh = typeof b.unit_name_zh === 'string' ? b.unit_name_zh.trim() : '';
    const categoryId = Number(b.category_id);
    if (!unitNameZh || !Number.isInteger(categoryId)) {
      res.status(400).json({ error: '服務單位中文名稱及服務分類為必填欄位。' });
      return;
    }

    const coords = validateMacauCoords(parseNullableNumber(b.latitude), parseNullableNumber(b.longitude));
    const today = new Date().toISOString().slice(0, 10);

    const orgId = b.organization_id ? Number(b.organization_id) : null;
    let orgNameZh = String(b.org_name_zh ?? '').trim();
    let orgNamePt = String(b.org_name_pt ?? '').trim();
    let orgNameEn = String(b.org_name_en ?? '').trim();
    let orgType = String(b.org_type ?? '民間非牟利社會服務團體').trim();

    if (orgId) {
      const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as
        | { name_zh: string; name_pt: string; name_en: string; org_type: string }
        | undefined;
      if (org) {
        if (!orgNameZh) orgNameZh = org.name_zh;
        if (!orgNamePt) orgNamePt = org.name_pt;
        if (!orgNameEn) orgNameEn = org.name_en;
        if (!b.org_type) orgType = org.org_type;
      }
    }

    const validStatus = ['verified', 'pending', 'needs_update', 'inactive'].includes(b.verification_status)
      ? b.verification_status
      : 'pending';

    const info = db
      .prepare(
        `
      INSERT INTO service_units (
        organization_id, org_name_zh, org_name_pt, org_name_en, org_type,
        unit_name_zh, unit_name_pt, unit_name_en,
        category_id, sub_category, target_audience, service_details,
        eligibility, application_procedure, required_documents,
        address, parish, region, phone, fax, email, website, opening_hours, fees,
        requires_appointment, accepts_referral, requires_assessment,
        provides_residential, provides_daycare, is_barrier_free,
        latitude, longitude,
        data_source_id, source_name, source_url, collected_date, last_verified_date,
        verification_status, needs_update, is_medical_service, notes
      ) VALUES (
        @organization_id, @org_name_zh, @org_name_pt, @org_name_en, @org_type,
        @unit_name_zh, @unit_name_pt, @unit_name_en,
        @category_id, @sub_category, @target_audience, @service_details,
        @eligibility, @application_procedure, @required_documents,
        @address, @parish, @region, @phone, @fax, @email, @website, @opening_hours, @fees,
        @requires_appointment, @accepts_referral, @requires_assessment,
        @provides_residential, @provides_daycare, @is_barrier_free,
        @latitude, @longitude,
        @data_source_id, @source_name, @source_url, @collected_date, @last_verified_date,
        @verification_status, @needs_update, @is_medical_service, @notes
      )
    `
      )
      .run({
        organization_id: orgId,
        org_name_zh: orgNameZh || '待核實',
        org_name_pt: orgNamePt,
        org_name_en: orgNameEn,
        org_type: orgType,
        unit_name_zh: unitNameZh,
        unit_name_pt: String(b.unit_name_pt ?? '').trim(),
        unit_name_en: String(b.unit_name_en ?? '').trim(),
        category_id: categoryId,
        sub_category: String(b.sub_category ?? '').trim(),
        target_audience: String(b.target_audience ?? '').trim() || '待核實',
        service_details: String(b.service_details ?? '').trim() || '待核實',
        eligibility: String(b.eligibility ?? '').trim() || '待核實',
        application_procedure: String(b.application_procedure ?? '').trim() || '待核實',
        required_documents: String(b.required_documents ?? '').trim() || '待核實',
        address: String(b.address ?? '').trim() || '待核實',
        parish: String(b.parish ?? '').trim() || '待核實',
        region: String(b.region ?? '澳門半島').trim(),
        phone: String(b.phone ?? '').trim() || '待核實',
        fax: String(b.fax ?? '').trim() || '待核實',
        email: String(b.email ?? '').trim() || '待核實',
        website: sanitizeUrl(b.website),
        opening_hours: String(b.opening_hours ?? '').trim() || '待核實',
        fees: String(b.fees ?? '').trim() || '待核實',
        requires_appointment: parseTriState(b.requires_appointment),
        accepts_referral: parseTriState(b.accepts_referral),
        requires_assessment: parseTriState(b.requires_assessment),
        provides_residential: parseTriState(b.provides_residential),
        provides_daycare: parseTriState(b.provides_daycare),
        is_barrier_free: parseTriState(b.is_barrier_free),
        latitude: coords.lat,
        longitude: coords.lng,
        data_source_id: b.data_source_id ? Number(b.data_source_id) : null,
        source_name: String(b.source_name ?? '').trim() || '待核實',
        source_url: sanitizeUrl(b.source_url),
        collected_date: String(b.collected_date ?? '').trim() || today,
        last_verified_date:
          validStatus === 'verified' ? String(b.last_verified_date ?? '').trim() || today : String(b.last_verified_date ?? '').trim(),
        verification_status: validStatus,
        needs_update: b.needs_update ? 1 : 0,
        is_medical_service: b.is_medical_service ? 1 : 0,
        notes: String(b.notes ?? '').trim(),
      });

    const newId = Number(info.lastInsertRowid);
    logAudit('CREATE', 'service_unit', newId, `新增服務單位：${unitNameZh}`, req.adminUser?.username);
    res.status(201).json(getUnitById(newId));
  } catch (err) {
    console.error('Create unit error:', err);
    res.status(500).json({ error: '新增服務單位失敗。' });
  }
});

app.put('/api/admin/units/:id', requireAdmin, (req: AdminRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getUnitById(id);
    if (!existing) {
      res.status(404).json({ error: '找不到指定的服務單位。' });
      return;
    }

    const b = req.body ?? {};
    const coords = validateMacauCoords(
      b.latitude !== undefined ? parseNullableNumber(b.latitude) : existing.latitude,
      b.longitude !== undefined ? parseNullableNumber(b.longitude) : existing.longitude
    );
    const today = new Date().toISOString().slice(0, 10);
    const nextStatus = ['verified', 'pending', 'needs_update', 'inactive'].includes(b.verification_status)
      ? b.verification_status
      : existing.verification_status;

    db.prepare(
      `
      UPDATE service_units SET
        organization_id = @organization_id,
        org_name_zh = @org_name_zh,
        org_name_pt = @org_name_pt,
        org_name_en = @org_name_en,
        org_type = @org_type,
        unit_name_zh = @unit_name_zh,
        unit_name_pt = @unit_name_pt,
        unit_name_en = @unit_name_en,
        category_id = @category_id,
        sub_category = @sub_category,
        target_audience = @target_audience,
        service_details = @service_details,
        eligibility = @eligibility,
        application_procedure = @application_procedure,
        required_documents = @required_documents,
        address = @address,
        parish = @parish,
        region = @region,
        phone = @phone,
        fax = @fax,
        email = @email,
        website = @website,
        opening_hours = @opening_hours,
        fees = @fees,
        requires_appointment = @requires_appointment,
        accepts_referral = @accepts_referral,
        requires_assessment = @requires_assessment,
        provides_residential = @provides_residential,
        provides_daycare = @provides_daycare,
        is_barrier_free = @is_barrier_free,
        latitude = @latitude,
        longitude = @longitude,
        data_source_id = @data_source_id,
        source_name = @source_name,
        source_url = @source_url,
        collected_date = @collected_date,
        last_verified_date = @last_verified_date,
        verification_status = @verification_status,
        needs_update = @needs_update,
        is_medical_service = @is_medical_service,
        notes = @notes,
        updated_at = datetime('now')
      WHERE id = @id
    `
    ).run({
      id,
      organization_id: b.organization_id !== undefined ? (b.organization_id ? Number(b.organization_id) : null) : existing.organization_id,
      org_name_zh: String(b.org_name_zh ?? existing.org_name_zh).trim(),
      org_name_pt: String(b.org_name_pt ?? existing.org_name_pt).trim(),
      org_name_en: String(b.org_name_en ?? existing.org_name_en).trim(),
      org_type: String(b.org_type ?? existing.org_type).trim(),
      unit_name_zh: String(b.unit_name_zh ?? existing.unit_name_zh).trim(),
      unit_name_pt: String(b.unit_name_pt ?? existing.unit_name_pt).trim(),
      unit_name_en: String(b.unit_name_en ?? existing.unit_name_en).trim(),
      category_id: b.category_id ? Number(b.category_id) : existing.category_id,
      sub_category: String(b.sub_category ?? existing.sub_category).trim(),
      target_audience: String(b.target_audience ?? existing.target_audience).trim() || '待核實',
      service_details: String(b.service_details ?? existing.service_details).trim() || '待核實',
      eligibility: String(b.eligibility ?? existing.eligibility).trim() || '待核實',
      application_procedure: String(b.application_procedure ?? existing.application_procedure).trim() || '待核實',
      required_documents: String(b.required_documents ?? existing.required_documents).trim() || '待核實',
      address: String(b.address ?? existing.address).trim() || '待核實',
      parish: String(b.parish ?? existing.parish).trim() || '待核實',
      region: String(b.region ?? existing.region).trim(),
      phone: String(b.phone ?? existing.phone).trim() || '待核實',
      fax: String(b.fax ?? existing.fax).trim() || '待核實',
      email: String(b.email ?? existing.email).trim() || '待核實',
      website: b.website !== undefined ? sanitizeUrl(b.website) : existing.website,
      opening_hours: String(b.opening_hours ?? existing.opening_hours).trim() || '待核實',
      fees: String(b.fees ?? existing.fees).trim() || '待核實',
      requires_appointment:
        b.requires_appointment !== undefined ? parseTriState(b.requires_appointment) : existing.requires_appointment,
      accepts_referral:
        b.accepts_referral !== undefined ? parseTriState(b.accepts_referral) : existing.accepts_referral,
      requires_assessment:
        b.requires_assessment !== undefined ? parseTriState(b.requires_assessment) : existing.requires_assessment,
      provides_residential:
        b.provides_residential !== undefined ? parseTriState(b.provides_residential) : existing.provides_residential,
      provides_daycare:
        b.provides_daycare !== undefined ? parseTriState(b.provides_daycare) : existing.provides_daycare,
      is_barrier_free:
        b.is_barrier_free !== undefined ? parseTriState(b.is_barrier_free) : existing.is_barrier_free,
      latitude: coords.lat,
      longitude: coords.lng,
      data_source_id: b.data_source_id !== undefined ? (b.data_source_id ? Number(b.data_source_id) : null) : existing.data_source_id,
      source_name: String(b.source_name ?? existing.source_name).trim() || '待核實',
      source_url: b.source_url !== undefined ? sanitizeUrl(b.source_url) : existing.source_url,
      collected_date: String(b.collected_date ?? existing.collected_date).trim(),
      last_verified_date:
        nextStatus === 'verified'
          ? String(b.last_verified_date ?? '').trim() || today
          : String(b.last_verified_date ?? existing.last_verified_date).trim(),
      verification_status: nextStatus,
      needs_update: b.needs_update !== undefined ? (b.needs_update ? 1 : 0) : nextStatus === 'needs_update' ? 1 : 0,
      is_medical_service:
        b.is_medical_service !== undefined ? (b.is_medical_service ? 1 : 0) : existing.is_medical_service,
      notes: String(b.notes ?? existing.notes).trim(),
    });

    logAudit('UPDATE', 'service_unit', id, `更新服務單位：${b.unit_name_zh ?? existing.unit_name_zh}（狀態：${nextStatus}）`, req.adminUser?.username);
    res.json(getUnitById(id));
  } catch (err) {
    console.error('Update unit error:', err);
    res.status(500).json({ error: '更新服務單位失敗。' });
  }
});

app.post('/api/admin/units/batch-status', requireAdmin, (req: AdminRequest, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : [];
  const status = req.body?.verification_status;
  if (ids.length === 0 || !['verified', 'pending', 'needs_update', 'inactive'].includes(status)) {
    res.status(400).json({ error: '請選擇至少一項單位及有效核實狀態。' });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const updateStmt = db.prepare(
    `UPDATE service_units
     SET verification_status = ?,
         needs_update = ?,
         last_verified_date = CASE WHEN ? = 'verified' THEN ? ELSE last_verified_date END,
         updated_at = datetime('now')
     WHERE id = ?`
  );
  const tx = db.transaction(() => {
    for (const id of ids) {
      updateStmt.run(status, status === 'needs_update' ? 1 : 0, status, today, id);
    }
  });
  tx();
  logAudit('BATCH_UPDATE', 'service_unit', null, `批量更新 ${ids.length} 個服務單位狀態為「${status}」`, req.adminUser?.username);
  res.json({ ok: true, updated: ids.length });
});

app.delete('/api/admin/units/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  const existing = getUnitById(id);
  if (!existing) {
    res.status(404).json({ error: '找不到指定的服務單位。' });
    return;
  }
  db.prepare('DELETE FROM service_units WHERE id = ?').run(id);
  logAudit('DELETE', 'service_unit', id, `刪除服務單位：${existing.unit_name_zh}`, req.adminUser?.username);
  res.json({ ok: true });
});

// Organizations CRUD
app.post('/api/admin/organizations', requireAdmin, (req: AdminRequest, res) => {
  const b = req.body ?? {};
  const nameZh = String(b.name_zh ?? '').trim();
  if (!nameZh) {
    res.status(400).json({ error: '機構中文名稱為必填。' });
    return;
  }
  try {
    const info = db
      .prepare(
        'INSERT INTO organizations (name_zh, name_pt, name_en, org_type, website, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        nameZh,
        String(b.name_pt ?? '').trim(),
        String(b.name_en ?? '').trim(),
        String(b.org_type ?? '民間非牟利社會服務團體').trim(),
        sanitizeUrl(b.website),
        String(b.phone ?? '').trim(),
        String(b.notes ?? '').trim()
      );
    const id = Number(info.lastInsertRowid);
    logAudit('CREATE', 'organization', id, `新增主辦機構：${nameZh}`, req.adminUser?.username);
    res.status(201).json(db.prepare('SELECT * FROM organizations WHERE id = ?').get(id));
  } catch {
    res.status(400).json({ error: '機構名稱可能已存在或資料格式錯誤。' });
  }
});

app.delete('/api/admin/organizations/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  const org = db.prepare('SELECT name_zh FROM organizations WHERE id = ?').get(id) as { name_zh: string } | undefined;
  if (!org) {
    res.status(404).json({ error: '找不到該機構。' });
    return;
  }
  db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
  logAudit('DELETE', 'organization', id, `刪除主辦機構：${org.name_zh}`, req.adminUser?.username);
  res.json({ ok: true });
});

// Categories management
app.put('/api/admin/categories/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, string | number> | undefined;
  if (!existing) {
    res.status(404).json({ error: '找不到分類。' });
    return;
  }
  db.prepare(
    `UPDATE categories SET name_zh = ?, name_pt = ?, name_en = ?, description_zh = ?, description_pt = ?, description_en = ?, sort_order = ? WHERE id = ?`
  ).run(
    String(b.name_zh ?? existing.name_zh).trim(),
    String(b.name_pt ?? existing.name_pt).trim(),
    String(b.name_en ?? existing.name_en).trim(),
    String(b.description_zh ?? existing.description_zh).trim(),
    String(b.description_pt ?? existing.description_pt).trim(),
    String(b.description_en ?? existing.description_en).trim(),
    Number(b.sort_order ?? existing.sort_order),
    id
  );
  logAudit('UPDATE', 'category', id, `更新服務分類：${b.name_zh ?? existing.name_zh}`, req.adminUser?.username);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

// Synonyms CRUD
app.get('/api/admin/synonyms', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM search_synonyms ORDER BY id ASC').all());
});

app.post('/api/admin/synonyms', requireAdmin, (req: AdminRequest, res) => {
  const b = req.body ?? {};
  const canonical = String(b.canonical_term ?? '').trim();
  const synonyms = String(b.synonyms ?? '').trim();
  if (!canonical || !synonyms) {
    res.status(400).json({ error: '標準詞彙及同義詞列表均為必填。' });
    return;
  }
  const info = db
    .prepare('INSERT INTO search_synonyms (canonical_term, synonyms, category_slug, notes) VALUES (?, ?, ?, ?)')
    .run(canonical, synonyms, String(b.category_slug ?? '').trim(), String(b.notes ?? '').trim());
  const id = Number(info.lastInsertRowid);
  logAudit('CREATE', 'synonym', id, `新增搜尋同義詞組：${canonical}`, req.adminUser?.username);
  res.status(201).json(db.prepare('SELECT * FROM search_synonyms WHERE id = ?').get(id));
});

app.put('/api/admin/synonyms/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  db.prepare(
    'UPDATE search_synonyms SET canonical_term = ?, synonyms = ?, category_slug = ?, notes = ? WHERE id = ?'
  ).run(
    String(b.canonical_term ?? '').trim(),
    String(b.synonyms ?? '').trim(),
    String(b.category_slug ?? '').trim(),
    String(b.notes ?? '').trim(),
    id
  );
  logAudit('UPDATE', 'synonym', id, `更新搜尋同義詞組：${b.canonical_term}`, req.adminUser?.username);
  res.json(db.prepare('SELECT * FROM search_synonyms WHERE id = ?').get(id));
});

app.delete('/api/admin/synonyms/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM search_synonyms WHERE id = ?').run(id);
  logAudit('DELETE', 'synonym', id, `刪除搜尋同義詞組 #${id}`, req.adminUser?.username);
  res.json({ ok: true });
});

// Data Sources CRUD
app.post('/api/admin/sources', requireAdmin, (req: AdminRequest, res) => {
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim();
  if (!name) {
    res.status(400).json({ error: '資料來源名稱為必填。' });
    return;
  }
  try {
    const info = db
      .prepare('INSERT INTO data_sources (name, url, authority_type, description, last_checked_date) VALUES (?, ?, ?, ?, ?)')
      .run(
        name,
        sanitizeUrl(b.url),
        String(b.authority_type ?? '官方來源').trim(),
        String(b.description ?? '').trim(),
        String(b.last_checked_date ?? new Date().toISOString().slice(0, 10)).trim()
      );
    const id = Number(info.lastInsertRowid);
    logAudit('CREATE', 'data_source', id, `新增官方資料來源：${name}`, req.adminUser?.username);
    res.status(201).json(db.prepare('SELECT * FROM data_sources WHERE id = ?').get(id));
  } catch {
    res.status(400).json({ error: '來源名稱可能已存在。' });
  }
});

app.delete('/api/admin/sources/:id', requireAdmin, (req: AdminRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM data_sources WHERE id = ?').run(id);
  logAudit('DELETE', 'data_source', id, `刪除資料來源 #${id}`, req.adminUser?.username);
  res.json({ ok: true });
});

// Duplicates & Audit Logs
app.get('/api/admin/duplicates', requireAdmin, (_req, res) => {
  res.json(findDuplicateUnits());
});

app.get('/api/admin/audit-logs', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 120').all();
  res.json(rows);
});

// ============================================================
// CSV / EXCEL (.xlsx) IMPORT & EXPORT
// ============================================================

const EXPORT_HEADERS = [
  'unit_name_zh',
  'unit_name_pt',
  'unit_name_en',
  'org_name_zh',
  'org_name_pt',
  'org_name_en',
  'org_type',
  'category_slug',
  'sub_category',
  'target_audience',
  'service_details',
  'eligibility',
  'application_procedure',
  'required_documents',
  'address',
  'parish',
  'region',
  'phone',
  'fax',
  'email',
  'website',
  'opening_hours',
  'fees',
  'requires_appointment',
  'accepts_referral',
  'requires_assessment',
  'provides_residential',
  'provides_daycare',
  'is_barrier_free',
  'latitude',
  'longitude',
  'source_name',
  'source_url',
  'collected_date',
  'last_verified_date',
  'verification_status',
  'notes',
];

function mapImportedRow(row: Record<string, unknown>, categoriesByKey: Map<string, number>) {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        return String(row[k]).trim();
      }
    }
    return '';
  };

  const unit_name_zh = pick('unit_name_zh', '服務單位名稱', '單位名稱', 'name');
  const org_name_zh = pick('org_name_zh', '機構中文名稱', '所屬機構', '機構名稱') || '待核實';
  const catRaw = pick('category_slug', '服務類別', '分類', 'category');
  const category_id = categoriesByKey.get(catRaw.toLowerCase()) ?? categoriesByKey.get('public-legal-other') ?? 1;

  const coords = validateMacauCoords(
    parseNullableNumber(pick('latitude', '緯度', 'lat')),
    parseNullableNumber(pick('longitude', '經度', 'lng'))
  );

  const statusRaw = pick('verification_status', '資料核實狀態', '核實狀態');
  let verification_status: 'verified' | 'pending' | 'needs_update' | 'inactive' = 'pending';
  if (statusRaw === 'verified' || statusRaw === '已核實') verification_status = 'verified';
  else if (statusRaw === 'needs_update' || statusRaw === '需要更新') verification_status = 'needs_update';
  else if (statusRaw === 'inactive' || statusRaw === '已停止服務') verification_status = 'inactive';

  const today = new Date().toISOString().slice(0, 10);

  return {
    unit_name_zh,
    unit_name_pt: pick('unit_name_pt', '服務單位葡文名稱'),
    unit_name_en: pick('unit_name_en', '服務單位英文名稱'),
    org_name_zh,
    org_name_pt: pick('org_name_pt', '機構葡文名稱'),
    org_name_en: pick('org_name_en', '機構英文名稱'),
    org_type: pick('org_type', '機構性質') || '民間非牟利社會服務團體',
    category_id,
    category_label: catRaw || '其他公共及社會支援',
    sub_category: pick('sub_category', '細分類別'),
    target_audience: pick('target_audience', '服務對象') || '待核實',
    service_details: pick('service_details', '詳細服務內容', '服務內容') || '待核實',
    eligibility: pick('eligibility', '申請資格') || '待核實',
    application_procedure: pick('application_procedure', '申請程序') || '待核實',
    required_documents: pick('required_documents', '所需文件') || '待核實',
    address: pick('address', '地址') || '待核實',
    parish: pick('parish', '所屬堂區', '堂區') || '待核實',
    region: pick('region', '所屬區域', '區域') || '澳門半島',
    phone: pick('phone', '電話') || '待核實',
    fax: pick('fax', '傳真') || '待核實',
    email: pick('email', '電郵') || '待核實',
    website: sanitizeUrl(pick('website', '官方網站', '網站')),
    opening_hours: pick('opening_hours', '開放時間') || '待核實',
    fees: pick('fees', '服務收費', '收費') || '待核實',
    requires_appointment: parseTriState(pick('requires_appointment', '是否需要預約')),
    accepts_referral: parseTriState(pick('accepts_referral', '是否接受轉介')),
    requires_assessment: parseTriState(pick('requires_assessment', '是否需要評估')),
    provides_residential: parseTriState(pick('provides_residential', '是否提供住宿')),
    provides_daycare: parseTriState(pick('provides_daycare', '是否提供日間服務')),
    is_barrier_free: parseTriState(pick('is_barrier_free', '是否有無障礙設施')),
    latitude: coords.lat,
    longitude: coords.lng,
    source_name: pick('source_name', '官方資料來源', '資料來源') || '批量匯入（待核實來源）',
    source_url: sanitizeUrl(pick('source_url', '原始網址')),
    collected_date: pick('collected_date', '收集日期') || today,
    last_verified_date: verification_status === 'verified' ? pick('last_verified_date', '最後核實日期') || today : '',
    verification_status,
    notes: pick('notes', '備註'),
  };
}

function getCategoryLookupMap(): Map<string, number> {
  const rows = db.prepare('SELECT id, slug, name_zh, name_pt, name_en FROM categories').all() as Array<{
    id: number;
    slug: string;
    name_zh: string;
    name_pt: string;
    name_en: string;
  }>;
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.slug.toLowerCase(), r.id);
    map.set(r.name_zh.toLowerCase(), r.id);
    map.set(r.name_pt.toLowerCase(), r.id);
    map.set(r.name_en.toLowerCase(), r.id);
  }
  return map;
}

function parseCsvBuffer(buffer: Buffer): Array<Record<string, unknown>> {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      row.push(field);
      matrix.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      matrix.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    matrix.push(row);
  }

  const nonEmpty = matrix.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmpty.length < 2) return [];
  const headers = nonEmpty[0].map((h) => h.trim());
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const obj: Record<string, unknown> = Object.create(null);
    headers.forEach((h, idx) => {
      if (h && h !== '__proto__' && h !== 'constructor' && h !== 'prototype') {
        obj[h] = nonEmpty[i][idx] ?? '';
      }
    });
    rows.push(obj);
  }
  return rows;
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    const v = val as Record<string, unknown>;
    if (Array.isArray(v.richText)) {
      return v.richText.map((part) => String((part as Record<string, unknown>).text ?? '')).join('');
    }
    if (typeof v.text === 'string') return v.text;
    if (typeof v.hyperlink === 'string') return v.hyperlink;
    if (v.result !== undefined) return String(v.result);
    if (val instanceof Date) return val.toISOString().slice(0, 10);
  }
  return String(val);
}

async function parseUploadedSpreadsheet(file: Express.Multer.File): Promise<Array<Record<string, unknown>>> {
  const lowerName = file.originalname.toLowerCase();
  if (lowerName.endsWith('.csv') || file.mimetype === 'text/csv') {
    return parseCsvBuffer(file.buffer);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = formatCellValue(cell.value).trim();
  });

  const rows: Array<Record<string, unknown>> = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj: Record<string, unknown> = Object.create(null);
    let hasAnyValue = false;
    for (let c = 1; c < headers.length; c++) {
      const h = headers[c];
      if (!h || h === '__proto__' || h === 'constructor' || h === 'prototype') continue;
      const val = formatCellValue(row.getCell(c).value).trim();
      if (val) hasAnyValue = true;
      obj[h] = val;
    }
    if (hasAnyValue) rows.push(obj);
  }
  return rows;
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  // Neutralize spreadsheet formula injection when opened in Excel
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

app.post('/api/admin/import/preview', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '請上傳 CSV 或 Excel（.xlsx）檔案。' });
      return;
    }
    const rawRows = await parseUploadedSpreadsheet(req.file);
    if (rawRows.length === 0) {
      res.status(400).json({ error: '檔案內沒有可匯入的資料列。' });
      return;
    }

    const catMap = getCategoryLookupMap();
    const existingNames = new Set(
      (db.prepare('SELECT unit_name_zh FROM service_units').all() as Array<{ unit_name_zh: string }>).map((u) =>
        u.unit_name_zh.replace(/\s+/g, '').toLowerCase()
      )
    );

    const parsed = rawRows.slice(0, 500).map((row, idx) => {
      const mapped = mapImportedRow(row, catMap);
      const normName = mapped.unit_name_zh.replace(/\s+/g, '').toLowerCase();
      const isDuplicate = normName.length > 0 && existingNames.has(normName);
      const error = !mapped.unit_name_zh ? '缺少「服務單位名稱 (unit_name_zh)」' : null;
      return {
        row_index: idx + 2,
        ...mapped,
        is_duplicate: isDuplicate,
        error,
      };
    });

    res.json({
      filename: req.file.originalname,
      total_rows: parsed.length,
      valid_rows: parsed.filter((r) => !r.error).length,
      duplicate_rows: parsed.filter((r) => r.is_duplicate).length,
      rows: parsed,
    });
  } catch (err) {
    console.error('Import preview error:', err);
    res.status(400).json({ error: '無法解析檔案，請確認為有效的 CSV 或 Excel (.xlsx) 格式。' });
  }
});

app.post('/api/admin/import/commit', requireAdmin, (req: AdminRequest, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const skipDuplicates = req.body?.skip_duplicates !== false;
    if (rows.length === 0) {
      res.status(400).json({ error: '沒有可匯入的資料列。' });
      return;
    }

    const existingNames = new Set(
      (db.prepare('SELECT unit_name_zh FROM service_units').all() as Array<{ unit_name_zh: string }>).map((u) =>
        u.unit_name_zh.replace(/\s+/g, '').toLowerCase()
      )
    );

    const insertStmt = db.prepare(`
      INSERT INTO service_units (
        org_name_zh, org_name_pt, org_name_en, org_type,
        unit_name_zh, unit_name_pt, unit_name_en,
        category_id, sub_category, target_audience, service_details,
        eligibility, application_procedure, required_documents,
        address, parish, region, phone, fax, email, website, opening_hours, fees,
        requires_appointment, accepts_referral, requires_assessment,
        provides_residential, provides_daycare, is_barrier_free,
        latitude, longitude,
        source_name, source_url, collected_date, last_verified_date,
        verification_status, needs_update, notes
      ) VALUES (
        @org_name_zh, @org_name_pt, @org_name_en, @org_type,
        @unit_name_zh, @unit_name_pt, @unit_name_en,
        @category_id, @sub_category, @target_audience, @service_details,
        @eligibility, @application_procedure, @required_documents,
        @address, @parish, @region, @phone, @fax, @email, @website, @opening_hours, @fees,
        @requires_appointment, @accepts_referral, @requires_assessment,
        @provides_residential, @provides_daycare, @is_barrier_free,
        @latitude, @longitude,
        @source_name, @source_url, @collected_date, @last_verified_date,
        @verification_status, @needs_update, @notes
      )
    `);

    let inserted = 0;
    let skipped = 0;
    const tx = db.transaction(() => {
      for (const r of rows) {
        const name = String(r.unit_name_zh ?? '').trim();
        if (!name) {
          skipped++;
          continue;
        }
        const norm = name.replace(/\s+/g, '').toLowerCase();
        if (skipDuplicates && existingNames.has(norm)) {
          skipped++;
          continue;
        }
        const coords = validateMacauCoords(parseNullableNumber(r.latitude), parseNullableNumber(r.longitude));
        const status = ['verified', 'pending', 'needs_update', 'inactive'].includes(r.verification_status)
          ? r.verification_status
          : 'pending';
        insertStmt.run({
          org_name_zh: String(r.org_name_zh ?? '待核實').trim() || '待核實',
          org_name_pt: String(r.org_name_pt ?? '').trim(),
          org_name_en: String(r.org_name_en ?? '').trim(),
          org_type: String(r.org_type ?? '民間非牟利社會服務團體').trim(),
          unit_name_zh: name,
          unit_name_pt: String(r.unit_name_pt ?? '').trim(),
          unit_name_en: String(r.unit_name_en ?? '').trim(),
          category_id: Number(r.category_id) || 12,
          sub_category: String(r.sub_category ?? '').trim(),
          target_audience: String(r.target_audience ?? '待核實').trim() || '待核實',
          service_details: String(r.service_details ?? '待核實').trim() || '待核實',
          eligibility: String(r.eligibility ?? '待核實').trim() || '待核實',
          application_procedure: String(r.application_procedure ?? '待核實').trim() || '待核實',
          required_documents: String(r.required_documents ?? '待核實').trim() || '待核實',
          address: String(r.address ?? '待核實').trim() || '待核實',
          parish: String(r.parish ?? '待核實').trim() || '待核實',
          region: String(r.region ?? '澳門半島').trim(),
          phone: String(r.phone ?? '待核實').trim() || '待核實',
          fax: String(r.fax ?? '待核實').trim() || '待核實',
          email: String(r.email ?? '待核實').trim() || '待核實',
          website: sanitizeUrl(r.website),
          opening_hours: String(r.opening_hours ?? '待核實').trim() || '待核實',
          fees: String(r.fees ?? '待核實').trim() || '待核實',
          requires_appointment: parseTriState(r.requires_appointment),
          accepts_referral: parseTriState(r.accepts_referral),
          requires_assessment: parseTriState(r.requires_assessment),
          provides_residential: parseTriState(r.provides_residential),
          provides_daycare: parseTriState(r.provides_daycare),
          is_barrier_free: parseTriState(r.is_barrier_free),
          latitude: coords.lat,
          longitude: coords.lng,
          source_name: String(r.source_name ?? '批量匯入').trim(),
          source_url: sanitizeUrl(r.source_url),
          collected_date: String(r.collected_date ?? new Date().toISOString().slice(0, 10)).trim(),
          last_verified_date: String(r.last_verified_date ?? '').trim(),
          verification_status: status,
          needs_update: status === 'needs_update' ? 1 : 0,
          notes: String(r.notes ?? '').trim(),
        });
        existingNames.add(norm);
        inserted++;
      }
    });

    tx();
    logAudit('BULK_IMPORT', 'service_unit', null, `批量匯入完成：成功寫入 ${inserted} 筆，略過 ${skipped} 筆`, req.adminUser?.username);
    res.json({ ok: true, inserted, skipped });
  } catch (err) {
    console.error('Import commit error:', err);
    res.status(500).json({ error: '批量匯入寫入資料庫失敗。' });
  }
});

app.get('/api/admin/export', requireAdmin, async (req: AdminRequest, res) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    const units = getAllUnitsWithCategory(true);

    logAudit('EXPORT', 'service_unit', null, `匯出全澳服務資料庫（${units.length} 筆，格式：${format.toUpperCase()}）`, req.adminUser?.username);

    if (format === 'csv') {
      const lines = [
        EXPORT_HEADERS.map(escapeCsvCell).join(','),
        ...units.map((u) =>
          EXPORT_HEADERS.map((h) => escapeCsvCell((u as unknown as Record<string, unknown>)[h] ?? '')).join(',')
        ),
      ];
      const csv = '\uFEFF' + lines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="macau_social_services.csv"');
      res.send(csv);
    } else {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('MacauSocialServices');
      ws.columns = EXPORT_HEADERS.map((h) => ({ header: h, key: h, width: 22 }));
      for (const u of units) {
        const rec = u as unknown as Record<string, unknown>;
        const rowObj: Record<string, unknown> = {};
        for (const h of EXPORT_HEADERS) {
          rowObj[h] = rec[h] ?? '';
        }
        ws.addRow(rowObj);
      }
      const buf = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="macau_social_services.xlsx"');
      res.send(Buffer.from(buf));
    }
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: '匯出檔案失敗。' });
  }
});

app.get('/api/admin/template', requireAdmin, async (_req, res) => {
  try {
    const sample: Record<string, unknown> = {
      unit_name_zh: '範例：某某社區長者中心（匯入前請刪除此示範列）',
      unit_name_pt: '',
      unit_name_en: '',
      org_name_zh: '所屬主辦機構名稱',
      org_name_pt: '',
      org_name_en: '',
      org_type: '社工局受資助服務機構',
      category_slug: 'elderly',
      sub_category: '長者中心',
      target_audience: '60歲或以上澳門居民',
      service_details: '請填寫可核實之官方服務內容',
      eligibility: '待核實',
      application_procedure: '待核實',
      required_documents: '澳門居民身份證',
      address: '澳門某街道門牌（請填寫真實地址）',
      parish: '花地瑪堂區',
      region: '澳門半島',
      phone: '待核實',
      fax: '待核實',
      email: '待核實',
      website: 'https://www.ias.gov.mo/',
      opening_hours: '待核實',
      fees: '待核實',
      requires_appointment: -1,
      accepts_referral: 1,
      requires_assessment: -1,
      provides_residential: 0,
      provides_daycare: 1,
      is_barrier_free: 1,
      latitude: '',
      longitude: '',
      source_name: '澳門社會工作局（IAS）',
      source_url: 'https://www.ias.gov.mo/',
      collected_date: new Date().toISOString().slice(0, 10),
      last_verified_date: '',
      verification_status: 'pending',
      notes: '布林欄位可填 1（是）、0（否）或 -1（待核實）',
    };
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('ImportTemplate');
    ws.columns = EXPORT_HEADERS.map((h) => ({ header: h, key: h, width: 22 }));
    ws.addRow(sample);
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="macau_services_import_template.xlsx"');
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error('Template generation error:', err);
    res.status(500).json({ error: '產生範本失敗。' });
  }
});

// ============================================================
// FRONTEND SERVING (Vite dev middleware OR production dist)
// ============================================================

async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Macau Social Services Hub server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
