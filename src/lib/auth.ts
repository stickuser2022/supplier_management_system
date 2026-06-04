import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { prisma } from './prisma';

export const auth = betterAuth({
  // 用 Prisma 适配器存数据,数据库是 SQLite
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),

  // 启用账号密码登录,关掉邮箱验证(自己人用)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // 启用 username 插件,允许用用户名(而非邮箱)登录
  plugins: [username()],

  // 允许的来源域名,生产环境部署后要补上线上域名
  trustedOrigins: ['http://localhost:3000'],
});