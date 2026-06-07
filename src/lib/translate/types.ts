/**
 * 翻译抽象层 —— 类型契约
 *
 * 这个文件不写任何具体实现,只定义"翻译提供商必须长什么样"。
 * Google / DeepSeek / DeepL 任何 provider 都通过实现 TranslationProvider 接口接入。
 * 业务代码永远只依赖本文件的类型,不依赖任何具体 provider。
 */

/** 系统支持的语言代码,小写 ISO 639-1,与各家翻译 API 的输入格式对齐 */
export type LanguageCode = 'zh' | 'ru';

/** 单次翻译请求 */
export interface TranslateRequest {
  text: string;
  from: LanguageCode;
  to: LanguageCode;
}

/** 翻译提供商必须实现的接口 */
export interface TranslationProvider {
  /** provider 标识名,用于日志和错误信息(如 'google' / 'deepseek') */
  readonly name: string;

  /** 翻译单条文本 */
  translate(req: TranslateRequest): Promise<string>;

  /** 批量翻译(多条独立文本一次 API 调用,效率更高;实现可选) */
  translateBatch?(reqs: TranslateRequest[]): Promise<string[]>;
}

/** 翻译失败时统一抛出的错误,调用方可统一捕获处理 */
export class TranslationError extends Error {
  constructor(
    public readonly provider: string,
    public readonly originalText: string,
    public readonly cause: unknown,
  ) {
    super(`[${provider}] translation failed for: "${originalText.slice(0, 30)}..."`);
    this.name = 'TranslationError';
  }
}