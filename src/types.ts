export type Locale = 'zh-MO' | 'pt' | 'en';
export type FontScale = 'normal' | 'large' | 'xlarge';

export type VerificationStatus = 'verified' | 'pending' | 'needs_update' | 'inactive';

export type MacauRegion = '澳門半島' | '氹仔' | '路環';

export interface Category {
  id: number;
  slug: string;
  name_zh: string;
  name_pt: string;
  name_en: string;
  description_zh: string;
  description_pt: string;
  description_en: string;
  icon: string;
  color: string;
  sort_order: number;
  unit_count?: number;
}

export interface Organization {
  id: number;
  name_zh: string;
  name_pt: string;
  name_en: string;
  org_type: string; // 政府部門 | 社工局受資助機構 | 非受資助機構 | 民間非牟利團體
  website: string;
  phone: string;
  notes: string;
  unit_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: number;
  name: string;
  url: string;
  authority_type: string;
  description: string;
  last_checked_date: string;
  unit_count?: number;
}

export interface ServiceUnit {
  id: number;
  organization_id: number | null;
  org_name_zh: string;
  org_name_pt: string;
  org_name_en: string;
  org_type: string;
  unit_name_zh: string;
  unit_name_pt: string;
  unit_name_en: string;
  category_id: number;
  category_slug?: string;
  category_name_zh?: string;
  category_name_pt?: string;
  category_name_en?: string;
  sub_category: string;
  target_audience: string;
  service_details: string;
  eligibility: string;
  application_procedure: string;
  required_documents: string;
  address: string;
  parish: string;
  region: MacauRegion | string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  opening_hours: string;
  fees: string;
  requires_appointment: number; // 0 | 1 | -1 (待核實)
  accepts_referral: number;     // 0 | 1 | -1
  requires_assessment: number;  // 0 | 1 | -1
  provides_residential: number; // 0 | 1 | -1
  provides_daycare: number;     // 0 | 1 | -1
  is_barrier_free: number;      // 0 | 1 | -1
  latitude: number | null;
  longitude: number | null;
  data_source_id: number | null;
  source_name: string;
  source_url: string;
  collected_date: string;
  last_verified_date: string;
  verification_status: VerificationStatus;
  needs_update: number;
  is_medical_service: number;
  notes: string;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
  matched_terms?: string[];
}

export interface SearchSynonym {
  id: number;
  canonical_term: string;
  synonyms: string; // comma-separated keywords (Traditional, Simplified, Cantonese, PT, EN)
  category_slug: string;
  notes: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  summary: string;
  actor: string;
  created_at: string;
}

export interface DashboardStats {
  total_units: number;
  active_units: number;
  verified_units: number;
  pending_units: number;
  needs_update_units: number;
  inactive_units: number;
  elderly_units: number;
  rehab_units: number;
  children_units: number;
  family_units: number;
  mapped_units: number;
  total_organizations: number;
  total_sources: number;
  by_region: Record<string, number>;
  by_category: Array<{
    id: number;
    slug: string;
    name_zh: string;
    name_pt: string;
    name_en: string;
    count: number;
  }>;
}

export interface SearchResponse {
  query: string;
  normalized_query: string;
  expanded_terms: string[];
  detected_region: string | null;
  medical_distinction_notice: boolean;
  total: number;
  items: ServiceUnit[];
}

export interface AIMatchRecommendation {
  unit_id: number;
  reason: string;
  suggested_action: string;
  unit?: ServiceUnit;
}

export interface AIMatchResponse {
  summary: string;
  recommended_service_types: string[];
  medical_vs_social_notice: string | null;
  insufficient_data_notice: string | null;
  general_steps: string[];
  recommendations: AIMatchRecommendation[];
  ias_fallback: {
    name: string;
    hotline: string;
    counseling_24h: string;
    website: string;
  };
}

export interface DuplicateGroup {
  reason: string;
  key: string;
  units: Array<{
    id: number;
    unit_name_zh: string;
    org_name_zh: string;
    phone: string;
    address: string;
    verification_status: VerificationStatus;
  }>;
}

export const MACAU_REGIONS: MacauRegion[] = ['澳門半島', '氹仔', '路環'];

export const MACAU_PARISHES: Array<{ name: string; region: MacauRegion; pt: string; en: string }> = [
  { name: '花地瑪堂區', region: '澳門半島', pt: 'Freguesia de Nossa Senhora de Fátima', en: 'Nossa Senhora de Fátima' },
  { name: '聖安多尼堂區', region: '澳門半島', pt: 'Freguesia de Santo António', en: 'Santo António' },
  { name: '大堂區', region: '澳門半島', pt: 'Freguesia da Sé', en: 'Sé Parish' },
  { name: '望德堂區', region: '澳門半島', pt: 'Freguesia de São Lázaro', en: 'São Lázaro' },
  { name: '風順堂區', region: '澳門半島', pt: 'Freguesia de São Lourenço', en: 'São Lourenço' },
  { name: '嘉模堂區', region: '氹仔', pt: 'Freguesia de Nossa Senhora do Carmo', en: 'Nossa Senhora do Carmo (Taipa)' },
  { name: '聖方濟各堂區', region: '路環', pt: 'Freguesia de São Francisco Xavier', en: 'São Francisco Xavier (Coloane)' },
];
