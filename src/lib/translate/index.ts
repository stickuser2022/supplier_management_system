/**
 * 翻译抽象层 —— 业务代码唯一入口
 *
 * 用法:
 *   import { translate, translateBatch } from '@/lib/translate';
 *   const ru = await translate('广州', 'zh', 'ru');
 *
 * 切换 provider:改 .env 里 TRANSLATE_PROVIDER 一行,业务代码零改动。
 */

import type { TranslationProvider, TranslateRequest, LanguageCode } from './types';
import { GoogleTranslationProvider } from './google';
import { DeepSeekTranslationProvider } from './deepseek';

// 把类型也从这里再导出一次,业务代码只需 import 一个路径
export type { LanguageCode, TranslateRequest } from './types';

/** provider 单例缓存,首次调用时才创建 */
let cachedProvider: TranslationProvider | null = null;

/** 工厂:根据 env 选 provider */
function createProvider(): TranslationProvider {
  const name = process.env.TRANSLATE_PROVIDER ?? 'google';

  switch (name) {
    case 'google': {
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) {
        throw new Error(
          'GOOGLE_TRANSLATE_API_KEY 未在 .env 中配置(provider=google)',
        );
      }
      return new GoogleTranslationProvider(apiKey);
      
    }

    case 'deepseek': {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error(
          'DEEPSEEK_API_KEY 未在 .env 中配置(provider=deepseek)',
        );
      }
      return new DeepSeekTranslationProvider(apiKey);
    }

    default:
      throw new Error(`未知的 TRANSLATE_PROVIDER: "${name}"`);
  }
}

/** 拿到当前 provider(懒加载 + 单例缓存) */
function getProvider(): TranslationProvider {
  if (!cachedProvider) {
    cachedProvider = createProvider();
  }
  return cachedProvider;
}

/** 翻译单条文本 */
export async function translate(
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string> {
  return getProvider().translate({ text, from, to });
}

/**
 * 批量翻译:多条文本一次完成
 * - provider 支持原生 batch 时,走原生(1 次 HTTP 调用)
 * - 不支持时自动降级为并发逐条调用
 */
export async function translateBatch(
  reqs: TranslateRequest[],
): Promise<string[]> {
  const provider = getProvider();

  if (provider.translateBatch) {
    return provider.translateBatch(reqs);
  }

  // 降级:并发逐条
  return Promise.all(reqs.map(r => provider.translate(r)));
}

/** 重置 provider 缓存,主要给测试用——切了 env 后强制重新读取 */
export function _resetProviderCache(): void {
  cachedProvider = null;
}