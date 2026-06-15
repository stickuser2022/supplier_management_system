import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
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

  // 允许的来源域名:本地开发 + tunnel 公网入口都要在
  // 加新域名时往数组里追加,无需删 localhost(本机自测仍需要)
  trustedOrigins: [
    'http://localhost:3000',
    'https://qg-suppliermanagement.com',
  ],
});

// ─── 取当前用户 id 的两套 helper ─────────────────────────────────
//
// 阶段 2 收尾后,业务代码不再允许"session 拿不到就兜底 admin"。
// 两套接口对应两种调用场景:
//
//   • requireUserId() 给 server action / RSC 用:无 session 时直接
//     redirect('/login') —— middleware 通常已经拦住未登录访问,这里
//     是兜底,中途 session 失效时把人弹回登录页是最干净的反应
//
//   • getOptionalUserId() 给 API route 用:返回 null,调用方自己组
//     401 JSON 响应。API 不能 redirect,只能用状态码告诉客户端
//
// 注意 requireUserId 内部走的是 next/navigation 的 redirect,
// Next.js 用一个特殊 NEXT_REDIRECT error 实现跳转 —— 所以**调用方
// 不要把它包在 try/catch 里**,否则会把 redirect 错误也吞掉

export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user.id;
}

export async function getOptionalUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── 权限检查 helper(2026.6.15 引入)─────────────────────────────
//
// 设计目标:每个登录用户可以新建任何东西,但只能编辑/删除自己创建的;
//          ADMIN 是兜底,可以改任何人的数据。
//
// 用法模式(server action 里):
//   const existing = await prisma.supplier.findUnique({ where: { id }, select: { createdById: true } });
//   if (!existing) return { status: 'error', message: '...' };
//   const user = await requireCurrentUser();
//   if (!isOwner(existing, user)) return { status: 'error', message: '只能修改自己创建的记录' };
//
// requireCurrentUser 比 requireUserId 多查一次 User 表拿 role,但每个
// 受权限保护的 action 只调一次,5-10ms 开销可接受

export type CurrentUser = { id: string; role: 'ADMIN' | 'EDITOR' };

export async function requireCurrentUser(): Promise<CurrentUser> {
  const id = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) {
    // 罕见:session 还在但 User 行被删了;弹回登录最稳
    redirect('/login');
  }
  return { id: user.id, role: user.role as 'ADMIN' | 'EDITOR' };
}

// 同步 helper:判断给定记录是否能被给定用户编辑
// ADMIN 永远 true;EDITOR 仅当记录的 createdById 是自己时为 true
export function isOwner(
  record: { createdById: string },
  user: CurrentUser,
): boolean {
  return user.role === 'ADMIN' || record.createdById === user.id;
}