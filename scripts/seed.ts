import 'dotenv/config';// // 把 .env 里的数据库连接串等加载到 process.env
import { prisma } from '../src/lib/prisma';//prisma：封装好的 Prisma Client 实例，用来操作数据库
import { auth } from '../src/lib/auth';

// ============================================================
// Seed 数据定义(集中在顶部,方便日后调整)
// ============================================================

const TAGS_PRODUCT = [//这是标签的静态数组，seed 会用它来创建系统标签(如果已存在同名标签则跳过)。每个标签包含中文名和俄文名。
  { nameZh: '玩具',     nameRu: 'Игрушки' },
  { nameZh: '纺织',     nameRu: 'Текстиль' },
  { nameZh: '五金',     nameRu: 'Метизы' },
  { nameZh: '电子',     nameRu: 'Электроника' },
  { nameZh: '食品',     nameRu: 'Продукты' },
  { nameZh: '家居',     nameRu: 'Дом' },
  { nameZh: '服装',     nameRu: 'Одежда' },
  { nameZh: '玻璃制品', nameRu: 'Стекло' },
];

interface SeedSupplier {//然后 SUPPLIERS 数组列举了 12 个供应商的 seed 数据。
  code: string;
  nameZh: string;
  nameRu?: string;
  provinceZh: string;
  cityZh: string;
  latitude: number;
  longitude: number;
  cooperationLevel: 'STRATEGIC' | 'REGULAR' | 'TRIAL_ORDER' | 'INITIAL_CONTACT' | 'INACTIVE';
  tags: string[];           // 关联 PRODUCT 标签(nameZh 引用)
  contactName: string;      // 主联系人姓名
  contactPhone: string;
  quotes?: Array<{ productNameZh: string; unitPrice: number; quotedAt: Date }>;
}

const SUPPLIERS: SeedSupplier[] = [
  {
    code: 'GZ-001', nameZh: '广州金辉玩具', nameRu: 'Гуанчжоу Цзиньхуэй Игрушки',
    provinceZh: '广东', cityZh: '广州', latitude: 23.13, longitude: 113.27,
    cooperationLevel: 'STRATEGIC', tags: ['玩具'],
    contactName: '李经理', contactPhone: '13800000001',
    quotes: [
      { productNameZh: '塑料玩具熊 30cm', unitPrice: 8.5,  quotedAt: new Date('2026-03-15') },
      { productNameZh: '搪胶娃娃 25cm',   unitPrice: 12.0, quotedAt: new Date('2026-04-02') },
    ],
  },
  {
    code: 'DG-001', nameZh: '东莞五金联合',
    provinceZh: '广东', cityZh: '东莞', latitude: 23.02, longitude: 113.75,
    cooperationLevel: 'REGULAR', tags: ['五金'],
    contactName: '陈经理', contactPhone: '13800000002',
    quotes: [{ productNameZh: '不锈钢挂钩 5cm', unitPrice: 0.8, quotedAt: new Date('2026-02-20') }],
  },
  {
    code: 'HZ-001', nameZh: '杭州丝绸纺织', nameRu: 'Ханчжоу Шёлк',
    provinceZh: '浙江', cityZh: '杭州', latitude: 30.27, longitude: 120.15,
    cooperationLevel: 'STRATEGIC', tags: ['纺织', '服装'],
    contactName: '王经理', contactPhone: '13800000003',
    quotes: [{ productNameZh: '真丝围巾 70x180cm', unitPrice: 85, quotedAt: new Date('2026-04-10') }],
  },
  {
    code: 'YW-001', nameZh: '义乌小商品',
    provinceZh: '浙江', cityZh: '义乌', latitude: 29.31, longitude: 120.07,
    cooperationLevel: 'REGULAR', tags: ['家居', '玩具'],
    contactName: '张经理', contactPhone: '13800000004',
    quotes: [{ productNameZh: '塑料收纳盒 30L', unitPrice: 15.5, quotedAt: new Date('2026-05-01') }],
  },
  {
    code: 'SU-001', nameZh: '苏州精密电子',
    provinceZh: '江苏', cityZh: '苏州', latitude: 31.30, longitude: 120.58,
    cooperationLevel: 'REGULAR', tags: ['电子'],
    contactName: '刘经理', contactPhone: '13800000005',
    quotes: [{ productNameZh: 'USB 数据线 1m', unitPrice: 3.2, quotedAt: new Date('2026-05-05') }],
  },
  {
    code: 'NJ-001', nameZh: '南京化工玻璃',
    provinceZh: '江苏', cityZh: '南京', latitude: 32.06, longitude: 118.80,
    cooperationLevel: 'TRIAL_ORDER', tags: ['玻璃制品'],
    contactName: '赵经理', contactPhone: '13800000006',
  },
  {
    code: 'BJ-001', nameZh: '北京华夏食品',
    provinceZh: '北京', cityZh: '北京', latitude: 39.90, longitude: 116.41,
    cooperationLevel: 'TRIAL_ORDER', tags: ['食品'],
    contactName: '孙经理', contactPhone: '13800000007',
    quotes: [{ productNameZh: '即食烤鸭 500g', unitPrice: 38, quotedAt: new Date('2026-04-20') }],
  },
  {
    code: 'XM-001', nameZh: '厦门海产出口',
    provinceZh: '福建', cityZh: '厦门', latitude: 24.48, longitude: 118.10,
    cooperationLevel: 'INITIAL_CONTACT', tags: ['食品'],
    contactName: '周经理', contactPhone: '13800000008',
  },
  {
    code: 'QZ-001', nameZh: '泉州运动服装',
    provinceZh: '福建', cityZh: '泉州', latitude: 24.87, longitude: 118.68,
    cooperationLevel: 'INITIAL_CONTACT', tags: ['服装', '纺织'],
    contactName: '吴经理', contactPhone: '13800000009',
  },
  {
    code: 'QD-001', nameZh: '青岛家电制造',
    provinceZh: '山东', cityZh: '青岛', latitude: 36.07, longitude: 120.38,
    cooperationLevel: 'INITIAL_CONTACT', tags: ['电子', '家居'],
    contactName: '郑经理', contactPhone: '13800000010',
  },
  {
    code: 'SH-001', nameZh: '上海玻璃工坊',
    provinceZh: '上海', cityZh: '上海', latitude: 31.23, longitude: 121.47,
    cooperationLevel: 'REGULAR', tags: ['玻璃制品'],
    contactName: '黄经理', contactPhone: '13800000011',
  },
  {
    code: 'CD-001', nameZh: '成都川味食品',
    provinceZh: '四川', cityZh: '成都', latitude: 30.67, longitude: 104.07,
    cooperationLevel: 'INACTIVE', tags: ['食品'],
    contactName: '何经理', contactPhone: '13800000012',
  },
];

// ============================================================
// 主流程
// ============================================================

async function main() {//main 函数是整个 seed 脚本的入口，按照步骤执行数据导入逻辑。
  console.log('━━━━━━━━ 种子数据导入 ━━━━━━━━\n');

// --- 1. admin 用户(通过 Better Auth API 创建,密码哈希存进 Account 表)---
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAfterFirstLogin!';

const existing = await prisma.user.findUnique({
  where: { username: ADMIN_USERNAME },
});

if (!existing) {
  console.log('  → 首次创建 admin(走 Better Auth signUp 流程)');
  await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: '青格力',
      username: ADMIN_USERNAME,
    },
  });
  // Better Auth 注册的新用户默认 role=EDITOR(schema 默认值),改成 ADMIN
  await prisma.user.update({
    where: { username: ADMIN_USERNAME },
    data: { role: 'ADMIN' },
  });
}

const admin = await prisma.user.findUniqueOrThrow({
  where: { username: ADMIN_USERNAME },
});
console.log(`✓ Admin user id=${admin.id}`);
if (!existing) {
  console.log('  ⚠️  首次创建 Admin 账号,密码已通过其他渠道告知');
  console.log('     登录后请立即改密码');
}

  // --- 2. PRODUCT 标签(8 个,系统预置)---
  const tagIdByName = new Map<string, number>();//创建 PRODUCT 标签
  for (const t of TAGS_PRODUCT) {
    const tag = await prisma.tag.upsert({
      where: { category_nameZh: { category: 'PRODUCT', nameZh: t.nameZh } },
      update: {},
      create: {
        category: 'PRODUCT',
        nameZh: t.nameZh,
        nameRu: t.nameRu,
        isSystem: true,
        createdById: admin.id,
      },
    });
    tagIdByName.set(t.nameZh, tag.id);
  }
  console.log(`✓ ${TAGS_PRODUCT.length} 个 PRODUCT 标签`);

  // --- 3. 供应商 + 关联表 ---//初始化计数器
  let supplierTagCount = 0;
  let contactCount = 0;
  let quoteCount = 0;

  for (const s of SUPPLIERS) {// 遍历供应商数据
    // 3.1 Supplier(按 code 唯一,已存在不动)
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },//唯一业务编号
      update: {},
      create: {//// 如果不存在，按下列字段创建
        code: s.code,
        nameZh: s.nameZh,
        nameRu: s.nameRu,
        nameRuAutoTranslated: !s.nameRu, // 有手填 nameRu 标 false,没填标 true
        provinceZh: s.provinceZh,
        cityZh: s.cityZh,
        latitude: s.latitude,
        longitude: s.longitude,
        cooperationLevel: s.cooperationLevel,
        discoveredVia: '开发期种子数据',
        createdById: admin.id,
      },
    });

    // 3.2 SupplierTag:先清掉这个 supplier 下的旧关联,再批量插入
    // (只影响这个 supplier 范围,不动其他 supplier 的标签)
    const tagIds: number[] = [];//处理标签关联
    for (const tagName of s.tags) {
      const tagId = tagIdByName.get(tagName);
      if (tagId !== undefined) tagIds.push(tagId);
    }
    if (tagIds.length > 0) {// // 先删掉这个供应商所有的旧标签关联
      await prisma.supplierTag.deleteMany({ where: { supplierId: supplier.id } });
      // 再重新插入 seed 中定义的标签关联
      await prisma.supplierTag.createMany({
        data: tagIds.map((tagId) => ({ supplierId: supplier.id, tagId })),
      });
      supplierTagCount += tagIds.length;
    }

    // 3.3 Contact:每个 supplier 1 个主联系人
    // 用 (supplierId, nameZh) findFirst 检测幂等
    const existingContact = await prisma.contact.findFirst({//插入主联系人
      where: { supplierId: supplier.id, nameZh: s.contactName },
    });
    if (!existingContact) {//没有才新建，避免重复；有则跳过
      await prisma.contact.create({
        data: {
          supplierId: supplier.id,
          nameZh: s.contactName,
          roleZh: '销售经理',
          phone: s.contactPhone,
          isPrimary: true,
          createdById: admin.id,
        },
      });
      contactCount++;
    }

    // 3.4 Quote:部分供应商有报价
    // 用 (supplierId, productNameZh, quotedAt) 三元组判断是否已存在
    if (s.quotes) {//插入报价
      for (const q of s.quotes) {
        const existing = await prisma.quote.findFirst({
          where: {
            supplierId: supplier.id,
            productNameZh: q.productNameZh,
            quotedAt: q.quotedAt,
          },
        });
        if (!existing) {
          await prisma.quote.create({
            data: {
              supplierId: supplier.id,
              productNameZh: q.productNameZh,
              unitPrice: q.unitPrice,
              currency: 'CNY',
              quotedAt: q.quotedAt,
              createdById: admin.id,
            },
          });
          quoteCount++;
        }
      }
    }
  }

  console.log(`✓ ${SUPPLIERS.length} 个供应商(upsert,已存在的保持原样)`);
  console.log(`✓ ${supplierTagCount} 条 SupplierTag 关联`);
  console.log(`✓ ${contactCount} 个新增 Contact(已存在的不重复加)`);
  console.log(`✓ ${quoteCount} 条新增 Quote(已存在的不重复加)`);

  console.log('\n━━━━━━━━ ✅ 种子数据导入完成 ━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();// 释放数据库连接
  });