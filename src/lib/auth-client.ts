import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000',
  plugins: [usernameClient()],
});

// 常用方法解构出来,组件里用着方便
export const { signIn, signOut, signUp, useSession } = authClient;
//刚才那个 API 路由是"服务端的门",这个文件是"客户端的钥匙"——React 组件里要登录、退出、查当前用户时,导入这里的函数就行。比如登录页会写 signIn.username({ username, password })。
//useSession 是个 React Hook,组件里用它能拿到"当前是谁在登录",比如顶部右上角显示"你好,青格力"。
//注意 baseURL 用了 NEXT_PUBLIC_ 前缀的变量——Next.js 规定客户端可访问的环境变量必须以 NEXT_PUBLIC_ 开头。