import path from 'node:path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function createPrismaClient() {
  const raw = process.env.DATABASE_URL!.replace(/^file:/, '');
  const dbPath = path.isAbsolute(raw)
    ? raw
    : path.resolve(process.cwd(), raw);

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({
  adapter,
  // 开发环境打印 SQL 方便调试,生产环境只打 warn/error
  log: process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['query', 'warn', 'error'],
});
}

// 全局单例:开发环境挂到 globalThis 防止热重载反复创建连接
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}