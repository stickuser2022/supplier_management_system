import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Better Auth 接管 /api/auth/* 下所有请求
export const { GET, POST } = toNextJsHandler(auth);

//[...all] 是 Next.js 的"catch-all 路由"语法,意思是"/api/auth/ 下面任何子路径(signin、signout、session、callback...)全部拦截下来"。toNextJsHandler 把 Better Auth 的内部 API 翻译成 Next.js 路由能用的格式。从此以后,浏览器或脚本访问 /api/auth/sign-in、/api/auth/sign-out、/api/auth/get-session 等等,Better Auth 自己处理。
//打个比方:之前 auth 像个工具箱在仓库里,你只能进仓库用;现在我们装了一扇门(API 路由),外面也能敲门借用工具