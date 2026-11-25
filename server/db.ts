import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  SEED_CATEGORIES,
  SEED_DATA_SOURCES,
  SEED_ORGANIZATIONS,
  SEED_SERVICE_UNITS,
  SEED_SYNONYMS,
} from './seedData.ts';
import type { DashboardStats, DuplicateGroup, ServiceUnit } from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'macau_social_services.sqlite');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name_zh TEXT NOT NULL,
      name_pt TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT '',
      description_zh TEXT NOT NULL DEFAULT '',
      description_pt TEXT NOT NULL DEFAULT '',
      description_en TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'HeartHandshake',
      color TEXT NOT NULL DEFAULT '#0F4C81',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_zh TEXT NOT NULL UNIQUE,
      name_pt TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT '',
      org_type TEXT NOT NULL DEFAULT '民間非牟利社會服務團體',
      website TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL DEFAULT '',
      authority_type TEXT NOT NULL DEFAULT '官方來源',
      description TEXT NOT NULL DEFAULT '',
      last_checked_date TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS service_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
      org_name_zh TEXT NOT NULL DEFAULT '',
      org_name_pt TEXT NOT NULL DEFAULT '',
      org_name_en TEXT NOT NULL DEFAULT '',
      org_type TEXT NOT NULL DEFAULT '民間非牟利社會服務團體',
      unit_name_zh TEXT NOT NULL,
      unit_name_pt TEXT NOT NULL DEFAULT '',
      unit_name_en TEXT NOT NULL DEFAULT '',
      category_id INTEGER NOT NULL REFERENCES categories(id),
      sub_category TEXT NOT NULL DEFAULT '',
      target_audience TEXT NOT NULL DEFAULT '待核實',
      service_details TEXT NOT NULL DEFAULT '待核實',
      eligibility TEXT NOT NULL DEFAULT '待核實',
      application_procedure TEXT NOT NULL DEFAULT '待核實',
      required_documents TEXT NOT NULL DEFAULT '待核實',
      address TEXT NOT NULL DEFAULT '待核實',
      parish TEXT NOT NULL DEFAULT '待核實',
      region TEXT NOT NULL DEFAULT '澳門半島',
      phone TEXT NOT NULL DEFAULT '待核實',
      fax TEXT NOT NULL DEFAULT '待核實',
      email TEXT NOT NULL DEFAULT '待核實',
      website TEXT NOT NULL DEFAULT '',
      opening_hours TEXT NOT NULL DEFAULT '待核實',
      fees TEXT NOT NULL DEFAULT '待核實',
      requires_appointment INTEGER NOT NULL DEFAULT -1,
      accepts_referral INTEGER NOT NULL DEFAULT -1,
      requires_assessment INTEGER NOT NULL DEFAULT -1,
      provides_residential INTEGER NOT NULL DEFAULT -1,
      provides_daycare INTEGER NOT NULL DEFAULT -1,
      is_barrier_free INTEGER NOT NULL DEFAULT -1,
      latitude REAL,
      longitude REAL,
      data_source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
      source_name TEXT NOT NULL DEFAULT '待核實',
      source_url TEXT NOT NULL DEFAULT '',
      collected_date TEXT NOT NULL DEFAULT '',
      last_verified_date TEXT NOT NULL DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'pending',
      needs_update INTEGER NOT NULL DEFAULT 0,
      is_medical_service INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_units_category ON service_units(category_id);
    CREATE INDEX IF NOT EXISTS idx_units_region ON service_units(region);
    CREATE INDEX IF NOT EXISTS idx_units_parish ON service_units(parish);
    CREATE INDEX IF NOT EXISTS idx_units_status ON service_units(verification_status);

    CREATE TABLE IF NOT EXISTS search_synonyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_term TEXT NOT NULL,
      synonyms TEXT NOT NULL,
      category_slug TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      summary TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const categoryCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (categoryCount === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const insertCat = db.prepare(`
    INSERT INTO categories (slug, name_zh, name_pt, name_en, description_zh, description_pt, description_en, icon, color, sort_order)
    VALUES (@slug, @name_zh, @name_pt, @name_en, @description_zh, @description_pt, @description_en, @icon, @color, @sort_order)
  `);

  const insertOrg = db.prepare(`
    INSERT INTO organizations (name_zh, name_pt, name_en, org_type, website, phone, notes)
    VALUES (@name_zh, @name_pt, @name_en, @org_type, @website, @phone, @notes)
  `);

  const insertSource = db.prepare(`
    INSERT INTO data_sources (name, url, authority_type, description, last_checked_date)
    VALUES (@name, @url, @authority_type, @description, @last_checked_date)
  `);

  const insertSynonym = db.prepare(`
    INSERT INTO search_synonyms (canonical_term, synonyms, category_slug, notes)
    VALUES (@canonical_term, @synonyms, @category_slug, @notes)
  `);

  const insertUnit = db.prepare(`
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
  `);

  const seedTx = db.transaction(() => {
    const catMap = new Map<string, number>();
    for (const c of SEED_CATEGORIES) {
      const info = insertCat.run(c);
      catMap.set(c.slug, Number(info.lastInsertRowid));
    }

    const orgMap = new Map<string, { id: number; data: (typeof SEED_ORGANIZATIONS)[number] }>();
    for (const o of SEED_ORGANIZATIONS) {
      const info = insertOrg.run(o);
      orgMap.set(o.key, { id: Number(info.lastInsertRowid), data: o });
    }

    const sourceMap = new Map<string, { id: number; name: string }>();
    for (const s of SEED_DATA_SOURCES) {
      const info = insertSource.run(s);
      sourceMap.set(s.key, { id: Number(info.lastInsertRowid), name: s.name });
    }

    for (const syn of SEED_SYNONYMS) {
      insertSynonym.run(syn);
    }

    for (const u of SEED_SERVICE_UNITS) {
      const org = orgMap.get(u.org_key);
      const catId = catMap.get(u.category_slug);
      const src = sourceMap.get(u.source_key);
      if (!org || !catId || !src) continue;
      insertUnit.run({
        organization_id: org.id,
        org_name_zh: org.data.name_zh,
        org_name_pt: org.data.name_pt,
        org_name_en: org.data.name_en,
        org_type: org.data.org_type,
        unit_name_zh: u.unit_name_zh,
        unit_name_pt: u.unit_name_pt,
        unit_name_en: u.unit_name_en,
        category_id: catId,
        sub_category: u.sub_category,
        target_audience: u.target_audience,
        service_details: u.service_details,
        eligibility: u.eligibility,
        application_procedure: u.application_procedure,
        required_documents: u.required_documents,
        address: u.address,
        parish: u.parish,
        region: u.region,
        phone: u.phone,
        fax: u.fax,
        email: u.email,
        website: u.website,
        opening_hours: u.opening_hours,
        fees: u.fees,
        requires_appointment: u.requires_appointment,
        accepts_referral: u.accepts_referral,
        requires_assessment: u.requires_assessment,
        provides_residential: u.provides_residential,
        provides_daycare: u.provides_daycare,
        is_barrier_free: u.is_barrier_free,
        latitude: u.latitude,
        longitude: u.longitude,
        data_source_id: src.id,
        source_name: src.name,
        source_url: u.source_url,
        collected_date: u.collected_date,
        last_verified_date: u.last_verified_date,
        verification_status: u.verification_status,
        needs_update: u.needs_update,
        is_medical_service: u.is_medical_service,
        notes: u.notes,
      });
    }

    db.prepare(
      `INSERT INTO audit_logs (action, entity_type, entity_id, summary, actor) VALUES (?, ?, ?, ?, ?)`
    ).run(
      'SEED',
      'system',
      null,
      `初始化澳門社會服務資料庫：匯入 ${SEED_CATEGORIES.length} 大分類、${SEED_ORGANIZATIONS.length} 個主辦機構及 ${SEED_SERVICE_UNITS.length} 個公開核實服務單位。`,
      'system'
    );
  });

  seedTx();
}

export function logAudit(
  action: string,
  entityType: string,
  entityId: number | null,
  summary: string,
  actor = 'admin'
) {
  try {
    db.prepare(
      `INSERT INTO audit_logs (action, entity_type, entity_id, summary, actor) VALUES (?, ?, ?, ?, ?)`
    ).run(action, entityType, entityId, summary, actor);
  } catch (err) {
    console.error('Audit log insert failed:', err);
  }
}

export function getAllUnitsWithCategory(includeInactive = false): ServiceUnit[] {
  const sql = `
    SELECT
      u.*,
      c.slug as category_slug,
      c.name_zh as category_name_zh,
      c.name_pt as category_name_pt,
      c.name_en as category_name_en
    FROM service_units u
    LEFT JOIN categories c ON c.id = u.category_id
    ${includeInactive ? '' : "WHERE u.verification_status != 'inactive'"}
    ORDER BY
      CASE u.verification_status
        WHEN 'verified' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'needs_update' THEN 3
        ELSE 4
      END,
      u.id ASC
  `;
  return db.prepare(sql).all() as ServiceUnit[];
}

export function getUnitById(id: number): ServiceUnit | undefined {
  return db
    .prepare(
      `
      SELECT
        u.*,
        c.slug as category_slug,
        c.name_zh as category_name_zh,
        c.name_pt as category_name_pt,
        c.name_en as category_name_en
      FROM service_units u
      LEFT JOIN categories c ON c.id = u.category_id
      WHERE u.id = ?
    `
    )
    .get(id) as ServiceUnit | undefined;
}

export function getDynamicStats(): DashboardStats {
  const total_units = (db.prepare('SELECT COUNT(*) as c FROM service_units').get() as { c: number }).c;
  const active_units = (
    db.prepare("SELECT COUNT(*) as c FROM service_units WHERE verification_status != 'inactive'").get() as { c: number }
  ).c;
  const verified_units = (
    db.prepare("SELECT COUNT(*) as c FROM service_units WHERE verification_status = 'verified'").get() as { c: number }
  ).c;
  const pending_units = (
    db.prepare("SELECT COUNT(*) as c FROM service_units WHERE verification_status = 'pending'").get() as { c: number }
  ).c;
  const needs_update_units = (
    db
      .prepare("SELECT COUNT(*) as c FROM service_units WHERE verification_status = 'needs_update' OR needs_update = 1")
      .get() as { c: number }
  ).c;
  const inactive_units = (
    db.prepare("SELECT COUNT(*) as c FROM service_units WHERE verification_status = 'inactive'").get() as { c: number }
  ).c;
  const mapped_units = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM service_units WHERE verification_status != 'inactive' AND latitude IS NOT NULL AND longitude IS NOT NULL"
      )
      .get() as { c: number }
  ).c;
  const total_organizations = (db.prepare('SELECT COUNT(*) as c FROM organizations').get() as { c: number }).c;
  const total_sources = (db.prepare('SELECT COUNT(*) as c FROM data_sources').get() as { c: number }).c;

  const byCategoryRows = db
    .prepare(
      `
      SELECT
        c.id, c.slug, c.name_zh, c.name_pt, c.name_en,
        COUNT(CASE WHEN u.verification_status != 'inactive' THEN u.id END) as count
      FROM categories c
      LEFT JOIN service_units u ON u.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `
    )
    .all() as DashboardStats['by_category'];

  const countBySlug = new Map(byCategoryRows.map((r) => [r.slug, r.count]));

  const regionRows = db
    .prepare(
      `
      SELECT region, COUNT(*) as count
      FROM service_units
      WHERE verification_status != 'inactive'
      GROUP BY region
    `
    )
    .all() as Array<{ region: string; count: number }>;

  const by_region: Record<string, number> = {
    澳門半島: 0,
    氹仔: 0,
    路環: 0,
  };
  for (const r of regionRows) {
    by_region[r.region] = r.count;
  }

  return {
    total_units,
    active_units,
    verified_units,
    pending_units,
    needs_update_units,
    inactive_units,
    elderly_units: countBySlug.get('elderly') ?? 0,
    rehab_units: countBySlug.get('rehab') ?? 0,
    children_units: countBySlug.get('children-youth') ?? 0,
    family_units: countBySlug.get('family-marriage') ?? 0,
    mapped_units,
    total_organizations,
    total_sources,
    by_region,
    by_category: byCategoryRows,
  };
}

export function findDuplicateUnits(): DuplicateGroup[] {
  const units = db
    .prepare(
      'SELECT id, unit_name_zh, org_name_zh, phone, address, verification_status FROM service_units ORDER BY id ASC'
    )
    .all() as Array<{
    id: number;
    unit_name_zh: string;
    org_name_zh: string;
    phone: string;
    address: string;
    verification_status: 'verified' | 'pending' | 'needs_update' | 'inactive';
  }>;

  const groups: DuplicateGroup[] = [];

  // Check duplicate normalized unit names
  const byName = new Map<string, typeof units>();
  for (const u of units) {
    const key = u.unit_name_zh.replace(/[\s（）()\-－]/g, '').toLowerCase();
    if (!key) continue;
    const arr = byName.get(key) ?? [];
    arr.push(u);
    byName.set(key, arr);
  }
  for (const [key, list] of byName.entries()) {
    if (list.length > 1) {
      groups.push({ reason: '服務單位名稱高度重複', key, units: list });
    }
  }

  // Check duplicate normalized phone numbers (8-digit Macau numbers, excluding shared hotline/待核實)
  const byPhone = new Map<string, typeof units>();
  for (const u of units) {
    if (!u.phone || u.phone.includes('待核實')) continue;
    const primaryPhone = u.phone.split('/')[0].replace(/\D/g, '');
    if (primaryPhone.length < 8) continue;
    // Skip central hotlines legitimately referenced by multiple units
    if (['28367878', '28261126', '28532850'].includes(primaryPhone)) continue;
    const arr = byPhone.get(primaryPhone) ?? [];
    arr.push(u);
    byPhone.set(primaryPhone, arr);
  }
  for (const [key, list] of byPhone.entries()) {
    if (list.length > 1) {
      groups.push({ reason: '相同主要聯絡電話', key, units: list });
    }
  }

  return groups;
}
