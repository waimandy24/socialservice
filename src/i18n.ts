import type { Category, Locale, VerificationStatus } from './types';

export const UI_TEXT: Record<
  Locale,
  {
    siteTitle: string;
    siteShort: string;
    subtitle: string;
    slogan: string;
    searchPlaceholder: string;
    searchBtn: string;
    navHome: string;
    navSearch: string;
    navMap: string;
    navAI: string;
    navAbout: string;
    navAdmin: string;
    fontSizeLabel: string;
    fontNormal: string;
    fontLarge: string;
    fontXLarge: string;
    statsTotal: string;
    statsElderly: string;
    statsRehab: string;
    statsChildren: string;
    statsFamily: string;
    statsVerified: string;
    statsNote: string;
    categoriesTitle: string;
    categoriesSubtitle: string;
    regionTitle: string;
    regionSubtitle: string;
    allMacau: string;
    aiPromoTitle: string;
    aiPromoDesc: string;
    aiPromoBtn: string;
    viewAllServices: string;
    viewDetails: string;
    backToSearch: string;
    verified: string;
    pending: string;
    needs_update: string;
    inactive: string;
    yes: string;
    no: string;
    tbd: string;
    unitCountUnit: string;
    emergencyBarTitle: string;
    iasHotline: string;
    counseling24h: string;
    caritasHotline: string;
    footerDisclaimer: string;
  }
> = {
  'zh-MO': {
    siteTitle: '澳門社會服務百科',
    siteShort: '澳門社會服務百科',
    subtitle: '全澳社會服務，一站式搜尋。',
    slogan: '一站搜尋全澳服務，有需要，就搵得到。',
    searchPlaceholder: '請輸入你需要的服務，例如：長者院舍、家庭輔導、殘疾支援……',
    searchBtn: '搜尋服務',
    navHome: '首頁',
    navSearch: '服務搜尋',
    navMap: '互動地圖',
    navAI: 'AI 智能配對',
    navAbout: '資料來源',
    navAdmin: '管理後台',
    fontSizeLabel: '字體',
    fontNormal: '標準',
    fontLarge: '大',
    fontXLarge: '特大',
    statsTotal: '全部服務單位',
    statsElderly: '長者服務單位',
    statsRehab: '復康服務單位',
    statsChildren: '兒童及青少年單位',
    statsFamily: '家庭服務單位',
    statsVerified: '已核實資料',
    statsNote: '以上所有數字均直接從本平台資料庫即時動態計算，並持續擴充及核實全澳設施。',
    categoriesTitle: '12 大澳門社會服務分類',
    categoriesSubtitle: '按人生階段與實際困難分類瀏覽，涵蓋政府單位、受資助機構及民間非牟利團體。',
    regionTitle: '全澳門分區搜尋',
    regionSubtitle: '按居住區域或堂區快速尋找鄰近的社會工作中心、長者服務、托兒及復康設施。',
    allMacau: '全澳門',
    aiPromoTitle: '不知道該申請哪一項服務？試試 AI 智能服務配對',
    aiPromoDesc: '用日常口語說出你或家人的困難，系統將根據真實資料庫為你分析合適的服務方向、機構聯絡電話及申請方法。',
    aiPromoBtn: '開始智能配對',
    viewAllServices: '瀏覽全部服務單位',
    viewDetails: '查看完整資料',
    backToSearch: '返回服務搜尋',
    verified: '已核實',
    pending: '待核實',
    needs_update: '需要更新',
    inactive: '已停止服務',
    yes: '是',
    no: '否',
    tbd: '待核實',
    unitCountUnit: '間',
    emergencyBarTitle: '24小時緊急情緒及危機支援',
    iasHotline: '社工局查詢 2836 7878',
    counseling24h: '社工局24小時輔導熱線 2826 1126',
    caritasHotline: '明愛生命熱線 2852 5222',
    footerDisclaimer: '本網站致力整理公開可查核之澳門社會服務資訊，不代表任何機構承諾申請結果。如資料有變動，以各機構及社會工作局最新公佈為準。',
  },
  pt: {
    siteTitle: 'Enciclopédia de Serviços Sociais de Macau',
    siteShort: 'Serviços Sociais Macau',
    subtitle: 'Serviços sociais de Macau, pesquisa num só local.',
    slogan: 'Pesquise todos os serviços de Macau num só lugar — encontre apoio quando precisar.',
    searchPlaceholder: 'Pesquise serviços: ex. lar de idosos, creche, apoio familiar, reabilitação…',
    searchBtn: 'Pesquisar',
    navHome: 'Início',
    navSearch: 'Pesquisa',
    navMap: 'Mapa',
    navAI: 'Assistente IA',
    navAbout: 'Fontes',
    navAdmin: 'Gestão',
    fontSizeLabel: 'Texto',
    fontNormal: 'Normal',
    fontLarge: 'Grande',
    fontXLarge: 'Extra',
    statsTotal: 'Total de Unidades',
    statsElderly: 'Serviços p/ Idosos',
    statsRehab: 'Reabilitação',
    statsChildren: 'Crianças e Jovens',
    statsFamily: 'Apoio Familiar',
    statsVerified: 'Registos Verificados',
    statsNote: 'Todos os números são calculados em tempo real a partir da base de dados em expansão contínua.',
    categoriesTitle: '12 Categorias de Serviços Sociais',
    categoriesSubtitle: 'Explore serviços públicos, instituições subsidiadas pelo IAS e associações sem fins lucrativos.',
    regionTitle: 'Pesquisa por Zona de Macau',
    regionSubtitle: 'Encontre centros sociais, creches e apoio comunitário na Península, Taipa ou Coloane.',
    allMacau: 'Todo Macau',
    aiPromoTitle: 'Não sabe qual serviço pedir? Use a Correspondência Inteligente por IA',
    aiPromoDesc: 'Descreva a sua situação em linguagem simples e receba recomendações baseadas apenas em unidades reais da base de dados.',
    aiPromoBtn: 'Iniciar Correspondência IA',
    viewAllServices: 'Ver Todas as Unidades',
    viewDetails: 'Ver Ficha Completa',
    backToSearch: 'Voltar à Pesquisa',
    verified: 'Verificado',
    pending: 'Por Verificar',
    needs_update: 'Requer Atualização',
    inactive: 'Encerrado',
    yes: 'Sim',
    no: 'Não',
    tbd: 'Por verificar',
    unitCountUnit: 'unid.',
    emergencyBarTitle: 'Linhas de Apoio 24 Horas',
    iasHotline: 'IAS 2836 7878',
    counseling24h: 'Linha 24h IAS 2826 1126',
    caritasHotline: 'Linha Esperança 2852 5222',
    footerDisclaimer: 'Plataforma informativa de serviços sociais de Macau baseada em fontes públicas verificáveis. Confirme sempre requisitos diretamente junto do IAS ou das instituições.',
  },
  en: {
    siteTitle: 'Macau Social Services Hub',
    siteShort: 'Macau Social Services',
    subtitle: 'All Macau social services in one clear, searchable encyclopedia.',
    slogan: 'One-stop search across Macau — find verified support whenever you need it.',
    searchPlaceholder: 'Search services, e.g. elderly home, family counseling, autism rehab…',
    searchBtn: 'Search',
    navHome: 'Home',
    navSearch: 'Directory',
    navMap: 'Service Map',
    navAI: 'AI Matcher',
    navAbout: 'Data Sources',
    navAdmin: 'Admin',
    fontSizeLabel: 'Text',
    fontNormal: 'Std',
    fontLarge: 'L',
    fontXLarge: 'XL',
    statsTotal: 'Total Service Units',
    statsElderly: 'Elderly Services',
    statsRehab: 'Rehabilitation',
    statsChildren: 'Children & Youth',
    statsFamily: 'Family Services',
    statsVerified: 'Verified Records',
    statsNote: 'All figures are calculated dynamically from the live database as Macau-wide verification expands.',
    categoriesTitle: '12 Social Service Categories',
    categoriesSubtitle: 'Browse government departments, IAS-subvented facilities, and local non-profit organizations.',
    regionTitle: 'Search by Macau District',
    regionSubtitle: 'Find nearby social service centers, elderly day care, nurseries, and rehab units by area.',
    allMacau: 'All Macau',
    aiPromoTitle: 'Not sure which service fits? Try AI Smart Service Matching',
    aiPromoDesc: 'Describe your situation in everyday words. Our assistant analyzes your needs and recommends real, verified units strictly from our database.',
    aiPromoBtn: 'Start AI Matching',
    viewAllServices: 'Browse All Units',
    viewDetails: 'View Full Profile',
    backToSearch: 'Back to Directory',
    verified: 'Verified',
    pending: 'Pending Verification',
    needs_update: 'Needs Update',
    inactive: 'Discontinued',
    yes: 'Yes',
    no: 'No',
    tbd: 'Pending verification',
    unitCountUnit: 'units',
    emergencyBarTitle: '24-Hour Crisis & Emotional Support',
    iasHotline: 'IAS General 2836 7878',
    counseling24h: 'IAS 24h Hotline 2826 1126',
    caritasHotline: 'Caritas Life Hope 2852 5222',
    footerDisclaimer: 'Public directory of verifiable Macau social services. Eligibility and intake are subject to assessment by IAS and each service operator.',
  },
};

export function getCategoryName(cat: Pick<Category, 'name_zh' | 'name_pt' | 'name_en'>, locale: Locale): string {
  if (locale === 'pt') return cat.name_pt || cat.name_zh;
  if (locale === 'en') return cat.name_en || cat.name_zh;
  return cat.name_zh;
}

export function getCategoryDesc(
  cat: Pick<Category, 'description_zh' | 'description_pt' | 'description_en'>,
  locale: Locale
): string {
  if (locale === 'pt') return cat.description_pt || cat.description_zh;
  if (locale === 'en') return cat.description_en || cat.description_zh;
  return cat.description_zh;
}

export function getStatusLabel(status: VerificationStatus, locale: Locale): string {
  const t = UI_TEXT[locale];
  if (status === 'verified') return t.verified;
  if (status === 'needs_update') return t.needs_update;
  if (status === 'inactive') return t.inactive;
  return t.pending;
}

export function getRegionLabel(region: string, locale: Locale): string {
  if (locale === 'pt') {
    if (region === '澳門半島') return 'Península de Macau';
    if (region === '氹仔') return 'Taipa';
    if (region === '路環') return 'Coloane';
  }
  if (locale === 'en') {
    if (region === '澳門半島') return 'Macau Peninsula';
    if (region === '氹仔') return 'Taipa';
    if (region === '路環') return 'Coloane';
  }
  return region;
}

export function formatTriState(val: number, locale: Locale): string {
  const t = UI_TEXT[locale];
  if (val === 1) return t.yes;
  if (val === 0) return t.no;
  return t.tbd;
}
