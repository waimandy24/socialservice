import {
  staticGetCategories,
  staticGetMap,
  staticGetOrganizations,
  staticGetServiceDetail,
  staticGetSources,
  staticGetStats,
  staticRunAIMatch,
  staticSearchServices,
} from './staticBackend';
import type { Locale } from '../types';

let detectedStaticMode = false;

export function isKnownStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('.github.io') ||
    window.location.protocol === 'file:' ||
    detectedStaticMode
  );
}

function handleStaticRoute(path: string, init?: RequestInit): unknown {
  const url = new URL(path, 'http://local.static');
  const p = url.pathname;

  if (p === '/api/v1/stats') return staticGetStats();
  if (p === '/api/v1/categories') return staticGetCategories();
  if (p === '/api/v1/sources') return staticGetSources();
  if (p === '/api/v1/organizations') return staticGetOrganizations();
  if (p === '/api/v1/services') return staticSearchServices(url.searchParams);
  if (p.startsWith('/api/v1/services/')) {
    const id = Number(p.replace('/api/v1/services/', ''));
    const detail = staticGetServiceDetail(id);
    if (!detail) {
      throw new Error('找不到此服務單位資料');
    }
    return detail;
  }
  if (p === '/api/v1/map') return staticGetMap(url.searchParams);
  if (p === '/api/v1/ai-match') {
    let body: { query?: string; region?: string; locale?: Locale } = {};
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = {};
      }
    }
    return staticRunAIMatch({
      query: String(body.query ?? ''),
      region: body.region,
      locale: body.locale,
    });
  }

  throw new Error('此功能需要完整後端伺服器支援。');
}

/**
 * Dual-mode API client:
 * - In full-stack mode (AI Studio / Node.js / Cloud Run), calls real `/api/v1/*` Express endpoints.
 * - On GitHub Pages or static hosting (where `/api/*` is absent), seamlessly serves from the bundled verified Macau dataset.
 */
export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (isKnownStaticHost()) {
    return handleStaticRoute(path, init) as T;
  }

  try {
    const res = await fetch(path, init);
    const contentType = res.headers.get('content-type') || '';

    // Static hosts typically return HTML (404 page or index.html) for /api/* paths
    if (!contentType.includes('application/json')) {
      detectedStaticMode = true;
      return handleStaticRoute(path, init) as T;
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || '伺服器暫時無法回應');
    }
    return data as T;
  } catch (err) {
    // Only fall back to static mode on network / non-JSON host errors, not valid API 4xx/5xx business errors
    if (err instanceof TypeError) {
      detectedStaticMode = true;
      return handleStaticRoute(path, init) as T;
    }
    throw err;
  }
}
