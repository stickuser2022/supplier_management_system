/**
 * 一次性密码重置脚本
 *
 * 用法:
 *   npx tsx scripts/reset-password.ts <username> <new-password>
 *
 * 例:
 *   npx tsx scripts/reset-password.ts qingger MyNewPassword123
 *
 * ⚠️ 安全提醒:密码通过命令行参数传入,会留在 shell 历史记录中。
 * 用完建议清一下历史(PowerShell: Clear-History; Bash: history -c)。
 * 远期考虑改成交互式输入(readline)避免此问题。
 *
 * 原理:
 * better-auth 把密码 hash 存在 Account 表的 password 字段(providerId='credential')。
 * 这里用 better-auth 同款 hashPassword 算法重新 hash 一遍,直接 update 进去 ——
 * 等价于"管理员强制重置某用户的密码"。
 *
 * 注意:这个脚本绕过了所有审计 / 验证流程,只在你忘了密码或者要给家人重置时用。
 */
import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../src/lib/prisma';

async function main() {
  const [, , username, newPassword] = process.argv;

  if (!username || !newPassword) {
    console.error('用法: npx tsx scripts/reset-password.ts <username> <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('密码至少 8 位');
    process.exit(1);
  }

  // 1. 找 User
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(`用户名 "${username}" 不存在`);
    process.exit(1);
  }
  console.log(`✓ 找到 User: id=${user.id}, email=${user.email}`);

  // 2. 找该用户的 credential Account(密码登录走这条)
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });
  if (!account) {
    console.error(`User ${username} 没有 credential Account, 该账号无法用密码登录`);
    process.exit(1);
  }

  // 3. hash 新密码
  const hash = await hashPassword(newPassword);

  // 4. 写回 Account
  await prisma.account.update({
    where: { id: account.id },
    data: { password: hash, updatedAt: new Date() },
  });

  console.log(`✓ ${username} 的密码已重置成功`);
  console.log(`  现在可以用新密码登录了`);
}

main()
  .catch((e) => {
    console.error('脚本异常:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
