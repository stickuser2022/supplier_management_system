/**
 * 翻译回填脚本
 *
 * 跑法: npx tsx scripts/backfill-translations.ts
 *
 * 行为:
 * - 扫描 7 张表的所有"双语三件套"字段
 * - _zh 有值 + _ru_auto_translated 不是 false → 翻译并入库
 * - _ru_auto_translated = false(Admin 手改过)→ 跳过,保护人工修正
 * - 空表自然跳过
 * - 单字段翻译失败 → 记录到失败列表继续,末尾汇总
 * - 幂等:重复跑只会再翻"标记 true"的字段,Admin 改过的(false)永远不动
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { translate } from '../src/lib/translate';

/** 7 张表的三件套字段清单:[中文字段名, 俄文字段名, 自动翻译标记字段名] */
const TABLES: Array<{
  modelName: string;
  displayName: string;
  fields: Array<[string, string, string]>;
}> = [
  {
    modelName: 'supplier',
    displayName: '供应商 (Supplier)',
    fields: [
      ['nameZh', 'nameRu', 'nameRuAutoTranslated'],
      ['shortNameZh', 'shortNameRu', 'shortNameRuAutoTranslated'],
      ['provinceZh', 'provinceRu', 'provinceRuAutoTranslated'],
      ['cityZh', 'cityRu', 'cityRuAutoTranslated'],
      ['districtZh', 'districtRu', 'districtRuAutoTranslated'],
      ['addressZh', 'addressRu', 'addressRuAutoTranslated'],
      ['descriptionZh', 'descriptionRu', 'descriptionRuAutoTranslated'],
    ],
  },
  {
    modelName: 'contact',
    displayName: '联系人 (Contact)',
    fields: [
      ['nameZh', 'nameRu', 'nameRuAutoTranslated'],
      ['roleZh', 'roleRu', 'roleRuAutoTranslated'],
    ],
  },
  {
    modelName: 'quote',
    displayName: '报价 (Quote)',
    fields: [
      ['productNameZh', 'productNameRu', 'productNameRuAutoTranslated'],
      ['productSpecZh', 'productSpecRu', 'productSpecRuAutoTranslated'],
    ],
  },
  {
    modelName: 'transactionItem',
    displayName: '订单明细 (TransactionItem)',
    fields: [
      ['productNameZh', 'productNameRu', 'productNameRuAutoTranslated'],
      ['productSpecZh', 'productSpecRu', 'productSpecRuAutoTranslated'],
    ],
  },
  {
    modelName: 'transaction',
    displayName: '订单 (Transaction)',
    fields: [['notesZh', 'notesRu', 'notesRuAutoTranslated']],
  },
  {
    modelName: 'payment',
    displayName: '付款 (Payment)',
    fields: [['purposeZh', 'purposeRu', 'purposeRuAutoTranslated']],
  },
  {
    modelName: 'file',
    displayName: '文件 (File)',
    fields: [['titleZh', 'titleRu', 'titleRuAutoTranslated']],
  },
];

interface Failure {
  table: string;
  recordId: number;
  field: string;
  text: string;
  error: string;
}

const failures: Failure[] = [];
let successCount = 0;
let skipCount = 0;

async function main() {
  console.log('🚀 开始回填翻译\n');

  for (const table of TABLES) {
    await backfillTable(table);
  }

  // 汇总报告
  console.log('\n' + '═'.repeat(60));
  console.log('📊 回填完成');
  console.log('═'.repeat(60));
  console.log(`  ✅ 翻译成功: ${successCount} 字段`);
  console.log(`  ⏭️  跳过:    ${skipCount} 字段(无中文 / Admin 手改过)`);
  console.log(`  ❌ 失败:    ${failures.length} 字段`);

  if (failures.length > 0) {
    console.log('\n失败明细:');
    for (const f of failures) {
      console.log(`  [${f.table} #${f.recordId}] ${f.field} = "${f.text}"`);
      console.log(`    原因: ${f.error}`);
    }
  }
}

async function backfillTable(table: (typeof TABLES)[number]) {
  console.log(`\n📂 ${table.displayName}`);

  // any 在脚本里是合理的 escape hatch,详见末尾讲解
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[table.modelName];
  const rows = await model.findMany();

  if (rows.length === 0) {
    console.log('   (空表,跳过)');
    return;
  }

  console.log(`   找到 ${rows.length} 条记录,翻译中:`);

  for (const row of rows) {
    await backfillRow(table, row, model);
  }
  console.log(''); // 换行结束当前表的进度条
}

async function backfillRow(
  table: (typeof TABLES)[number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
) {
  const updateData: Record<string, string> = {};

  for (const [zhField, ruField, autoFlagField] of table.fields) {
    const zhValue = row[zhField];
    const autoFlag = row[autoFlagField];

    // 决策点 1 (B 选项) 的具体实现:
    if (!zhValue) {
      skipCount++;
      continue; // 中文为空,无源数据
    }
    if (autoFlag === false) {
      skipCount++;
      continue; // Admin 手改过,永久保留,绝不覆盖
    }

    try {
      const ruValue = await translate(zhValue, 'zh', 'ru');
      updateData[ruField] = ruValue;
      successCount++;
      process.stdout.write('.'); // 一个点 = 一字段成功
    } catch (err) {
      failures.push({
        table: table.displayName,
        recordId: row.id,
        field: zhField,
        text: String(zhValue).slice(0, 50),
        error: err instanceof Error ? err.message : String(err),
      });
      process.stdout.write('x'); // 一个 x = 一字段失败
    }
  }

  // 单次 update 写所有翻好的字段(批量 vs 每字段单次往返)
  if (Object.keys(updateData).length > 0) {
    await model.update({
      where: { id: row.id },
      data: updateData,
    });
  }
}

main()
  .catch(err => {
    console.error('\n❌ 脚本崩溃:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());