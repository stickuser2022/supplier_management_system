'use client';

import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

type Supplier = {
  id: number;
  nameZh: string;
  cityZh: string;
  provinceZh: string;
  latitude: number;
  longitude: number;
  cooperationLevel: string;
};

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  STRATEGIC:       { label: '战略合作', color: '#b91c1c' },
  REGULAR:         { label: '常规合作', color: '#ef4444' },
  TRIAL_ORDER:     { label: '试单阶段', color: '#f97316' },
  INITIAL_CONTACT: { label: '初步接触', color: '#eab308' },
  INACTIVE:        { label: '已暂停',   color: '#9ca3af' },
};

export default function MapView({ suppliers }: { suppliers: Supplier[] }) {
  // 当前选中的合作深度,null 表示"显示全部"
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);//selectedLevel 是个便利贴,初始值 null(显示全部)。当用户点击图例时,更新这个值,React 就会重画组件,用新的 selectedLevel 过滤供应商列表。

  // 按当前选中级别过滤
  const filteredSuppliers =
    selectedLevel === null
      ? suppliers
      : suppliers.filter((s) => s.cooperationLevel === selectedLevel);

  // 统计每个级别的供应商数量(显示在图例后面)
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
          url="https://mt1.google.com/vt/lyrs=m&hl=zh-CN&x={x}&y={y}&z={z}"
          attribution="&copy; Google"
        />
        {filteredSuppliers.map((supplier) => {
          const cfg = LEVEL_CONFIG[supplier.cooperationLevel] ?? LEVEL_CONFIG.INITIAL_CONTACT;
          return (
            <CircleMarker
              key={supplier.id}
              center={[supplier.latitude, supplier.longitude]}
              radius={8}
              pathOptions={{
                color: cfg.color,
                fillColor: cfg.color,
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{supplier.nameZh}</div>
                  <div className="text-gray-600">
                    {supplier.provinceZh} · {supplier.cityZh}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{cfg.label}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* 右上角图例(可点击筛选) */}
      <div className="absolute top-4 right-4 z-1000 bg-white/95 rounded-lg shadow-md p-3 text-sm min-w-160px">
        <div className="font-semibold mb-2 text-gray-700 flex justify-between items-center">
          <span>合作深度</span>
          {selectedLevel !== null && (
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-xs text-blue-600 hover:underline font-normal"
            >
              清除筛选
            </button>
          )}
        </div>
        {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => {
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
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-gray-600 flex-1">{cfg.label}</span>
              <span className="text-gray-400 text-xs">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

//这是本批最重要的概念,.map() 渲染列表——React 里画"一串相似东西"(供应商列表、表格行、菜单项)的标准做法。
//读法:"对每一个 supplier,生成一个 <CircleMarker>"。
//两个细节:

//key={supplier.id} —— React 硬要求,告诉它"哪个组件对应哪条数据",删除/更新时不会乱。忘了写 key 会有警告,以后写列表条件反射加上。
//<Popup> 写在 <CircleMarker> 里面 —— Leaflet 的约定:"弹窗是属于这个标记的",所以用嵌套表达从属关系。同理以后还会有 <Tooltip>(鼠标悬浮提示)。

//pathOptions={{ color, fillColor, fillOpacity, weight }} 是 Leaflet 的画笔参数——边框色、填充色、透明度、线宽。完全不用记,改颜色时回查就行。
//新概念:useState(React 的"记忆"机制)到目前为止,我们写的组件都是"渲染完就完事"——给什么数据画什么。但现在地图要"记住"用户点了哪个级别,下次点别处时还得知道当前状态是啥。
//打个比方:useState 就像组件随身带的小便利贴。组件挂载时撕一张贴纸,写上初始值;用户点击后改写贴纸内容,React 看见贴纸变了,自动把组件重画一遍。