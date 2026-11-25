import { db, getAllUnitsWithCategory } from './db.ts';
import type { SearchResponse, SearchSynonym, ServiceUnit } from '../src/types.ts';

// Comprehensive Simplified-to-Traditional character map focused on Macau social services & everyday citizen vocabulary
const S2T_MAP: Record<string, string> = {
  长: '長',
  老: '老',
  护: '護',
  养: '養',
  疗: '療',
  复: '復',
  残: '殘',
  儿: '兒',
  童: '童',
  托: '托',
  託: '托',
  妇: '婦',
  联: '聯',
  总: '總',
  会: '會',
  社: '社',
  区: '區',
  门: '門',
  澳: '澳',
  岛: '島',
  氹: '氹',
  环: '環',
  湾: '灣',
  沙: '沙',
  黑: '黑',
  青: '青',
  洲: '洲',
  台: '台',
  山: '山',
  医: '醫',
  生: '生',
  诊: '診',
  辅: '輔',
  导: '導',
  专: '專',
  业: '業',
  经: '經',
  济: '濟',
  困: '困',
  难: '難',
  补: '補',
  助: '助',
  紧: '緊',
  急: '急',
  临: '臨',
  时: '時',
  住: '住',
  宿: '宿',
  无: '無',
  家: '家',
  露: '露',
  庇: '庇',
  避: '避',
  险: '險',
  赌: '賭',
  毒: '毒',
  戒: '戒',
  重: '重',
  返: '返',
  就: '就',
  职: '職',
  培: '培',
  训: '訓',
  劳: '勞',
  义: '義',
  务: '務',
  法: '法',
  咨: '諮',
  询: '詢',
  证: '證',
  书: '書',
  申: '申',
  请: '請',
  评: '評',
  估: '估',
  转: '轉',
  介: '介',
  约: '約',
  预: '預',
  障: '障',
  碍: '礙',
  自: '自',
  闭: '閉',
  症: '症',
  迟: '遲',
  缓: '緩',
  独: '獨',
  居: '居',
  单: '單',
  亲: '親',
  婚: '婚',
  姻: '姻',
  离: '離',
  暴: '暴',
  热: '熱',
  线: '線',
  电: '電',
  话: '話',
  网: '網',
  站: '站',
  地: '地',
  址: '址',
  堂: '堂',
  广: '廣',
  场: '場',
  街: '街',
  马: '馬',
  路: '路',
  楼: '樓',
  层: '層',
  座: '座',
  号: '號',
  费: '費',
  免: '免',
  钱: '錢',
  粮: '糧',
  食: '食',
  饭: '飯',
  帮: '幫',
  找: '找',
  寻: '尋',
  需: '需',
  照: '照',
  顾: '顧',
  动: '動',
  便: '便',
  爱: '愛',
  团: '團',
  体: '體',
  机: '機',
  构: '構',
  心: '心',
  理: '理',
  精: '精',
  神: '神',
  抑: '抑',
  郁: '鬱',
  焦: '焦',
  虑: '慮',
  绪: '緒',
  压: '壓',
  力: '力',
  杀: '殺',
  轻: '輕',
  优: '優',
  先: '先',
  婴: '嬰',
  幼: '幼',
  学: '學',
  教: '教',
  育: '育',
  特: '特',
  殊: '殊',
  工: '工',
  厂: '廠',
  实: '實',
  习: '習',
  资: '資',
  核: '核',
  确: '確',
  认: '認',
  新: '新',
  旧: '舊',
  开: '開',
  放: '放',
  间: '間',
  点: '點',
  国: '國',
  际: '際',
  东: '東',
  西: '西',
  南: '南',
  北: '北',
  中: '中',
  丽: '麗',
  华: '華',
  万: '萬',
  乐: '樂',
  欢: '歡',
  庆: '慶',
  丰: '豐',
  福: '福',
  宝: '寶',
  荣: '榮',
  发: '發',
  展: '展',
  进: '進',
  协: '協',
  妈: '媽',
  爸: '爸',
  爷: '爺',
  奶: '奶',
  公: '公',
  婆: '婆',
  孩: '孩',
  细: '細',
  屋: '屋',
  企: '企',
  冇: '無',
  搵: '找',
};

export function normalizeText(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = '';
  for (const ch of lower) {
    out += S2T_MAP[ch] ?? ch;
  }
  return out;
}

const NEIGHBORHOOD_REGION_HINTS: Array<{ keyword: string; region: string; parish?: string }> = [
  { keyword: '澳門半島', region: '澳門半島' },
  { keyword: '半島', region: '澳門半島' },
  { keyword: 'peninsula', region: '澳門半島' },
  { keyword: '氹仔', region: '氹仔', parish: '嘉模堂區' },
  { keyword: 'taipa', region: '氹仔', parish: '嘉模堂區' },
  { keyword: '嘉模', region: '氹仔', parish: '嘉模堂區' },
  { keyword: '路環', region: '路環', parish: '聖方濟各堂區' },
  { keyword: 'coloane', region: '路環', parish: '聖方濟各堂區' },
  { keyword: '石排灣', region: '路環', parish: '聖方濟各堂區' },
  { keyword: '九澳', region: '路環', parish: '聖方濟各堂區' },
  { keyword: '黑沙環', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '台山', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '祐漢', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '青洲', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '筷子基', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '望廈', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '沙梨頭', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '林茂塘', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '新口岸', region: '澳門半島', parish: '大堂區' },
  { keyword: '岡頂', region: '澳門半島', parish: '風順堂區' },
  { keyword: '下環', region: '澳門半島', parish: '風順堂區' },
  { keyword: '花地瑪', region: '澳門半島', parish: '花地瑪堂區' },
  { keyword: '聖安多尼', region: '澳門半島', parish: '聖安多尼堂區' },
  { keyword: '大堂區', region: '澳門半島', parish: '大堂區' },
  { keyword: '望德堂', region: '澳門半島', parish: '望德堂區' },
  { keyword: '風順堂', region: '澳門半島', parish: '風順堂區' },
];

const MEDICAL_TRIGGER_TERMS = ['心理醫生', '精神科', '醫生', '食藥', '開藥', '診斷', 'psychiatrist', 'psiquiatra'];

export interface SearchFilters {
  q?: string;
  category?: string;
  region?: string;
  parish?: string;
  status?: string;
  residential?: boolean;
  daycare?: boolean;
  barrierFree?: boolean;
  acceptsReferral?: boolean;
  includeInactive?: boolean;
  sort?: 'relevance' | 'verified' | 'name';
}

export function performSmartSearch(filters: SearchFilters): SearchResponse {
  const rawQuery = (filters.q ?? '').trim();
  const normalizedQuery = normalizeText(rawQuery);

  const allSynonyms = db.prepare('SELECT * FROM search_synonyms').all() as SearchSynonym[];
  const allUnits = getAllUnitsWithCategory(Boolean(filters.includeInactive));

  // Detect region hints from query if user didn't pick a region explicitly
  let detectedRegion: string | null = null;
  const queryDistrictTerms: string[] = [];
  if (normalizedQuery) {
    for (const hint of NEIGHBORHOOD_REGION_HINTS) {
      if (normalizedQuery.includes(normalizeText(hint.keyword))) {
        if (!detectedRegion) detectedRegion = hint.region;
        queryDistrictTerms.push(normalizeText(hint.keyword));
      }
    }
  }

  // Check if query asks for a psychiatrist / doctor
  const medicalDistinctionNotice = MEDICAL_TRIGGER_TERMS.some((term) =>
    normalizedQuery.includes(normalizeText(term))
  );

  // Build expanded terms and matched category boosts from Synonym table
  const expandedTermsSet = new Set<string>();
  const boostedCategorySlugs = new Set<string>();

  if (normalizedQuery) {
    const rawTokens = normalizedQuery
      .split(/[\s,，、。？！?!;；/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 1);

    for (const token of rawTokens) {
      expandedTermsSet.add(token);
    }

    for (const syn of allSynonyms) {
      const canonicalNorm = normalizeText(syn.canonical_term);
      const synList = syn.synonyms
        .split(/[,，、]/)
        .map((s) => normalizeText(s))
        .filter(Boolean);

      const allTermsInGroup = [canonicalNorm, ...synList];
      let groupMatched = false;

      for (const term of allTermsInGroup) {
        if (term.length >= 2 && normalizedQuery.includes(term)) {
          groupMatched = true;
          break;
        }
        for (const token of rawTokens) {
          if (token.length >= 2 && (term.includes(token) || token.includes(term))) {
            groupMatched = true;
            break;
          }
        }
        if (groupMatched) break;
      }

      if (groupMatched) {
        expandedTermsSet.add(canonicalNorm);
        for (const s of synList.slice(0, 8)) {
          expandedTermsSet.add(s);
        }
        if (syn.category_slug) {
          boostedCategorySlugs.add(syn.category_slug);
        }
      }
    }

    // Colloquial intent rules for complex citizen sentences
    if (
      normalizedQuery.includes('爸爸') ||
      normalizedQuery.includes('媽媽') ||
      normalizedQuery.includes('老人') ||
      normalizedQuery.includes('長者') ||
      normalizedQuery.includes('行動不便') ||
      normalizedQuery.includes('白天上班') ||
      normalizedQuery.includes('照顧')
    ) {
      if (
        normalizedQuery.includes('長者') ||
        normalizedQuery.includes('老人') ||
        normalizedQuery.includes('爸爸') ||
        normalizedQuery.includes('媽媽') ||
        normalizedQuery.includes('80歲') ||
        normalizedQuery.includes('行動不便')
      ) {
        boostedCategorySlugs.add('elderly');
        expandedTermsSet.add('長者');
        expandedTermsSet.add('日間護理');
        expandedTermsSet.add('安老院舍');
        expandedTermsSet.add('家居照顧');
      }
    }
    if (normalizedQuery.includes('小朋友') || normalizedQuery.includes('兒童') || normalizedQuery.includes('幼兒')) {
      boostedCategorySlugs.add('children-youth');
      if (normalizedQuery.includes('自閉') || normalizedQuery.includes('遲緩') || normalizedQuery.includes('特殊')) {
        boostedCategorySlugs.add('rehab');
        expandedTermsSet.add('早期療育');
        expandedTermsSet.add('自閉症');
      }
    }
    if (normalizedQuery.includes('經濟') || normalizedQuery.includes('無錢') || normalizedQuery.includes('困難') || normalizedQuery.includes('食物')) {
      boostedCategorySlugs.add('financial-living');
      boostedCategorySlugs.add('family-marriage');
      expandedTermsSet.add('經濟援助');
      expandedTermsSet.add('食物補助');
    }
  }

  const expandedTerms = Array.from(expandedTermsSet);

  // Filter & score
  const scored: ServiceUnit[] = [];

  for (const unit of allUnits) {
    if (filters.category && filters.category !== 'all' && unit.category_slug !== filters.category) {
      continue;
    }
    if (filters.region && filters.region !== 'all' && unit.region !== filters.region) {
      continue;
    }
    if (filters.parish && filters.parish !== 'all' && unit.parish !== filters.parish) {
      continue;
    }
    if (filters.status && filters.status !== 'all' && unit.verification_status !== filters.status) {
      continue;
    }
    if (filters.residential && unit.provides_residential !== 1) continue;
    if (filters.daycare && unit.provides_daycare !== 1) continue;
    if (filters.barrierFree && unit.is_barrier_free !== 1) continue;
    if (filters.acceptsReferral && unit.accepts_referral !== 1) continue;

    if (!normalizedQuery) {
      scored.push({ ...unit, relevance_score: 1, matched_terms: [] });
      continue;
    }

    const nameBlob = normalizeText(`${unit.unit_name_zh} ${unit.unit_name_pt} ${unit.unit_name_en}`);
    const orgBlob = normalizeText(`${unit.org_name_zh} ${unit.org_name_pt} ${unit.org_name_en}`);
    const catBlob = normalizeText(
      `${unit.category_name_zh ?? ''} ${unit.category_name_pt ?? ''} ${unit.category_name_en ?? ''} ${unit.sub_category}`
    );
    const locBlob = normalizeText(`${unit.region} ${unit.parish} ${unit.address}`);
    const detailBlob = normalizeText(
      `${unit.target_audience} ${unit.service_details} ${unit.eligibility} ${unit.notes} ${unit.phone}`
    );

    let score = 0;
    const matched = new Set<string>();

    // Exact phrase match
    if (nameBlob.includes(normalizedQuery)) {
      score += 100;
      matched.add(rawQuery);
    }
    if (orgBlob.includes(normalizedQuery)) {
      score += 60;
      matched.add(rawQuery);
    }
    if (locBlob.includes(normalizedQuery)) {
      score += 45;
      matched.add(rawQuery);
    }
    if (detailBlob.includes(normalizedQuery) || catBlob.includes(normalizedQuery)) {
      score += 40;
      matched.add(rawQuery);
    }

    // Synonym & token scoring
    for (const term of expandedTerms) {
      if (term.length < 2) continue;
      if (nameBlob.includes(term)) {
        score += 28;
        matched.add(term);
      } else if (catBlob.includes(term)) {
        score += 22;
        matched.add(term);
      } else if (locBlob.includes(term)) {
        score += 25;
        matched.add(term);
      } else if (orgBlob.includes(term)) {
        score += 16;
        matched.add(term);
      } else if (detailBlob.includes(term)) {
        score += 14;
        matched.add(term);
      }
    }

    // Category boost from synonym intent
    if (unit.category_slug && boostedCategorySlugs.has(unit.category_slug)) {
      score += 32;
    }

    // If user typed a specific region/district (e.g. "氹仔長者中心", "黑沙環家庭服務")
    if (detectedRegion) {
      const regionMatch = normalizeText(unit.region) === normalizeText(detectedRegion);
      const districtTextMatch = queryDistrictTerms.some((d) => locBlob.includes(d));
      if (districtTextMatch) {
        score += 45;
      } else if (regionMatch) {
        score += 20;
      } else if (score > 0) {
        // De-prioritize units outside explicitly mentioned region unless nothing matches
        score = Math.max(1, Math.floor(score * 0.35));
      }
    }

    // Slight fuzzy bigram fallback if score is still 0 and query is >= 2 chars
    if (score === 0 && normalizedQuery.length >= 2) {
      const fullBlob = `${nameBlob} ${orgBlob} ${catBlob} ${locBlob} ${detailBlob}`;
      let bigramHits = 0;
      for (let i = 0; i < normalizedQuery.length - 1; i++) {
        const bg = normalizedQuery.slice(i, i + 2);
        if (bg.trim().length === 2 && fullBlob.includes(bg)) {
          bigramHits++;
        }
      }
      if (bigramHits >= 2) {
        score += bigramHits * 6;
      }
    }

    // Verified records get a gentle quality bump
    if (score > 0) {
      if (unit.verification_status === 'verified') score += 5;
      scored.push({
        ...unit,
        relevance_score: score,
        matched_terms: Array.from(matched).slice(0, 5),
      });
    }
  }

  // Sort results
  const sortMode = filters.sort ?? 'relevance';
  if (sortMode === 'verified') {
    scored.sort((a, b) => (b.last_verified_date || '').localeCompare(a.last_verified_date || ''));
  } else if (sortMode === 'name') {
    scored.sort((a, b) => a.unit_name_zh.localeCompare(b.unit_name_zh, 'zh-Hant'));
  } else {
    scored.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0) || a.id - b.id);
  }

  return {
    query: rawQuery,
    normalized_query: normalizedQuery,
    expanded_terms: expandedTerms.filter((t) => t !== normalizedQuery).slice(0, 10),
    detected_region: detectedRegion,
    medical_distinction_notice: medicalDistinctionNotice,
    total: scored.length,
    items: scored,
  };
}
