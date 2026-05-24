import 'dotenv/config';
import { Prisma } from '../src/generated/prisma/client'; // 调用我们的数据模型,P 大写
import { prisma } from '../src/lib/prisma';              // 这里的 p 是小写

// async function main() {...} 只是"画图纸",真正执行的是下面的
// main().catch().finally() 这一段。把测试逻辑写在 main() 里,让它成为
// 一个独立单元,结构更清晰,也方便单独调用。
async function main() {
  console.log('━━━━━━━━ 约束护栏测试 ━━━━━━━━\n');

  // ---------- 前置数据 ----------
  console.log('--- 准备前置数据 ---');

  // upsert:有就用,没有就新建
  // await = "停在这,等 Prisma 干完事返回结果,再继续往下"
  // async/await 是语法糖,让我们用同步的方式写异步代码
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

  // category_nameZh 是 schema 里 @@unique([category, nameZh]) 自动生成的
  // 复合唯一 key,upsert 的 where 要同时提供这两个字段才能联合定位唯一记录
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

  // Quote 表没有合适的 @@unique 约束做幂等定位,所以只能用 create,
  // 每次跑都新插一条。测试本身不需要幂等,所以 OK。
  const quote = await prisma.quote.create({
    data: {
      supplierId: supplier.id,
      contactId: null,
      productNameZh: '测试产品',
      unitPrice: 100,
      currency: 'CNY',
      quotedAt: new Date(),
      createdById: user.id,
    },
  });
  console.log(`✓ Quote id=${quote.id}\n`);


  // ---------- Test 1: Quote.supplierId 指向不存在的 Supplier → P2003 ----------
  console.log('--- Test 1: quote.supplierId=99999 (不存在) → 期望 P2003 ---');
  // try 是 JS 的异常捕获机制:执行可能抛错的代码,抛错就跳到 catch 处理。
  // 这里尝试插入一条 quote,supplierId=99999,该 ID 在前置数据里没创建过,
  // 违反外键约束,应该抛出 P2003。
  try {
    await prisma.quote.create({
      data: {
        productNameZh: '测试产品',
        contactId: null,
        unitPrice: 100,
        currency: 'CNY',
        supplierId: 99999,
        quotedAt: new Date(),
        createdById: user.id,
      },
    });
    console.error('❌ 失败:本应报 P2003,却插入成功\n');
    process.exit(1); // 立即结束 Node 进程,用退出码 1 退出
  } catch (e) { // try 块出错了,把错对象给我处理
    // instanceof 是 JS 语法,问 "e 是不是 PrismaClientKnownRequestError 这个类的实例?"
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // e.code 是错对象上的字符串属性,Prisma 抛错都带 code 字段,用来精准定位错误类型
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

  // ---------- Test 2: QuoteTag 复合主键冲突 (P2002) ----------
  console.log('--- Test 2: 重复 (quoteId, tagId) → 期望 P2002 ---');

  // 清理上次跑剩下的(如果有),保证起点干净
  await prisma.quoteTag.deleteMany({
    where: { quoteId: quote.id, tagId: tag.id },
  });

  // 先成功插一条
  await prisma.quoteTag.create({
    data: { quoteId: quote.id, tagId: tag.id },
  });

  // 再插完全相同的,应报错
  try {
    await prisma.quoteTag.create({
      data: { quoteId: quote.id, tagId: tag.id },
    });
    console.error('❌ 失败:本应报 P2002,却插入成功\n');
    process.exit(1);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        console.log(`✅ 捕到 P2002 (QuoteTag 复合主键冲突)\n`);
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

// 真正的入口:调用 main() 执行测试逻辑
main()
  // 接住 main 里没用 try 包住的任何错(包括内层 throw e 抛上来的),最后一道防线
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  })
  // 无论成功失败都要执行的收尾,断开数据库连接保证进程能干净结束
  .finally(async () => {
    await prisma.$disconnect();
  });