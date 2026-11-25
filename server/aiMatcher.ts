import { GoogleGenAI, Type } from '@google/genai';
import { getAllUnitsWithCategory, getUnitById } from './db.ts';
import { performSmartSearch } from './searchEngine.ts';
import type { AIMatchResponse, Locale, ServiceUnit } from '../src/types.ts';

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const IAS_FALLBACK = {
  name: '澳門特別行政區政府社會工作局（IAS）',
  hotline: '2836 7878',
  counseling_24h: '2826 1126',
  website: 'https://www.ias.gov.mo/',
};

export async function runAIServiceMatch(
  userQuery: string,
  locale: Locale = 'zh-MO',
  regionFilter?: string
): Promise<AIMatchResponse> {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    throw new Error('請輸入您需要協助的情況或服務需要。');
  }

  // Step 1: Retrieve real candidate units from SQLite using our smart search engine
  const searchResult = performSmartSearch({
    q: trimmed,
    region: regionFilter && regionFilter !== 'all' ? regionFilter : undefined,
  });

  // Ensure broad enough real candidate pool (top 18 relevant units, or fallback to verified general centers)
  let candidates: ServiceUnit[] = searchResult.items.slice(0, 18);
  if (candidates.length < 6) {
    const allActive = getAllUnitsWithCategory(false);
    const existingIds = new Set(candidates.map((c) => c.id));
    for (const u of allActive) {
      if (!existingIds.has(u.id)) {
        candidates.push(u);
        existingIds.add(u.id);
      }
      if (candidates.length >= 20) break;
    }
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('AI 服務配對暫時未設定 GEMINI_API_KEY，請先聯絡網站管理員或直接使用站內智能搜尋功能。');
  }

  const catalogContext = candidates.map((u) => ({
    id: u.id,
    unit_name_zh: u.unit_name_zh,
    org_name_zh: u.org_name_zh,
    category: u.category_name_zh,
    sub_category: u.sub_category,
    region: u.region,
    parish: u.parish,
    address: u.address,
    phone: u.phone,
    target_audience: u.target_audience,
    service_details: u.service_details,
    eligibility: u.eligibility,
    application_procedure: u.application_procedure,
    provides_residential: u.provides_residential === 1,
    provides_daycare: u.provides_daycare === 1,
    verification_status: u.verification_status,
  }));

  const langInstruction =
    locale === 'en'
      ? 'Respond in clear, empathetic English (keep official Macau Chinese unit names where helpful).'
      : locale === 'pt'
        ? 'Responda em Português claro e empático (mantenha os nomes oficiais das unidades de Macau quando útil).'
        : '請使用親切、清晰、適合澳門市民及長者閱讀的繁體中文（澳門常用語）作答。';

  const systemInstruction = `你是「澳門社會服務百科」的 AI 智能服務配對助手。
你必須嚴格遵守以下鐵律：
1. 你只可以從下方提供的【真實資料庫候選單位清單】中挑選並推薦單位（必須回傳正確的 unit_id）。絕不可以編造任何資料庫以外的機構、電話、地址、網址或服務資格。
2. 絕不可以承諾申請必定成功或保證即時入托／入住。所有資格及輪候均須由相關機構或社會工作局評估作準。
3. 如果市民提及「心理醫生」、「精神科」、「食藥」、「診斷」或嚴重精神健康困擾，必須在 medical_vs_social_notice 欄位清楚區分：醫療診斷及處方藥物屬於醫療服務（如仁伯爵綜合醫院精神科、各區衛生中心），而社會服務機構提供的是心理輔導、情緒支援熱線及社區精神康復；若有緊急安全風險請即致電 999 或 24 小時熱線 2826 1126 / 2852 5222。
4. 如果資料庫現有單位未能完全涵蓋市民的特定細分需求，請在 insufficient_data_notice 如實說明目前資料庫正持續擴充中，建議同時聯絡社會工作局（2836 7878）或所屬分區社會工作中心查詢最新資源。
5. ${langInstruction}`;

  const prompt = `市民描述的情況：
「${trimmed}」
${regionFilter && regionFilter !== 'all' ? `市民指定地區：${regionFilter}` : ''}

【真實資料庫候選單位清單（僅可從此處挑選 unit_id）】：
${JSON.stringify(catalogContext, null, 2)}

請分析市民的核心需要，列出建議考慮的服務類型（例如：長者日間護理、家居照顧、安老院舍、護老者支援等），並從上述清單中選出最切合的 2 至 6 個真實服務單位，說明每個單位的配對原因及建議聯絡／申請步驟。`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: '對市民處境的同理分析與整體建議摘要（2至4句清晰易讀文字）。',
          },
          recommended_service_types: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '建議考慮的社會服務類型清單，例如長者日間護理、家居照顧、安老院舍、護老者支援。',
          },
          medical_vs_social_notice: {
            type: Type.STRING,
            description: '若涉及心理醫生、精神科或醫療診斷，填寫醫療服務與社會服務的清晰區分說明；否則填寫空字串。',
          },
          insufficient_data_notice: {
            type: Type.STRING,
            description: '若現有資料庫資料不足以完全涵蓋需求，填寫誠實提醒與聯絡社工局建議；否則填寫空字串。',
          },
          general_steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3至4個實用且清晰的下一步行動建議（例如先致電預約、準備澳門居民身份證等）。',
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unit_id: {
                  type: Type.INTEGER,
                  description: '必須嚴格對應候選清單中的真實 id。',
                },
                reason: {
                  type: Type.STRING,
                  description: '此真實服務單位為何適合市民當前處境。',
                },
                suggested_action: {
                  type: Type.STRING,
                  description: '建議如何聯絡或申請該單位的簡明步驟。',
                },
              },
              required: ['unit_id', 'reason', 'suggested_action'],
            },
          },
        },
        required: ['summary', 'recommended_service_types', 'general_steps', 'recommendations'],
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as {
    summary?: string;
    recommended_service_types?: string[];
    medical_vs_social_notice?: string;
    insufficient_data_notice?: string;
    general_steps?: string[];
    recommendations?: Array<{ unit_id: number; reason: string; suggested_action: string }>;
  };

  // Strictly verify every recommended unit_id against SQLite so zero hallucinated records pass through
  const validRecommendations = [];
  const seenIds = new Set<number>();
  for (const rec of parsed.recommendations ?? []) {
    const id = Number(rec.unit_id);
    if (!Number.isInteger(id) || seenIds.has(id)) continue;
    const realUnit = getUnitById(id);
    if (!realUnit || realUnit.verification_status === 'inactive') continue;
    seenIds.add(id);
    validRecommendations.push({
      unit_id: realUnit.id,
      reason: rec.reason || '',
      suggested_action: rec.suggested_action || '',
      unit: realUnit,
    });
  }

  return {
    summary: parsed.summary || '已根據您的情況分析相關澳門社會服務方向。',
    recommended_service_types: Array.isArray(parsed.recommended_service_types)
      ? parsed.recommended_service_types
      : [],
    medical_vs_social_notice:
      parsed.medical_vs_social_notice && parsed.medical_vs_social_notice.trim().length > 0
        ? parsed.medical_vs_social_notice.trim()
        : searchResult.medical_distinction_notice
          ? '溫馨提示：精神科醫生診斷及藥物治療屬於醫療服務（可聯絡仁伯爵綜合醫院或各區衛生中心）；本網站所列多為社會服務機構提供的心理輔導、情緒支援熱線及社區康復資源。'
          : null,
    insufficient_data_notice:
      parsed.insufficient_data_notice && parsed.insufficient_data_notice.trim().length > 0
        ? parsed.insufficient_data_notice.trim()
        : validRecommendations.length === 0
          ? '本百科資料庫仍在持續整理及擴充全澳服務單位，暫未檢索到完全吻合的細分單位，建議直接致電澳門社會工作局查詢（2836 7878）或 24 小時輔導熱線（2826 1126）。'
          : null,
    general_steps: Array.isArray(parsed.general_steps) ? parsed.general_steps : [],
    recommendations: validRecommendations,
    ias_fallback: IAS_FALLBACK,
  };
}
