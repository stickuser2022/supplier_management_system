import { prisma } from '@/lib/prisma';

// 把数据库里的枚举名翻译成中文,在 JSX 里查表用
const COOPERATION_LEVEL_LABEL = {
  STRATEGIC: '战略合作',
  REGULAR: '常规合作',
  TRIAL_ORDER: '试单阶段',
  INITIAL_CONTACT: '初步接触',
  INACTIVE: '已暂停',
} as const;//as const —— TypeScript 的"严格只读"标记,写在对象后面,告诉 TS:"这个对象不会改、值都是固定字符串"。让类型推导更精准。不深究,记住"映射表后面写 as const"是好习惯就行。

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">供应商列表</h1>
      <p className="mb-4 text-gray-600">共 {suppliers.length} 条</p>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-50">{/* 表头固定在顶部 */}
          <tr>
            <th className="border p-2 text-left">编号</th>
            <th className="border p-2 text-left">名称</th>
            <th className="border p-2 text-left">省 / 市</th>
            <th className="border p-2 text-left">合作深度</th>
            <th className="border p-2 text-left">创建时间</th>
          </tr>
        </thead>
        <tbody>
           {/* tbody数据区,tr数据行,td数据单元格,.map() —— 数组循环渲染,这里的 s 就是循环时当前这个供应商对象，相当于数组里的每一条数据 */}
          {suppliers.map((s) => (
            <tr key={s.id}>{/* 这是 React 的硬性要求:用 .map 渲染列表时,每一项必须有一个唯一的 key */}
              <td className="border p-2">{s.code}</td>
              <td className="border p-2">{s.nameZh}</td>
              <td className="border p-2">{s.provinceZh} / {s.cityZh}</td>
              <td className="border p-2">{COOPERATION_LEVEL_LABEL[s.cooperationLevel]}</td>
                                {/* JS 的用变量查对象的写法，用 [] 方括号把变量名放进去,拿数据库的英文值，当作钥匙，去字典里找对应的中文值 */}
              <td className="border p-2">{s.createdAt.toLocaleDateString('zh-CN')}</td>
                                {/* toLocaleDateString 格式化成中文日期，如 2026/6/2 */}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}