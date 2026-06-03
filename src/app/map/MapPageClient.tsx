'use client';

import dynamic from 'next/dynamic';

type Supplier = {
  id: number;
  nameZh: string;
  cityZh: string;
  provinceZh: string;
  latitude: number;
  longitude: number;
  cooperationLevel: string;
};
//type Supplier = { ... } —— 给"供应商对象"起个类型名。告诉 TypeScript "这种对象有这些字段,每个字段是什么类型"。好处是后面用 supplier.nameZh 时 IDE 会自动补全,字段名打错立刻红线。

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-gray-500">
      加载地图中...
    </div>
  ),
});

export default function MapPageClient({ suppliers }: { suppliers: Supplier[] }) {
  return <MapView suppliers={suppliers} />;
}
//{ suppliers }: { suppliers: Supplier[] } —— 这一行同时做了两件事:解构出 suppliers 变量 + 标注它是 Supplier 数组。冒号左边是 JS 解构语法,右边是 TS 类型。