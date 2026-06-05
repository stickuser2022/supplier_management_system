'use server';

import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SUPPORTED_LOCALES = ['zh', 'ru'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * 切换语言:同时干两件事
 *   1. 设置 NEXT_LOCALE cookie(立即生效,刷新页面就能看到新语言)
 *   2. 更新 User.locale 字段(下次登录、其他设备也记得这个选择)
 */
export async function setLocale(locale: Locale) {
  // 防御性校验,别相信客户端传的值
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error('Unsupported locale');
  }

  // 1. 设 cookie(1 年有效期,够长)
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    path: '/',
  });

  // 2. 落库——但 DB 出错不影响 cookie,所以 try/catch 包起来
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      await prisma.user.update({
        where: { id: session.user.id },
        // schema 里 locale 字段是大写枚举,cookie 用的小写,这里转换一下
        data: { locale: locale === 'zh' ? 'ZH' : 'RU' },
      });
    }
  } catch (e) {
    // DB 出错只记日志,不抛错——cookie 已经设了,UI 切换不会受影响
    console.error('Failed to sync locale to DB:', e);
  }
}