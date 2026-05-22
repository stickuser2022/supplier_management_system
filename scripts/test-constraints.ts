import 'dotenv/config';
import { Prisma } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('━━━━━━━━ 约束护栏测试 ━━━━━━━━\n');

  // ---------- 前置数据 ----------
  console.log('--- 准备前置数据 ---');

  const user = await prisma.user.upsert({
    where: { username: 'test_admin' },
    update: {},
    create: {
      username: 'test_admin',
      passwordHash: 'test',
      role: 'ADMIN',
    },
  });
  console.log(`✓ User id=${user.id}`);

  const supplier = await prisma.supplier.upsert({
    where: { code: 'TEST-001' },
    update: {},
    create: {
      code: 'TEST-001',
      nameZh: '测试供应商',
      provinceZh: '广东',
      cityZh: '广州',
      latitude: 23.13,
      longitude: 113.27,
      discoveredVia: '脚本测试',
      createdById: user.id,
    },
  });
  console.log(`✓ Supplier id=${supplier.id}`);

  const tag = await prisma.tag.upsert({
    where: { category_nameZh: { category: 'PRODUCT', nameZh: '测试品类' } },
    update: {},
    create: {
      category: 'PRODUCT',
      nameZh: '测试品类',
      nameRu: 'Тест',
      createdById: user.id,
    },
  });
  console.log(`✓ Tag id=${tag.id}\n`);

  // ---------- Test 1: FK 违反 (P2003) ----------
  console.log('--- Test 1: contact.supplierId=99999 (不存在) → 期望 P2003 ---');
  try {
    await prisma.contact.create({
      data: {
        nameZh: '测试联系人',
        supplierId: 99999,
        createdById: user.id,
      },
    });
    console.error('❌ 失败:本应报 P2003,却插入成功\n');
    process.exit(1);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2003') {
        console.log(`✅ 捕到 P2003 (外键违反)\n`);
      } else {
        console.error(`❌ 期望 P2003,实际 ${e.code}\n${e.message}\n`);
        process.exit(1);
      }
    } else {
      throw e;
    }
  }

  // ---------- Test 2: SupplierTag 复合主键冲突 (P2002) ----------
  console.log('--- Test 2: 重复 (supplierId, tagId) → 期望 P2002 ---');

  // 清理上次跑剩下的(如果有),保证起点干净
  await prisma.supplierTag.deleteMany({
    where: { supplierId: supplier.id, tagId: tag.id },
  });

  // 先成功插一条
  await prisma.supplierTag.create({
    data: { supplierId: supplier.id, tagId: tag.id },
  });

  // 再插完全相同的,应报错
  try {
    await prisma.supplierTag.create({
      data: { supplierId: supplier.id, tagId: tag.id },
    });
    console.error('❌ 失败:本应报 P2002,却插入成功\n');
    process.exit(1);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        console.log(`✅ 捕到 P2002 (复合主键冲突)\n`);
      } else {
        console.error(`❌ 期望 P2002,实际 ${e.code}\n${e.message}\n`);
        process.exit(1);
      }
    } else {
      throw e;
    }
  }

  // ---------- Test 3: Tag (category, nameZh) 唯一约束 (P2002) ----------
  console.log('--- Test 3: 同 category 下重复 nameZh → 期望 P2002 ---');
  try {
    await prisma.tag.create({
      data: {
        category: 'PRODUCT',
        nameZh: '测试品类',       // 跟前置 tag 重名
        nameRu: 'Тест-другой',   // 故意换 ru,排除 (category, nameRu) 干扰
        createdById: user.id,
      },
    });
    console.error('❌ 失败:本应报 P2002,却插入成功\n');
    process.exit(1);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        console.log(`✅ 捕到 P2002 (Tag (category, nameZh) 唯一约束)\n`);
      } else {
        console.error(`❌ 期望 P2002,实际 ${e.code}\n${e.message}\n`);
        process.exit(1);
      }
    } else {
      throw e;
    }
  }

  console.log('━━━━━━━━ ✅ 三个 invariant 全部验证通过 ━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });