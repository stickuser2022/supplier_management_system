/**
 * 翻译抽象层亮灯测试
 *
 * 跑法: npx tsx scripts/test-translate.ts
 *
 * 看到俄文输出 = 链路通了
 * 报错 = 链路某处有断点
 */

import 'dotenv/config'; // 必须在所有 import 之前(CLAUDE.md 阶段 1 笔记)
import { translate, translateBatch } from '../src/lib/translate';

async function main() {
  console.log('--- 单条翻译 ---');
  console.log('广州 →', await translate('广州', 'zh', 'ru'));

  console.log('\n--- 批量翻译(一次 API 调用,7 条) ---');
  const texts = [
    '广州',                                        // 城市
    '广东省',                                      // 省份
    '天河区',                                      // 区
    '广州金辉玩具有限公司',                          // 公司全名
    '金辉玩具',                                    // 简称
    '广州市天河区珠江新城花城大道 88 号',              // 详细地址
    '主营毛绒玩具与塑料玩具,有出口欧盟经验',           // 描述(短文)
  ];

  const reqs = texts.map(t => ({
    text: t,
    from: 'zh' as const,
    to: 'ru' as const,
  }));

  const results = await translateBatch(reqs);

  texts.forEach((zh, i) => {
    console.log(`  ${zh}  →  ${results[i]}`);
  });
}

main().catch(err => {
  console.error('❌ 翻译失败:', err);
  process.exit(1);
});