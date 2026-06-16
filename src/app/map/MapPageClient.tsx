'use client';

import dynamic from 'next/dynamic';
import { SupplierSearchAndFilter } from '../suppliers/_components/SupplierSearchAndFilter';
import type { COOPERATION_LEVELS } from '../suppliers/_validations/supplier-schema';

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

type TagOption = {
  id: number;
  category: 'PRODUCT' | 'EXPORT' | 'CERT' | 'CAPACITY' | 'CUSTOM';
  nameZh: string;
  nameRu: string;
  color: string | null;
};

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-gray-500">
      加载地图中...
    </div>
  ),
});

export default function MapPageClient({
  suppliers,
  allTags,
  locale,
  initialQ,
  initialTagIds,
  initialLevel,
}: {
  suppliers: Supplier[];
  allTags: TagOption[];
  locale: string;
  initialQ: string;
  initialTagIds: number[];
  initialLevel: (typeof COOPERATION_LEVELS)[number] | null;
}) {
  return (
    <div className="flex flex-col h-screen">
      {/* 搜索 + 筛选条 */}
      <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <SupplierSearchAndFilter
          initialQ={initialQ}
          initialTagIds={initialTagIds}
          initialLevel={initialLevel}
          allTags={allTags}
          locale={locale}
        />
      </div>

      {/* 地图占满剩余高度 */}
      <div className="flex-1 min-h-0">
        <MapView suppliers={suppliers} />
      </div>
    </div>
  );
}
