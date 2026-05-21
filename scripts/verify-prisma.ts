import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  // 创建一条 User
  const created = await prisma.user.create({
    data: {
      username: 'qingger',
      passwordHash: 'placeholder_will_be_real_in_phase_2',
      role: 'ADMIN',
    },
  });
  console.log('Created:', created);

  // 查所有 User
  const all = await prisma.user.findMany();
  console.log('All users:', all);
  console.log('Count:', all.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());