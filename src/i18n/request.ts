import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// 支持的语言清单
const SUPPORTED_LOCALES = ['zh', 'ru'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'zh';

/**
 * 按优先级决定当前请求用哪种语言:
 * 1. cookie(用户主动切过)
 * 2. Accept-Language(浏览器自带)
 * 3. 默认中文
 *
 * (User.locale 那一层等轮 3 接入)
 */
function detectLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null,
): Locale {
  // 1. cookie
  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }

  // 2. Accept-Language
  // 浏览器送来的格式像 "ru-RU,ru;q=0.9,en;q=0.8"
  // 我们按优先级拆开,匹配第一个支持的语言
  if (acceptLanguage) {
    const langs = acceptLanguage
      .split(',')
      .map((s) => s.split(';')[0].trim().toLowerCase());
    for (const lang of langs) {
      const baseLang = lang.split('-')[0]; // "ru-RU" → "ru"
      if (SUPPORTED_LOCALES.includes(baseLang as Locale)) {
        return baseLang as Locale;
      }
    }
  }

  // 3. 兜底
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const acceptLanguage = headersList.get('accept-language');

  const locale = detectLocale(cookieLocale, acceptLanguage);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});