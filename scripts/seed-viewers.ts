/**
 * 批量创建 Viewer 账号
 *
 * 用法:
 *   npx tsx scripts/seed-viewers.ts
 *
 * 写死了 3 个家人账号,跑一次即可。已存在的 username 会跳过,不重复创建。
 *
 * 实现细节:
 * - 直接用 better-auth 的 hashPassword 算法 hash 密码,然后写 User + Account 两条记录
 * - email 字段是假地址(better-auth schema 必填,我们没开邮箱验证所以无所谓)
 * - role=EDITOR(2026.6.15 改名,原 VIEWER):可以新建任何东西,可编辑/删除自己创建的,改不动别人的
 *
 * 关键坑(2026.6.15 踩过):better-auth username 插件**默认把 username 转小写**做 lookup
 * (源码 node_modules/better-auth/dist/plugins/username/index.mjs 里 `username.toLowerCase()`)。
 * 所以 username 字段必须存小写(供查找),原始大写形态存到 displayUsername(供显示)。
 * 否则:用户输 "Aldar" → 插件转 "aldar" → 查 username='aldar' → 表里存的是 'Aldar' → 匹配不上 → User not found。
 */
import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../src/lib/prisma';

const VIEWERS = [
  { username: 'Aldar', password: 'Aldar2026', name: 'Aldar' },
  { username: 'Artem', password: 'Artem2026', name: 'Artem' },
  { username: 'Yigil', password: 'Yigil2026', name: 'Yigil' },
];

async function main() {
  for (const v of VIEWERS) {
    const usernameLower = v.username.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { username: usernameLower } });
    if (existing) {
      console.log(`⊘ ${v.username} 已存在,跳过`);
      continue;
    }

    const hash = await hashPassword(v.password);

    // User + Account 两张表都要写,放在一个事务里保证一致性
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: usernameLower,        // ← 小写,供 better-auth 内部 lookup
          displayUsername: v.username,    // ← 原始大小写,UI 显示用
          email: `${usernameLower}@local.qg`,
          emailVerified: true,             // 跳过验证流程
          name: v.name,
          role: 'EDITOR',
          locale: 'RU',
        },
      });

      await tx.account.create({
        data: {
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hash,
        },
      });

      console.log(`✓ 创建 ${v.username} (username=${usernameLower}, id=${user.id})`);
    });
  }

  console.log('\n完成。初始密码:');
  for (const v of VIEWERS) {
    console.log(`  ${v.username} / ${v.password}`);
  }
  console.log('\n建议告诉家人登录后在右上角下拉菜单里改密码。');
}

main()
  .catch((e) => {
    console.error('脚本异常:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
