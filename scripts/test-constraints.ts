import 'dotenv/config';
import { Prisma } from '../src/generated/prisma/client';
import { prisma } from '../src/lib/prisma';

// async function main() {...} 只是"画图纸",真正执行的是下面的
// main().catch().finally() 这一段。把测试逻辑写在 main() 里,让它成为
// 一个独立单元,结构更清晰,也方便单独调用。
async function main() {
  console.log('━━━━━━━━ 约束护栏测试 ━━━━━━━━\n');

  // ---------- 前置数据 ----------
  console.log('--- 准备前置数据 ---');

  // upsert:有就用,没有就新建
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

  // category_nameZh 是 schema 里 @@unique([category, nameZh]) 自动生成的复合唯一 key
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
  console.log(`✓ Tag id=${tag.id}`);

  // Quote 没合适的 @@unique 做幂等定位,只能 create,每次跑都新插一条
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
        nameZh: '测试品类',        // 跟前置 tag 重名
        nameRu: 'Тест-другой',    // 故意换 ru,排除 (category, nameRu) 干扰
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


  // ============================================================
  // Test 4-6:第三组新增的 invariant。
  // 验证模式从"负向(期望抛 P 错误码)"切换为"正向断言":
  //   1) 准备临时数据 → 2) 物理删除主表 → 3) findUnique / count 验证状态
  //   → 4) 自清理(若 Cascade 主表已带走附属物,通常不需要额外清理)
  // ============================================================


  // ---------- Test 4: Transaction 主从模型 Cascade 链 ----------
  console.log('--- Test 4: 删 Transaction → Item / Payment / File 应被级联清空 ---');

  // 准备:1 Transaction + 2 Item + 2 Payment + 1 File 全挂在它下面
  const tx = await prisma.transaction.create({
    data: {
      supplierId: supplier.id,
      orderedAt: new Date(),
      totalAmount: 1000,
      currency: 'CNY',
      createdById: user.id,
    },
  });

  // createMany:批量插入,SQLite 在 Prisma 5+ 已原生支持
  await prisma.transactionItem.createMany({
    data: [
      { transactionId: tx.id, productNameZh: '产品A', quantity: 10, unitPrice: 50,  subtotal: 500 },
      { transactionId: tx.id, productNameZh: '产品B', quantity: 5,  unitPrice: 100, subtotal: 500 },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { transactionId: tx.id, paidAt: new Date(), amount: 300, currency: 'CNY', createdById: user.id },
      { transactionId: tx.id, paidAt: new Date(), amount: 700, currency: 'CNY', createdById: user.id },
    ],
  });

  const file = await prisma.file.create({
    data: {
      transactionId: tx.id,
      type: 'TRANSACTION_DOC',
      fileName: 'test.pdf',
      storageKey: `test/transactions/${tx.id}/test.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      createdById: user.id,
    },
  });
  console.log(`✓ 准备:tx=${tx.id}, 2 items, 2 payments, file=${file.id}`);

  // 触发:物理删除主表
  await prisma.transaction.delete({ where: { id: tx.id } });

  // 断言:三类附属物应全被级联清掉
  // count 返回符合条件的行数;findUnique 按主键找,找不到返回 null
  const remainingItems    = await prisma.transactionItem.count({ where: { transactionId: tx.id } });
  const remainingPayments = await prisma.payment.count({ where: { transactionId: tx.id } });
  const remainingFile     = await prisma.file.findUnique({ where: { id: file.id } });

  if (remainingItems === 0 && remainingPayments === 0 && remainingFile === null) {
    console.log(`✅ Cascade 链生效:items / payments / file 全被清空\n`);
  } else {
    console.error(`❌ 期望全为 0,实际 items=${remainingItems}, payments=${remainingPayments}, file=${remainingFile ? '残留' : 'null'}\n`);
    process.exit(1);
  }


  // ---------- Test 5: File 表多挂载点(可空 FK + Cascade) ----------
  console.log('--- Test 5: File 仅 quoteId 非空,删 Quote → File 应被级联清掉 ---');

  // 临时 Quote(独立于前置 quote,避免影响 Test 2 的 QuoteTag 关联)
  const quoteForFile = await prisma.quote.create({
    data: {
      supplierId: supplier.id,
      productNameZh: '临时报价(Test 5)',
      unitPrice: 200,
      currency: 'CNY',
      quotedAt: new Date(),
      createdById: user.id,
    },
  });

  // 关键:5 个 FK 中只 quoteId 非空,模拟"报价图挂在 Quote 下"场景
  const quoteImage = await prisma.file.create({
    data: {
      supplierId: null,
      quoteId: quoteForFile.id,
      paymentId: null,
      noteId: null,
      transactionId: null,
      type: 'QUOTE_IMAGE',
      fileName: 'product.jpg',
      storageKey: `test/quotes/${quoteForFile.id}/product.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      createdById: user.id,
    },
  });
  console.log(`✓ 准备:quote=${quoteForFile.id}, file=${quoteImage.id} (仅 quoteId 非空)`);

  await prisma.quote.delete({ where: { id: quoteForFile.id } });

  const orphanFile = await prisma.file.findUnique({ where: { id: quoteImage.id } });
  if (orphanFile === null) {
    console.log(`✅ Cascade 生效:可空 FK 组合中,删唯一挂载点 (Quote) 仍能级联清掉 File\n`);
  } else {
    console.error(`❌ 期望 File 被清掉,但仍能查到 (id=${orphanFile.id})\n`);
    process.exit(1);
  }


  // ---------- Test 6: TransactionItem.quoteId 业务链条上下文(SetNull) ----------
  console.log('--- Test 6: 删 Quote → 关联的 TransactionItem 应保留,quoteId 置 null ---');

  // 临时 quote + 临时 transaction + 一个挂在两者之间的 item
  const quoteForItem = await prisma.quote.create({
    data: {
      supplierId: supplier.id,
      productNameZh: '临时报价(Test 6)',
      unitPrice: 300,
      currency: 'CNY',
      quotedAt: new Date(),
      createdById: user.id,
    },
  });

  const tx2 = await prisma.transaction.create({
    data: {
      supplierId: supplier.id,
      orderedAt: new Date(),
      totalAmount: 600,
      currency: 'CNY',
      createdById: user.id,
    },
  });

  // 关键:item.unitPrice=290 ≠ quote.unitPrice=300,
  // 模拟"谈判后的实际成交价",验证设计意图——价格以 item 自身为准,不读 quote
  const item = await prisma.transactionItem.create({
    data: {
      transactionId: tx2.id,
      quoteId: quoteForItem.id,
      productNameZh: '成交产品',
      quantity: 2,
      unitPrice: 290,
      subtotal: 580,
    },
  });
  console.log(`✓ 准备:quote=${quoteForItem.id}, tx=${tx2.id}, item=${item.id}`);

  await prisma.quote.delete({ where: { id: quoteForItem.id } });

  const itemAfter = await prisma.transactionItem.findUnique({ where: { id: item.id } });
  if (itemAfter === null) {
    console.error(`❌ TransactionItem 不该被级联删除,但已消失\n`);
    process.exit(1);
  } else if (itemAfter.quoteId !== null) {
    console.error(`❌ 期望 quoteId=null,实际=${itemAfter.quoteId}\n`);
    process.exit(1);
  } else {
    console.log(`✅ SetNull 生效:item 保留(成交事件不消失),quoteId 已置空\n`);
  }

  // 清理:Test 6 的临时 transaction 不会被 Cascade 自动清,手动删(顺便带走 item)
  await prisma.transaction.delete({ where: { id: tx2.id } });


  console.log('━━━━━━━━ ✅ 六个 invariant 全部验证通过 ━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });