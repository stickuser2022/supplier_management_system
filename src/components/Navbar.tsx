'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from '@/lib/auth-client';
import { setLocale } from '@/app/actions/set-locale';

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('navbar');
  const currentLocale = useLocale(); // 拿到当前语言代码('zh' 或 'ru')

  if (pathname === '/login') return null;
  if (isPending || !session) return null;

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  async function handleSwitchLocale(locale: 'zh' | 'ru') {
    // 已经是当前语言,什么也别做
    if (locale === currentLocale) return;
    // 调服务端动作:设 cookie + 落库
    await setLocale(locale);
    // 刷新页面让新语言生效(router.refresh 会重新请求所有服务端组件)
    router.refresh();
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/suppliers" className="text-gray-700 hover:text-gray-900 font-medium">
          {t('suppliers')}
        </Link>
        <Link href="/map" className="text-gray-700 hover:text-gray-900 font-medium">
          {t('map')}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* 语言切换:两个按钮 + 一个分隔符 */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => handleSwitchLocale('zh')}
            className={`px-2 py-0.5 rounded transition-colors ${
              currentLocale === 'zh'
                ? 'bg-gray-200 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            中
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => handleSwitchLocale('ru')}
            className={`px-2 py-0.5 rounded transition-colors ${
              currentLocale === 'ru'
                ? 'bg-gray-200 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ру
          </button>
        </div>

        <span className="text-sm text-gray-600">
          {session.user.name ?? t('userFallback')}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-600"
        >
          {t('logout')}
        </button>
      </div>
    </nav>
  );
}