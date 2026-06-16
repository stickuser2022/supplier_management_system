'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { pickLocalized } from '@/i18n/pick-localized';

// 用 DivIcon 自定义小圆点 —— leaflet.markercluster 只聚合 L.Marker
// 不聚合 L.CircleMarker,所以用 Marker + DivIcon。
// size 由父组件根据当前 zoom 传进来,4 档:近 → 远 = 24 / 18 / 14 / 10 px
function makeDotIcon(color: string, size: number): L.DivIcon {
  const inner = size - 4; // 减掉 border 占位
  return L.divIcon({
    className: 'supplier-dot',
    html: `<div style="
      width: ${inner}px;
      height: ${inner}px;
      background: ${color};
      border: 2px solid ${color};
      border-radius: 50%;
      opacity: 0.85;
      box-shadow: 0 0 0 1.5px rgba(255,255,255,0.8);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// 根据 zoom 算点位大小:越近越大,方便点击
function dotSizeForZoom(zoom: number): number {
  if (zoom >= 11) return 24;
  if (zoom >= 8) return 18;
  if (zoom >= 5) return 14;
  return 10;
}


type Supplier = {
  id: number;
  nameZh: string;
  nameRu: string | null;
  cityZh: string;
  cityRu: string | null;
  provinceZh: string;
  provinceRu: string | null;
  addressZh: string | null;
  addressRu: string | null;
  mainProductsZh: string | null;
  mainProductsRu: string | null;
  latitude: number;
  longitude: number;
  cooperationLevel: string;
  supplierTags: {
    tagId: number;
    tag: { id: number; nameZh: string; nameRu: string; color: string | null };
  }[];
  logoFileId: number | null;
  primaryContact: {
    nameZh: string;
    nameRu: string | null;
    phone: string | null;
    wechat: string | null;
    email: string | null;
    whatsapp: string | null;
    telegram: string | null;
    qq: string | null;
  } | null;
  _count: {
    quotes: number;
    transactions: number;
    contacts: number;
  };
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

  // 现在 level 筛选走 URL,跟搜索栏 / 列表页同一套(server 端筛了再传过来)
  // MapView 不再自己做客户端过滤,只负责渲染传进来的数据 + 图例点击同步 URL
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLevel = searchParams.get('level');

  function toggleLevel(key: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (sp.get('level') === key) sp.delete('level');
    else sp.set('level', key);
    router.replace(`/map?${sp.toString()}`);
  }

  const filteredSuppliers = suppliers; // server 已经按 URL 过滤了

  // 计数基于当前结果集(用户先用搜索/标签过滤,然后看 level 分布)
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
        <MapInteractiveLayer
          suppliers={filteredSuppliers}
          locale={locale}
          tLevel={tLevel}
          t={t}
        />
      </MapContainer>

      <div className="absolute top-4 right-4 z-1000 bg-white/95 rounded-lg shadow-md p-3 text-sm min-w-40">
        <div className="font-semibold mb-2 text-gray-700 flex justify-between items-center">
          <span>{t('legendTitle')}</span>
          {selectedLevel !== null && (
            <button
              onClick={() => toggleLevel(selectedLevel ?? '')}
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
              onClick={() => toggleLevel(key)}
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

// ─── 交互层(必须在 MapContainer 内部,这样能拿到 map instance)─
// 干两件事:
// 1. 监听 zoom 变化 → 重算 dotSize → marker icon 跟着变大变小
// 2. 当筛选结果变化 → flyTo 单点 / flyToBounds 多点,智能缩放到结果范围
function MapInteractiveLayer({
  suppliers,
  locale,
  tLevel,
  t,
}: {
  suppliers: Supplier[];
  locale: string;
  tLevel: (k: string) => string;
  t: (k: string) => string;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const searchParams = useSearchParams();

  // 监听 zoom 变化,更新 dotSize
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  // 自动适配视图:仅在有筛选(q / tags / level)且有结果时才动镜头,
  // 避免用户没操作时被强制 reset
  const hasFilter =
    !!searchParams.get('q') ||
    !!searchParams.get('tags') ||
    !!searchParams.get('level');
  // 用 supplier id 拼成稳定 key,避免 suppliers 引用变化触发不必要的 effect
  const idsKey = suppliers.map((s) => s.id).join(',');

  useEffect(() => {
    if (!hasFilter || suppliers.length === 0) return;

    if (suppliers.length === 1) {
      const s = suppliers[0];
      map.flyTo([s.latitude, s.longitude], 12, { duration: 0.8 });
      return;
    }

    const bounds = L.latLngBounds(
      suppliers.map((s) => [s.latitude, s.longitude]),
    );
    map.flyToBounds(bounds, {
      padding: [60, 60],
      maxZoom: 11,
      duration: 0.8,
    });
    // 用 idsKey 作为依赖,而非 suppliers 数组本身
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, hasFilter, map]);

  const size = dotSizeForZoom(zoom);

  return (
    <MarkerClusterGroup
      chunkedLoading
      showCoverageOnHover={false}
      spiderfyOnMaxZoom={true}
      maxClusterRadius={50}
    >
      {suppliers.map((supplier) => {
        const color = LEVEL_COLORS[supplier.cooperationLevel] ?? LEVEL_COLORS.INITIAL_CONTACT;
        return (
          <Marker
            key={supplier.id}
            position={[supplier.latitude, supplier.longitude]}
            icon={makeDotIcon(color, size)}
          >
            <Popup minWidth={240} maxWidth={300}>
              <SupplierPopup
                supplier={supplier}
                locale={locale}
                tLevel={tLevel}
                t={t}
              />
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

// ─── 弹窗组件 ─────────────────────────────────────────────────
function SupplierPopup({
  supplier,
  locale,
  tLevel,
  t,
}: {
  supplier: Supplier;
  locale: string;
  tLevel: (k: string) => string;
  t: (k: string) => string;
}) {
  const name = pickLocalized(supplier.nameZh, supplier.nameRu, locale);
  const address =
    pickLocalized(supplier.provinceZh, supplier.provinceRu, locale) +
    ' / ' +
    pickLocalized(supplier.cityZh, supplier.cityRu, locale) +
    (supplier.addressZh
      ? ' / ' + pickLocalized(supplier.addressZh, supplier.addressRu, locale)
      : '');
  const mainProducts =
    supplier.mainProductsZh
      ? pickLocalized(supplier.mainProductsZh, supplier.mainProductsRu, locale)
      : null;
  const pc = supplier.primaryContact;
  const pcMethods = pc
    ? [
        pc.phone && { label: t('contactPhone'), v: pc.phone },
        pc.wechat && { label: t('contactWechat'), v: pc.wechat },
        pc.email && { label: t('contactEmail'), v: pc.email },
        pc.whatsapp && { label: 'WhatsApp', v: pc.whatsapp },
        pc.telegram && { label: 'Telegram', v: pc.telegram },
        pc.qq && { label: 'QQ', v: pc.qq },
      ].filter(Boolean) as { label: string; v: string }[]
    : [];

  return (
    <div className="text-sm" style={{ minWidth: 220 }}>
      {/* 头:logo + 公司名 */}
      <div className="flex items-center gap-2 mb-1">
        {supplier.logoFileId && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/files/${supplier.logoFileId}?thumb=1`}
            alt=""
            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
          />
        )}
        <a
          href={`/suppliers/${supplier.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground hover:underline"
          style={{ color: '#1c1c1c' }}
        >
          {name}
        </a>
      </div>

      {/* 地址 */}
      <div className="text-gray-600" style={{ fontSize: 12 }}>{address}</div>

      {/* 合作深度 */}
      <div className="text-gray-500" style={{ fontSize: 12, marginTop: 4 }}>
        {tLevel(supplier.cooperationLevel)}
      </div>

      {/* 标签 */}
      {supplier.supplierTags.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {supplier.supplierTags.map((st) => (
            <span
              key={st.tagId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '1px 6px',
                borderRadius: 4,
                background: '#f5f5f5',
                fontSize: 11,
                color: '#333',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: st.tag.color ?? '#9ca3af',
                }}
              />
              {pickLocalized(st.tag.nameZh, st.tag.nameRu, locale)}
            </span>
          ))}
        </div>
      )}

      {/* 主营产品 */}
      {mainProducts && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          <span style={{ color: '#888' }}>{t('mainProducts')}:</span>{' '}
          <span style={{ color: '#1c1c1c' }}>{mainProducts}</span>
        </div>
      )}

      {/* 计数 */}
      <div className="flex gap-3 mt-2" style={{ fontSize: 12 }}>
        <span style={{ color: '#888' }}>
          {t('contactsCount')}: <strong style={{ color: '#1c1c1c' }}>{supplier._count.contacts}</strong>
        </span>
        <span style={{ color: '#888' }}>
          {t('quotesCount')}: <strong style={{ color: '#1c1c1c' }}>{supplier._count.quotes}</strong>
        </span>
        <span style={{ color: '#888' }}>
          {t('transactionsCount')}: <strong style={{ color: '#1c1c1c' }}>{supplier._count.transactions}</strong>
        </span>
      </div>

      {/* 主联系人 + 联系方式 */}
      {pc && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {t('primaryContact')}: {pickLocalized(pc.nameZh, pc.nameRu, locale)}
          </div>
          {pcMethods.length > 0 && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              {pcMethods.map((m, i) => (
                <div key={i}>
                  <span style={{ color: '#888' }}>{m.label}:</span> {m.v}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}