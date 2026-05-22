import path from 'node:path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function createPrismaClient() {
  const raw = process.env.DATABASE_URL!.replace(/^file:/, '');
  const dbPath = path.isAbsolute(raw)
    ? raw
    : path.resolve(process.cwd(), raw);

  console.log('[prisma.ts] DATABASE_URL =', JSON.stringify(process.env.DATABASE_URL));
  console.log('[prisma.ts] raw          =', JSON.stringify(raw));
  console.log('[prisma.ts] dbPath       =', dbPath);
  console.log('[prisma.ts] cwd          =', process.cwd());

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({
  adapter,
  log: ['query', 'warn', 'error'],
});
}

// ② 全局单例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =globalForPrisma.prisma ?? createPrismaClient();
/* TODO ② 用 ?? 操作符,全局有就用,没有就调 createPrismaClient() */;

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  /* TODO ③ 把 prisma 挂到 globalForPrisma.prisma 上 */
}