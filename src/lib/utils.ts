import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * server action catch 块统一错误日志。
 * 开发环境打印到 stdout,生产环境跳过(避免日志膨胀)。
 * 用法: catch (err) { logActionError('createSupplier', err); return {...}; }
 */
export function logActionError(label: string, err: unknown): void {
  if (process.env.NODE_ENV === 'production') return;
  console.error(`[action:${label}]`, err instanceof Error ? err.message : err);
}
