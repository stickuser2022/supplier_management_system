/**
 * Google Cloud Translation (Basic v2 / NMT) 适配器
 *
 * - Endpoint: https://translation.googleapis.com/language/translate/v2
 * - 认证:API Key 拼在 URL ?key=xxx
 * - 免费额度:500K 字符/月,永久免费
 * - API 文档:https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */

import type { TranslationProvider, TranslateRequest } from './types';
import { TranslationError } from './types';

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

/** Google API 成功响应的形状(只列出我们用到的字段) */
interface GoogleSuccessResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

/** Google API 错误响应的形状 */
interface GoogleErrorResponse {
  error: {
    code: number;
    message: string;
    status?: string;
  };
}

export class GoogleTranslationProvider implements TranslationProvider {
  readonly name = 'google';

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('GoogleTranslationProvider: apiKey is required');
    }
  }

  /** 翻译单条文本 */
  async translate(req: TranslateRequest): Promise<string> {
    const [result] = await this.callApi([req]);
    return result;
  }

  /** 批量翻译:多条文本一次 API 调用,Google 原生支持(返回顺序与传入顺序一致) */
  async translateBatch(reqs: TranslateRequest[]): Promise<string[]> {
    if (reqs.length === 0) return [];

    // Google v2 一次请求里所有 q 的 source/target 必须一致
    // 我们的场景永远 zh→ru,这里加个保险校验,防止未来扩展时悄悄翻错方向
    const sources = new Set(reqs.map(r => r.from));
    const targets = new Set(reqs.map(r => r.to));
    if (sources.size > 1 || targets.size > 1) {
      throw new Error(
        'GoogleTranslationProvider.translateBatch: 同一批次内 from/to 必须一致'
      );
    }

    return this.callApi(reqs);
  }

  /** 实际 HTTP 调用,translate 和 translateBatch 共用 */
  private async callApi(reqs: TranslateRequest[]): Promise<string[]> {
    const { from, to } = reqs[0];
    const texts = reqs.map(r => r.text);

    const url = `${ENDPOINT}?key=${this.apiKey}`;
    const body = {
      q: texts,
      source: from,
      target: to,
      format: 'text', // 不让 Google 当 HTML 解析我们的内容
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      // 网络层面失败(断网、DNS 失败等)
      throw new TranslationError(this.name, texts.join(' | '), networkErr);
    }

    if (!response.ok) {
      // HTTP 状态码非 2xx:API key 错、配额耗尽、参数非法等
      const errBody = (await response.json().catch(() => ({}))) as Partial<GoogleErrorResponse>;
      throw new TranslationError(
        this.name,
        texts.join(' | '),
        new Error(
          `HTTP ${response.status}: ${errBody.error?.message ?? response.statusText}`,
        ),
      );
    }

    const json = (await response.json()) as GoogleSuccessResponse;

    // 响应结构兜底校验
    if (!json.data?.translations || json.data.translations.length !== reqs.length) {
      throw new TranslationError(
        this.name,
        texts.join(' | '),
        new Error('Google response shape mismatch'),
      );
    }

    return json.data.translations.map(t => t.translatedText);
  }
}