'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { pickLocalized } from '@/i18n/pick-localized';

// 用 DivIcon 自定义小圆点 —— leaflet.markercluster 只聚合 L.Marker
// 不聚合 L.CircleMarker,所以原来的 CircleMarker 改成 Marker + DivIcon。
// 视觉上还是个彩色小圆点,但能进聚合队列
function makeDotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'supplier-dot',
    html: `<div style="
      width: 10px;
      height: 10px;
      background: ${color};
      border: 2px solid ${color};
      border-radius: 50%;
      opacity: 0.85;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.6);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}


type Supplier = {
  id: number;
  nameZh: string;
  nameRu: string | null;
  cityZh: string;
  cityRu: string | null;
  provinceZh: string;
  provinceRu: string | null;
  latitude: number;
  longitude: number;
  cooperationLevel: string;
};

// 颜色配置——纯视觉,不需要翻译
const LEVEL_COLORS: Record<string, string> = {
  STRATEGIC:       '#b91c1c',
  REGULAR:         '#ef4444',
  TRIAL_ORDER:     '#f97316',
  INITIAL_CONTACT: '#eab308',
  INACTIVE:        '#9ca3af',
};

// 级别顺序——图例显示用,从主力到不活跃
const LEVEL_ORDER = ['STRATEGIC', 'REGULAR', 'TRIAL_ORDER', 'INITIAL_CONTACT', 'INACTIVE'];

export default function MapView({ suppliers }: { suppliers: Supplier[] }) {
  const t = useTranslations('map');
  const tLevel = useTranslations('cooperationLevel');
  const locale = useLocale();
  const tileHl = locale === 'ru' ? 'ru' : 'zh-CN'; // 瓦片底图的地名标签语言
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const filteredSuppliers =
    selectedLevel === null
      ? suppliers
      : suppliers.filter((s) => s.cooperationLevel === selectedLevel);

  const countByLevel: Record<string, number> = {};
  for (const s of suppliers) {
    countByLevel[s.cooperationLevel] = (countByLevel[s.cooperationLevel] ?? 0) + 1;
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[35.86, 104.19]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={tileHl}
          url={`https://mt1.google.com/vt/lyrs=m&hl=${tileHl}&x={x}&y={y}&z={z}`}
          attribution="&copy; Google"
        />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          maxClusterRadius={50}
        >
          {filteredSuppliers.map((supplier) => {
            const color = LEVEL_COLORS[supplier.cooperationLevel] ?? LEVEL_COLORS.INITIAL_CONTACT;
            return (
              <Marker
                key={supplier.id}
                position={[supplier.latitude, supplier.longitude]}
                icon={makeDotIcon(color)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {pickLocalized(supplier.nameZh, supplier.nameRu, locale)}
                    </div>
                    <div className="text-gray-600">
                      {pickLocalized(supplier.provinceZh, supplier.provinceRu, locale)} ·{' '}
                      {pickLocalized(supplier.cityZh, supplier.cityRu, locale)}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {tLevel(supplier.cooperationLevel)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="absolute top-4 right-4 z-1000 bg-white/95 rounded-lg shadow-md p-3 text-sm min-w-40">
        <div className="font-semibold mb-2 text-gray-700 flex justify-between items-center">
          <span>{t('legendTitle')}</span>
          {selectedLevel !== null && (
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-xs text-blue-600 hover:underline font-normal"
            >
              {t('clearFilter')}
            </button>
          )}
        </div>
        {LEVEL_ORDER.map((key) => {
          const isActive = selectedLevel === key;
          const count = countByLevel[key] ?? 0;
          return (
            <div
              key={key}
              onClick={() => setSelectedLevel(isActive ? null : key)}
              className={`flex items-center gap-2 py-1 px-2 -mx-2 rounded cursor-pointer hover:bg-gray-100 ${
                isActive ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: LEVEL_COLORS[key] }}
              />
              <span className="text-gray-600 flex-1">{tLevel(key)}</span>
              <span className="text-gray-400 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}