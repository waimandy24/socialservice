import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ServiceUnit } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  elderly: '#0F4C81',
  rehab: '#0E7490',
  'children-youth': '#0F766E',
  'family-marriage': '#1D4ED8',
  'mental-health': '#0369A1',
  'financial-living': '#15803D',
  women: '#2563EB',
  'crisis-vulnerable': '#047857',
  'employment-training': '#1E40AF',
  'addiction-reintegration': '#0D9488',
  'community-volunteer': '#0284C7',
  'public-legal-other': '#166534',
};

function createPinIcon(color: string, active = false): L.DivIcon {
  const size = active ? 32 : 24;
  return L.divIcon({
    className: 'macau-custom-marker',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:3px solid #ffffff;
      box-shadow:0 3px 10px rgba(15,23,42,0.32);
      display:flex;
      align-items:center;
      justify-content:center;
      transform:${active ? 'scale(1.12)' : 'scale(1)'};
    "><span style="width:7px;height:7px;border-radius:50%;background:#ffffff;display:block;"></span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface MacauMapProps {
  units: ServiceUnit[];
  selectedUnitId?: number | null;
  onSelectUnit?: (unit: ServiceUnit) => void;
  onNavigateDetail?: (unitId: number) => void;
  heightClass?: string;
  singleUnitZoom?: number;
}

export function MacauMap({
  units,
  selectedUnitId = null,
  onSelectUnit,
  onNavigateDetail,
  heightClass = 'h-[540px]',
  singleUnitZoom = 16,
}: MacauMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [22.178, 113.552], // Central Macau Peninsula + Taipa view
      zoom: 13,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers whenever units or selectedUnitId change
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const validUnits = units.filter(
      (u): u is ServiceUnit & { latitude: number; longitude: number } =>
        typeof u.latitude === 'number' && typeof u.longitude === 'number'
    );

    const bounds: L.LatLngTuple[] = [];

    for (const u of validUnits) {
      const color = CATEGORY_COLORS[u.category_slug ?? ''] ?? '#0F4C81';
      const isSelected = selectedUnitId === u.id;
      const marker = L.marker([u.latitude, u.longitude], {
        icon: createPinIcon(color, isSelected),
      });

      const popupNode = document.createElement('div');
      popupNode.className = 'min-w-[220px] max-w-[270px]';
      popupNode.innerHTML = `
        <div style="font-size:11px;font-weight:600;color:${color};margin-bottom:4px;">
          ${escapeHtml(u.category_name_zh || '')} · ${escapeHtml(u.region)}
        </div>
        <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;line-height:1.35;">
          ${escapeHtml(u.unit_name_zh)}
        </div>
        <div style="font-size:12px;color:#475569;margin-bottom:4px;">
          ${escapeHtml(u.org_name_zh)}
        </div>
        <div style="font-size:12px;color:#334155;margin-bottom:3px;">
          電話：${escapeHtml(u.phone)}
        </div>
        <div style="font-size:12px;color:#475569;margin-bottom:10px;">
          地址：${escapeHtml(u.address)}
        </div>
      `;

      if (onNavigateDetail) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '查看完整機構資料 →';
        btn.style.cssText =
          'width:100%;padding:7px 10px;background:#0F4C81;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;';
        btn.addEventListener('click', () => onNavigateDetail(u.id));
        popupNode.appendChild(btn);
      }

      marker.bindPopup(popupNode);
      marker.on('click', () => {
        if (onSelectUnit) onSelectUnit(u);
      });

      marker.addTo(layer);
      bounds.push([u.latitude, u.longitude]);

      if (isSelected) {
        marker.openPopup();
      }
    }

    if (validUnits.length === 1) {
      map.setView([validUnits[0].latitude, validUnits[0].longitude], singleUnitZoom);
    } else if (selectedUnitId) {
      const target = validUnits.find((u) => u.id === selectedUnitId);
      if (target) {
        map.setView([target.latitude, target.longitude], 15, { animate: true });
      }
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    } else {
      map.setView([22.178, 113.552], 13);
    }
  }, [units, selectedUnitId, onSelectUnit, onNavigateDetail, singleUnitZoom]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClass} rounded-xl border border-slate-200 overflow-hidden bg-slate-100`}
      aria-label="澳門社會服務互動地圖"
    />
  );
}
