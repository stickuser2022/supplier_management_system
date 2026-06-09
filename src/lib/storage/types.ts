import type { FileType } from '@/generated/prisma/client';

/**
 * 存储抽象层契约
 * 所有 provider(local / oss / cos)都实现这个接口
 * 业务代码只与这个接口对话,不知道底层是哪一家
 */
export interface StorageProvider {
  /** 写入文件;key 由 keyFor() 计算得来 */
  put(key: string, data: Buffer, mimeType: string): Promise<void>;
  /** 读取文件;主要给 /api/files/[id] 流出用 */
  get(key: string): Promise<Buffer>;
  /** 删除文件;不存在不报错 */
  delete(key: string): Promise<void>;
  /** 判断文件是否存在 */
  exists(key: string): Promise<boolean>;
}

export type { FileType };