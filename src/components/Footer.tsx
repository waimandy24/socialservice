import React from 'react';
import { ExternalLink, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UI_TEXT } from '../i18n';

export function Footer() {
  const { locale, navigate } = useApp();
  const t = UI_TEXT[locale];

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-lg font-bold text-[#0F4C81]">{t.siteTitle}</h2>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">{t.slogan}</p>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">{t.footerDisclaimer}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {locale === 'en' ? 'Official Portals' : locale === 'pt' ? 'Portais Oficiais' : '官方資料參考來源'}
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="https://www.ias.gov.mo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#0F4C81]"
                >
                  澳門社會工作局 (IAS) <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ageing.ias.gov.mo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#0F4C81]"
                >
                  澳門特區長者服務資訊網 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.rehab.ias.gov.mo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#0F4C81]"
                >
                  澳門特區康復服務資訊網 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.childcare.ias.gov.mo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#0F4C81]"
                >
                  澳門特區托兒服務資訊網 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://data.gov.mo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#0F4C81]"
                >
                  澳門政府數據開放平台 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {locale === 'en' ? 'Key Hotlines' : locale === 'pt' ? 'Linhas de Apoio' : '主要求助熱線'}
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0F4C81] shrink-0" />
                <span className="font-mono-num">{t.iasHotline}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span className="font-mono-num">{t.counseling24h}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span className="font-mono-num">{t.caritasHotline}</span>
              </li>
              <li className="pt-2">
                <a
                  href="/admin"
                  onClick={(e) => handleLink(e, '/admin')}
                  className="text-xs font-medium text-slate-500 hover:text-[#0F4C81] underline underline-offset-2"
                >
                  {locale === 'en'
                    ? 'Administrator Console (/admin)'
                    : locale === 'pt'
                      ? 'Consola de Gestão (/admin)'
                      : '資料核實與後台管理系統'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} {t.siteTitle} · MACAU SOCIAL SERVICES HUB</span>
          <div className="flex items-center gap-4">
            <a href="/search" onClick={(e) => handleLink(e, '/search')} className="hover:text-[#0F4C81]">
              {t.navSearch}
            </a>
            <a href="/map" onClick={(e) => handleLink(e, '/map')} className="hover:text-[#0F4C81]">
              {t.navMap}
            </a>
            <a href="/ai-match" onClick={(e) => handleLink(e, '/ai-match')} className="hover:text-[#0F4C81]">
              {t.navAI}
            </a>
            <a href="/about" onClick={(e) => handleLink(e, '/about')} className="hover:text-[#0F4C81]">
              {t.navAbout}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
