'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 登录页 / 未登录 / 加载中 —— 不渲染导航
  if (pathname === '/login') return null;
  if (isPending || !session) return null;

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/suppliers" className="text-gray-700 hover:text-gray-900 font-medium">
          供应商
        </Link>
        <Link href="/map" className="text-gray-700 hover:text-gray-900 font-medium">
          地图
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session.user.name ?? '用户'}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-600"
        >
          退出
        </button>
      </div>
    </nav>
  );
}