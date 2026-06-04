'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn.username({
      username,
      password,
    });

    if (result.error) {
      setError(result.error.message ?? '登录失败,请检查用户名和密码');
      setIsLoading(false);
    } else {
      // 登录成功,跳到供应商列表页
      router.push('/suppliers');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

//useRouter + router.push('/suppliers') —— Next.js 的客户端跳转工具。打个比方:浏览器地址栏自己跳,但不刷新整个页面(像 SPA 那样无缝过渡)
//<form onSubmit={...}> + e.preventDefault() —— 拦截浏览器默认的"表单提交=刷新页面"行为,改用我们自己的 async 函数处理
//disabled={isLoading} —— 登录请求飞行期间禁用按钮,防止用户多点重复提交(常见小坑预防)
//三个 useState 并存 —— 一个组件里可以有任意多个 useState,各管各的状态(用户名 / 密码 / 报错 / loading)