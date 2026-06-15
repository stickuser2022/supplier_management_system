import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  // 不写 baseURL = 用当前页面 origin 发请求(同源 fetch)。
  // 这样不管浏览器是停在 http://localhost:3000 还是 https://qg-suppliermanagement.com,
  // 客户端都会自动把 /api/auth/* 请求发到自己的 origin,不需要环境变量维护。
  // 适配 tunnel 模式的关键:服务真实跑在 localhost:3000,但 tunnel 让浏览器以为
  // 服务在公网域名上,只有相对路径才能两边都对。
  plugins: [usernameClient()],
});

// 常用方法解构出来,组件里用着方便
export const { signIn, signOut, signUp, useSession, changePassword } = authClient;
//刚才那个 API 路由是"服务端的门",这个文件是"客户端的钥匙"——React 组件里要登录、退出、查当前用户时,导入这里的函数就行。比如登录页会写 signIn.username({ username, password })。
//useSession 是个 React Hook,组件里用它能拿到"当前是谁在登录",比如顶部右上角显示"你好,青格力"。
//注意 baseURL 用了 NEXT_PUBLIC_ 前缀的变量——Next.js 规定客户端可访问的环境变量必须以 NEXT_PUBLIC_ 开头。