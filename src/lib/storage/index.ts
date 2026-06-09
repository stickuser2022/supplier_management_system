import { LocalStorageProvider } from './local';
import type { StorageProvider } from './types';

export type { StorageProvider };
export { keyFor, thumbKeyFor } from './key';

function createStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  const root = process.env.STORAGE_ROOT ?? './storage';

  switch (driver) {
    case 'local':
      return new LocalStorageProvider(root);
    // case 'oss': return new OssStorageProvider(...);  // 未来
    // case 'cos': return new CosStorageProvider(...);  // 未来
    default:
      throw new Error(
        `Unknown STORAGE_DRIVER: "${driver}". Expected: local`,
      );
  }
}

/**
 * 全局存储单例
 * 业务代码:import { storage, keyFor } from '@/lib/storage';
 *           const key = keyFor('SUPPLIER_LOGO', supplierId, file.name);
 *           await storage.put(key, buffer, file.type);
 */
export const storage: StorageProvider = createStorage();