import fs from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider } from './types';

/**
 * 本地文件系统 provider
 * key 直接当 root 下的相对路径,写到磁盘
 */
export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root: string) {
    // 转绝对路径,与 prisma.ts 风格一致:相对路径以 cwd 为基准
    this.root = path.isAbsolute(root)
      ? root
      : path.resolve(process.cwd(), root);
  }

  /**
   * key → 磁盘绝对路径
   * 同时做 zip slip 防护:阻止恶意 key(含 ..)穿到 root 之外
   */
  private resolve(key: string): string {
    const abs = path.resolve(this.root, key);
    if (!abs.startsWith(this.root + path.sep) && abs !== this.root) {
      throw new Error(`Storage key escapes root: ${key}`);
    }
    return abs;
  }

  async put(key: string, data: Buffer, _mimeType: string): Promise<void> {
    const abs = this.resolve(key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
  }

  async get(key: string): Promise<Buffer> {
    const abs = this.resolve(key);
    return fs.readFile(abs);
  }

  async delete(key: string): Promise<void> {
    const abs = this.resolve(key);
    try {
      await fs.unlink(abs);
    } catch (err: unknown) {
      // 文件不存在视为成功
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const abs = this.resolve(key);
    try {
      await fs.access(abs);
      return true;
    } catch {
      return false;
    }
  }
}