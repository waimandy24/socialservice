import {
  SEED_CATEGORIES,
  SEED_DATA_SOURCES,
  SEED_ORGANIZATIONS,
  SEED_SERVICE_UNITS,
  SEED_SYNONYMS,
} from '../../server/seedData';
import type {
  AIMatchResponse,
  Category,
  DashboardStats,
  DataSource,
  Locale,
  Organization,
  SearchResponse,
  SearchSynonym,
  ServiceUnit,
} from '../types';

// Static in-memory projection of the exact same verified seed dataset used by SQLite
// so GitHub Pages / static hosting works seamlessly without a Node.js backend.

const categories: Category[] = SEED_CATEGORIES.map((c, idx) => ({
  id: idx + 1,
  slug: c.slug,
  name_zh: c.name_zh,
  name_pt: c.name_pt,
  name_en: c.name_en,
  description_zh: c.description_zh,
  description_pt: c.description_pt,
  description_en: c.description_en,
  icon: c.icon,
  color: c.color,
  sort_order: c.sort_order,
}));

const catBySlug = new Map<string, Category>();
for (const c of categories) catBySlug.set(c.slug, c);

const organizations: Organization[] = SEED_ORGANIZATIONS.map((o, idx) => ({
  id: idx + 1,
  name_zh: o.name_zh,
  name_pt: o.name_pt,
  name_en: o.name_en,
  org_type: o.org_type,
  website: o.website,
  phone: o.phone,
  notes: o.notes,
  created_at: '2026-04-01',
  updated_at: '2026-04-01',
}));

const orgByKey = new Map<string, Organization>();
SEED_ORGANIZATIONS.forEach((o, idx) => orgByKey.set(o.key, organizations[idx]));

const sources: DataSource[] = SEED_DATA_SOURCES.map((s, idx) => ({
  id: idx + 1,
  name: s.name,
  url: s.url,
  authority_type: s.authority_type,
  description: s.description,
  last_checked_date: s.last_checked_date,
}));

const sourceByKey = new Map<string, DataSource>();
SEED_DATA_SOURCES.forEach((s, idx) => sourceByKey.set(s.key, sources[idx]));

const synonyms: SearchSynonym[] = SEED_SYNONYMS.map((s, idx) => ({
  id: idx + 1,
  canonical_term: s.canonical_term,
  synonyms: s.synonyms,
  category_slug: s.category_slug,
  notes: s.notes,
}));

const units: ServiceUnit[] = SEED_SERVICE_UNITS.map((u, idx) => {
  const cat = catBySlug.get(u.category_slug) ?? categories[categories.length - 1];
  const org = orgByKey.get(u.org_key);
  const src = sourceByKey.get(u.source_key);
  return {
    id: idx + 1,
    organization_id: org ? org.id : null,
    org_name_zh: org?.name_zh ?? '待核實',
    org_name_pt: org?.name_pt ?? '',
    org_name_en: org?.name_en ?? '',
    org_type: org?.org_type ?? '民間非牟利社會服務團體',
    unit_name_zh: u.unit_name_zh,
    unit_name_pt: u.unit_name_pt ?? '',
    unit_name_en: u.unit_name_en ?? '',
    category_id: cat.id,
    category_slug: cat.slug,
    category_name_zh: cat.name_zh,
    category_name_pt: cat.name_pt,
    category_name_en: cat.name_en,
    sub_category: u.sub_category ?? '',
    target_audience: u.target_audience,
    service_details: u.service_details,
    eligibility: u.eligibility,
    application_procedure: u.application_procedure,
    required_documents: u.required_documents,
    address: u.address,
    parish: u.parish,
    region: u.region,
    phone: u.phone,
    fax: u.fax ?? '待核實',
    email: u.email ?? '待核實',
    website: u.website ?? '',
    opening_hours: u.opening_hours,
    fees: u.fees,
    requires_appointment: u.requires_appointment ?? -1,
    accepts_referral: u.accepts_referral ?? -1,
    requires_assessment: u.requires_assessment ?? -1,
    provides_residential: u.provides_residential ?? -1,
    provides_daycare: u.provides_daycare ?? -1,
    is_barrier_free: u.is_barrier_free ?? -1,
    latitude: u.latitude ?? null,
    longitude: u.longitude ?? null,
    data_source_id: src ? src.id : null,
    source_name: src ? src.name : '官方公開資料',
    source_url: u.source_url,
    collected_date: u.collected_date,
    last_verified_date: u.last_verified_date,
    verification_status: u.verification_status,
    needs_update: u.needs_update,
    is_medical_service: u.is_medical_service ?? 0,
    notes: u.notes ?? '',
    created_at: u.collected_date,
    updated_at: u.last_verified_date || u.collected_date,
  };
});

// Simplified-to-Traditional character map for client-side search parity
const S2T_MAP: Record<string, string> = {
  长: '長',
  护: '護',
  养: '養',
  疗: '療',
  复: '復',
  残: '殘',
  儿: '兒',
  託: '托',
  妇: '婦',
  联: '聯',
  总: '總',
  会: '會',
  区: '區',
  门: '門',
  岛: '島',
  环: '環',
  湾: '灣',
  医: '醫',
  诊: '診',
  辅: '輔',
  导: '導',
  专: '專',
  业: '業',
  经: '經',
  济: '濟',
  困: '困',
  难: '難',
  紧: '緊',
  临: '臨',
  时: '時',
  无: '無',
  险: '險',
  赌: '賭',
  训: '訓',
  劳: '勞',
  义: '義',
  务: '務',
  咨: '諮',
  询: '詢',
  证: '證',
  书: '書',
  请: '請',
  评: '評',
  转: '轉',
  约: '約',
  预: '預',
  碍: '礙',
  闭: '閉',
  迟: '遲',
  缓: '緩',
  独: '獨',
  单: '單',
  亲: '親',
  离: '離',
  热: '熱',
  线: '線',
  电: '電',
  话: '話',
  网: '網',
  广: '廣',
  场: '場',
  马: '馬',
  楼: '樓',
  层: '層',
  号: '號',
  费: '費',
  钱: '錢',
  粮: '糧',
  饭: '飯',
  帮: '幫',
  寻: '尋',
  顾: '顧',
  动: '動',
  爱: '愛',
  团: '團',
  体: '體',
  机: '機',
  构: '構',
  郁: '鬱',
  虑: '慮',
  绪: '緒',
  压: '壓',
  杀: '殺',
  轻: '輕',
  优: '優',
  婴: '嬰',
  学: '學',
  厂: '廠',
  实: '實',
  习: '習',
  资: '資',
  确: '確',
  认: '認',
  旧: '舊',
};

function toTraditional(input: string): string {
  let out = '';
  for (const ch of input) {
    out += S2T_MAP[ch] ?? ch;
  }
  return out;
}

function normalizeQuery(input: string): string {
  return toTraditional(input)
    .toLowerCase()
    .replace(/[，。、！？!?；;：:（）()「」『』\[\]\/\\\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const REGION_HINTS: Array<{ keyword: string; region: string; parish?: string }> = [
  { keyword: '澳門半島', region: '澳門半島' },
  { keyword: '半島', region: '澳門半島' },
  { keyword: '氹仔', region: '氹仔', parish: '嘉模堂區' },
  { keyword: 'taipa', region: '氹仔', parish: '嘉模堂區' },
  { keyword: '路環', region: '路環', parish: '聖方濟各堂區' },
  { keyword: 'coloane', region: '路環', parish: '聖方濟各堂區' },
  { keyword: '石排灣', region: '路環', parish: '聖方濟各堂區' },
  { keyword: '黑沙環', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '青洲', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '筷子基', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '台山', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '祐漢', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '關閘', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '北區', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '下環', region: '澳門半島', parish: '風順堂區' },
  { keyword: '司打口', region: '澳門半島', parish: '風順堂區' },
  { keyword: '新口岸', region: '澳門半島', parish: '大堂區' },
  { keyword: '中區', region: '澳門半島', parish: '大堂區' },
  { keyword: '高士德', region: '澳門半島', parish: '望德堂區' },
  { keyword: '荷蘭園', region: '澳門半島', parish: '望德堂區' },
  { keyword: '塔石', region: '澳門半島', parish: '望德堂區' },
  { keyword: '三盞燈', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '沙梨頭', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '花地瑪堂區', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '聖安多尼堂區', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '大堂區', region: '澳門半島', parish: '大堂區' },
  { keyword: '望德堂區', region: '澳門半島', parish: '望德堂區' },
  { keyword: '風順堂區', region: '澳門半島', parish: '風順堂區' },
  { keyword: '嘉模堂區', region: '氹仔', parish: '嘉模堂區' },
  { keyword: '聖方濟各堂區', region: '路環', parish: '聖方濟各堂區' },
];

const MEDICAL_QUERY_TRIGGERS = [
  '心理醫生',
  '精神科',
  '精神科醫生',
  '睇醫生',
  '看醫生',
  '開藥',
  '食藥',
  '門診',
  '醫院',
  '仁伯爵',
  '山頂醫院',
  '鏡湖',
  '臨床心理',
  'psychiatrist',
  'hospital',
  'psiquiatra',
];

function extractBigrams(str: string): string[] {
  const clean = str.replace(/\s+/g, '');
  if (clean.length < 2) return clean ? [clean] : [];
  const res: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    res.push(clean.slice(i, i + 2));
  }
  return res;
}

export function staticGetStats(): DashboardStats {
  const active = units.filter((u) => u.verification_status !== 'inactive');
  const byRegion: Record<string, number> = { 澳門半島: 0, 氹仔: 0, 路環: 0 };
  for (const u of active) {
    if (byRegion[u.region] !== undefined) byRegion[u.region]++;
  }
  const byCategory = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name_zh: c.name_zh,
    name_pt: c.name_pt,
    name_en: c.name_en,
    count: active.filter((u) => u.category_id === c.id).length,
  }));
  return {
    total_units: units.length,
    active_units: active.length,
    verified_units: active.filter((u) => u.verification_status === 'verified').length,
    pending_units: active.filter((u) => u.verification_status === 'pending').length,
    needs_update_units: active.filter((u) => u.verification_status === 'needs_update' || u.needs_update === 1).length,
    inactive_units: units.filter((u) => u.verification_status === 'inactive').length,
    elderly_units: active.filter((u) => u.category_slug === 'elderly').length,
    rehab_units: active.filter((u) => u.category_slug === 'rehab').length,
    children_units: active.filter((u) => u.category_slug === 'children-youth').length,
    family_units: active.filter((u) => u.category_slug === 'family-marriage').length,
    mapped_units: active.filter((u) => u.latitude !== null && u.longitude !== null).length,
    total_organizations: organizations.length,
    total_sources: sources.length,
    by_region: byRegion,
    by_category: byCategory,
  };
}

export function staticGetCategories(): Category[] {
  return categories.map((c) => ({
    ...c,
    unit_count: units.filter((u) => u.verification_status !== 'inactive' && u.category_id === c.id).length,
  }));
}

export function staticGetSources(): DataSource[] {
  return sources.map((s) => ({
    ...s,
    unit_count: units.filter((u) => u.data_source_id === s.id).length,
  }));
}

export function staticGetOrganizations(): Organization[] {
  return organizations.map((o) => ({
    ...o,
    unit_count: units.filter((u) => u.organization_id === o.id).length,
  }));
}

export function staticGetServiceDetail(id: number): {
  unit: ServiceUnit;
  siblings: Array<{
    id: number;
    unit_name_zh: string;
    region: string;
    parish: string;
    phone: string;
    verification_status: ServiceUnit['verification_status'];
  }>;
} | null {
  const unit = units.find((u) => u.id === id);
  if (!unit) return null;
  const siblings = unit.organization_id
    ? units
        .filter((u) => u.organization_id === unit.organization_id && u.id !== unit.id && u.verification_status !== 'inactive')
        .map((u) => ({
          id: u.id,
          unit_name_zh: u.unit_name_zh,
          region: u.region,
          parish: u.parish,
          phone: u.phone,
          verification_status: u.verification_status,
        }))
    : [];
  return { unit, siblings };
}

export function staticGetMap(params: URLSearchParams) {
  const category = params.get('category') || 'all';
  const region = params.get('region') || 'all';
  const filtered = units.filter((u) => {
    if (u.verification_status === 'inactive') return false;
    if (category !== 'all' && u.category_slug !== category && String(u.category_id) !== category) return false;
    if (region !== 'all' && u.region !== region) return false;
    return true;
  });
  const mapped = filtered.filter((u) => u.latitude !== null && u.longitude !== null);
  const unmapped = filtered.filter((u) => u.latitude === null || u.longitude === null);
  return {
    total_matching: filtered.length,
    mapped_count: mapped.length,
    unmapped_count: unmapped.length,
    mapped,
    unmapped,
  };
}

export function staticSearchServices(params: URLSearchParams): SearchResponse {
  const rawQuery = (params.get('q') ?? '').trim();
  const normalizedQuery = normalizeQuery(rawQuery);
  const category = params.get('category') || 'all';
  const region = params.get('region') || 'all';
  const parish = params.get('parish') || 'all';
  const status = params.get('status') || 'all';
  const sort = params.get('sort') || 'relevance';
  const residential = params.get('residential') === '1';
  const daycare = params.get('daycare') === '1';
  const barrierFree = params.get('barrierFree') === '1' || params.get('barrier_free') === '1';
  const acceptsReferral = params.get('acceptsReferral') === '1' || params.get('accepts_referral') === '1';

  const medicalDistinctionNotice = MEDICAL_QUERY_TRIGGERS.some((kw) =>
    normalizedQuery.includes(normalizeQuery(kw))
  );

  let detectedRegion: string | null = null;
  let detectedParish: string | null = null;
  for (const h of REGION_HINTS) {
    if (normalizedQuery.includes(normalizeQuery(h.keyword))) {
      detectedRegion = h.region;
      if (h.parish) detectedParish = h.parish;
      break;
    }
  }

  const expandedTermsSet = new Set<string>();
  const matchedCategoriesSet = new Set<string>();

  if (normalizedQuery) {
    for (const row of synonyms) {
      const allSyns = [
        row.canonical_term,
        ...row.synonyms.split(',').map((s) => s.trim()).filter(Boolean),
      ];
      const normSyns = allSyns.map((s) => normalizeQuery(s));
      const matched = normSyns.some(
        (syn) => syn.length >= 2 && (normalizedQuery.includes(syn) || syn.includes(normalizedQuery))
      );
      if (matched) {
        for (const s of allSyns) expandedTermsSet.add(s);
        if (row.category_slug) matchedCategoriesSet.add(row.category_slug);
      }
    }
  }

  const rawTokens = normalizedQuery.split(' ').filter((t) => t.length >= 1);
  const searchTerms = Array.from(
    new Set([
      ...rawTokens,
      ...Array.from(expandedTermsSet).map((t) => normalizeQuery(t)),
    ])
  ).filter((t) => t.length >= 2);

  let filtered = units.filter((u) => {
    if (status === 'all') {
      if (u.verification_status === 'inactive') return false;
    } else if (u.verification_status !== status) {
      return false;
    }
    if (category && category !== 'all' && u.category_slug !== category && String(u.category_id) !== category) {
      return false;
    }
    if (region && region !== 'all' && u.region !== region) return false;
    if (parish && parish !== 'all' && u.parish !== parish) return false;
    if (residential && u.provides_residential !== 1) return false;
    if (daycare && u.provides_daycare !== 1) return false;
    if (barrierFree && u.is_barrier_free !== 1) return false;
    if (acceptsReferral && u.accepts_referral !== 1) return false;
    return true;
  });

  if (normalizedQuery) {
    const scored: Array<{ unit: ServiceUnit; score: number }> = [];
    const bigrams = extractBigrams(normalizedQuery);

    for (const u of filtered) {
      const titleField = normalizeQuery(`${u.unit_name_zh} ${u.unit_name_en} ${u.unit_name_pt}`);
      const orgField = normalizeQuery(`${u.org_name_zh} ${u.org_name_en} ${u.org_name_pt} ${u.org_type}`);
      const catField = normalizeQuery(
        `${u.category_name_zh ?? ''} ${u.category_name_en ?? ''} ${u.category_name_pt ?? ''} ${u.sub_category}`
      );
      const bodyField = normalizeQuery(
        `${u.target_audience} ${u.service_details} ${u.eligibility} ${u.application_procedure} ${u.address} ${u.parish} ${u.region} ${u.notes}`
      );
      const phoneField = u.phone.replace(/\s+/g, '').toLowerCase();

      let score = 0;
      if (phoneField.includes(normalizedQuery.replace(/\s+/g, ''))) score += 100;
      if (titleField.includes(normalizedQuery)) score += 60;
      if (orgField.includes(normalizedQuery)) score += 35;
      if (catField.includes(normalizedQuery)) score += 28;
      if (bodyField.includes(normalizedQuery)) score += 22;

      for (const term of searchTerms) {
        if (titleField.includes(term)) score += 22;
        if (catField.includes(term)) score += 15;
        if (orgField.includes(term)) score += 12;
        if (bodyField.includes(term)) score += 8;
      }

      if (u.category_slug && matchedCategoriesSet.has(u.category_slug)) {
        score += 18;
      }
      if (detectedRegion && u.region === detectedRegion) score += 10;
      if (detectedParish && u.parish === detectedParish) score += 12;

      // Fuzzy bigram fallback
      if (score === 0 && bigrams.length > 0) {
        const combined = `${titleField} ${orgField} ${catField} ${bodyField}`;
        let hits = 0;
        for (const bg of bigrams) {
          if (combined.includes(bg)) hits++;
        }
        if (hits >= Math.max(1, Math.floor(bigrams.length * 0.45))) {
          score += hits * 4;
        }
      }

      if (score > 0) {
        if (u.verification_status === 'verified') score += 3;
        scored.push({ unit: u, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.unit.id - b.unit.id);
    filtered = scored.map((s) => s.unit);
  }

  if (sort === 'verified' || sort === 'verified_first') {
    const rank = { verified: 0, pending: 1, needs_update: 2, inactive: 3 };
    filtered = [...filtered].sort((a, b) => rank[a.verification_status] - rank[b.verification_status] || a.id - b.id);
  } else if (sort === 'name' || sort === 'name_asc') {
    filtered = [...filtered].sort((a, b) => a.unit_name_zh.localeCompare(b.unit_name_zh, 'zh-Hant'));
  }

  return {
    query: rawQuery,
    normalized_query: normalizedQuery,
    expanded_terms: Array.from(expandedTermsSet).slice(0, 14),
    detected_region: detectedRegion,
    medical_distinction_notice: medicalDistinctionNotice,
    total: filtered.length,
    items: filtered,
  };
}

export function staticRunAIMatch(input: {
  query: string;
  region?: string;
  locale?: Locale;
}): AIMatchResponse {
  const qs = new URLSearchParams();
  qs.set('q', input.query);
  if (input.region && input.region !== 'all') qs.set('region', input.region);

  const searchRes = staticSearchServices(qs);
  let matches = searchRes.items.slice(0, 6);

  // If no direct hits, broaden to all units without region constraint
  if (matches.length === 0 && input.region && input.region !== 'all') {
    const broadQs = new URLSearchParams();
    broadQs.set('q', input.query);
    matches = staticSearchServices(broadQs).items.slice(0, 6);
  }

  const locale = input.locale ?? 'zh-MO';
  const medicalNotice = searchRes.medical_distinction_notice
    ? locale === 'en'
      ? 'Note: Psychiatric diagnosis or prescription medication is provided by the Health Bureau (Centro Hospitalar Conde de São Januário / Health Centres). Community social service units listed below provide psychological counselling, emotional support, and referral.'
      : locale === 'pt'
        ? 'Nota: Consultas médicas de psiquiatria e medicação são prestadas pelos Serviços de Saúde (CHCSJ / Centros de Saúde). As unidades abaixo oferecem aconselhamento psicológico, apoio emocional e encaminhamento.'
        : '溫馨提示：精神科診斷、開藥及醫療門診屬衛生局（仁伯爵綜合醫院精神科及各區衛生中心）醫療範疇；以下為您配對的是澳門社區層面的心理輔導、情緒支援及轉介服務單位。'
    : null;

  const summary =
    matches.length > 0
      ? locale === 'en'
        ? `Matched ${matches.length} verified public Macau social service units from the static encyclopedia based on your description${searchRes.detected_region ? ` (${searchRes.detected_region})` : ''}.`
        : locale === 'pt'
          ? `Foram encontradas ${matches.length} unidades oficiais e subvencionadas de serviços sociais de Macau correspondentes à sua descrição.`
          : `已根據您的情況，從本平台已核實的澳門公開社會服務資料庫中配對出 ${matches.length} 個相關服務單位${searchRes.detected_region ? `（已優先考慮「${searchRes.detected_region}」分區）` : ''}。目前正於 GitHub Pages 靜態模式運行，採用本地廣東話／簡繁體同義詞及分類規則進行配對。`
      : locale === 'en'
        ? 'No exact match was found in the current verified directory. Please contact the Social Welfare Bureau (IAS) inquiry line (2836 7878) or 24-hour counselling hotline (2826 1126).'
        : locale === 'pt'
          ? 'Não foi encontrada correspondência exata na base atual. Contacte a linha de informações do IAS (2836 7878) ou a linha 24h (2826 1126).'
          : '現時已核實資料庫中未找到完全對應此描述的單一服務單位，建議致電澳門社會工作局查詢熱線（2836 7878）或 24 小時輔導熱線（2826 1126）由社工協助轉介。';

  const serviceTypes = Array.from(
    new Set(matches.map((u) => u.category_name_zh || u.sub_category).filter(Boolean))
  );

  return {
    summary,
    recommended_service_types: serviceTypes.length > 0 ? serviceTypes : ['社會工作局綜合諮詢及轉介'],
    medical_vs_social_notice: medicalNotice,
    insufficient_data_notice:
      matches.length === 0
        ? '目前資料庫尚未收錄與此查詢完全對應的分點，建議直接向社會工作局（IAS）查詢最新名錄。'
        : null,
    general_steps: [
      '先致電相關服務單位查詢服務名額、最新開放時間及是否需要預約。',
      '準備澳門居民身份證及相關證明文件（如經濟狀況或評估報告，視乎個別服務要求）。',
      '如需跨部門或跨機構協調，可向所屬堂區的社會工作中心申請由社工跟進轉介。',
    ],
    recommendations: matches.map((u) => ({
      unit_id: u.id,
      reason: `屬於「${u.category_name_zh ?? ''}」（${u.region} · ${u.parish}），主要對象：${u.target_audience}。`,
      suggested_action:
        u.phone && u.phone !== '待核實'
          ? `建議致電 ${u.phone} 查詢名額與申請詳情（${u.application_procedure !== '待核實' ? u.application_procedure : '查詢時請說明基本情況'}）。`
          : '請查閱下方官方來源網站以確認最新預約及聯絡方式。',
      unit: u,
    })),
    ias_fallback: {
      name: '澳門特別行政區政府社會工作局（IAS）',
      hotline: '2836 7878',
      counseling_24h: '2826 1126',
      website: 'https://www.ias.gov.mo/',
    },
  };
}

export function staticExportCsvContent(): string {
  const headers = [
    'unit_name_zh',
    'org_name_zh',
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
    'opening_hours',
    'fees',
    'latitude',
    'longitude',
    'source_name',
    'source_url',
    'verification_status',
  ];
  const esc = (v: unknown) => {
    const raw = String(v ?? '');
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [
    headers.map(esc).join(','),
    ...units.map((u) =>
      headers.map((h) => esc((u as unknown as Record<string, unknown>)[h] ?? '')).join(',')
    ),
  ];
  return '\uFEFF' + lines.join('\r\n');
}
