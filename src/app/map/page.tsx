import { prisma } from '@/lib/prisma';
import MapPageClient from './MapPageClient';

export default async function MapPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameZh: true,
      cityZh: true,
      provinceZh: true,
      latitude: true,
      longitude: true,
      cooperationLevel: true,
    },
  });

  return (
    <div className="h-screen w-screen">
      <MapPageClient suppliers={suppliers} />
    </div>
  );
}
//这段你 /suppliers 页面其实已经写过类似的,核心套路就两件事:
//await prisma.<表名>.findMany(...) —— 查表的标准句式,以后所有页面都这么开头
//select: { ... } —— 只取你需要的字段,不取一整行(性能 + 类型都更清爽)
//where: { isActive: true } 是软删除过滤——不显示已"删除"的供应商。这是 CLAUDE.md 里定下的统一规则,以后查任何业务表都要带上这一条。