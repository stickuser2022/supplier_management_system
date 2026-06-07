/**
 * DeepSeek 翻译适配器
 *
 * DeepSeek 是 LLM,API 风格与 OpenAI 兼容(chat completions),
 * 跟 Google "翻译专用 API" 是两种完全不同的形态。
 *
 * - Endpoint: https://api.deepseek.com/chat/completions
 * - 模型: deepseek-chat
 * - 计费: V4 约 ¥2/百万 input tokens, ¥8/百万 output tokens
 * - 新用户: 500 万 tokens / 30 天免费
 * - 文档: https://api-docs.deepseek.com/
 */

import type { TranslationProvider, TranslateRequest } from './types';
import { TranslationError } from './types';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-flash';

/** 语言代码 → 中文语言名(给 LLM prompt 用,让指令更清晰) */
const LANG_NAMES: Record<string, string> = {
  zh: '中文',
  ru: '俄语',
};

/** DeepSeek 响应形状(只列出我们用到的字段) */
interface DeepSeekResponse {
  choices: Array<{
    message: { content: string };
  }>;
  error?: {
    message: string;
    type?: string;
  };
}

export class DeepSeekTranslationProvider implements TranslationProvider {
  readonly name = 'deepseek';

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('DeepSeekTranslationProvider: apiKey is required');
    }
  }

  async translate(req: TranslateRequest): Promise<string> {
    const fromName = LANG_NAMES[req.from] ?? req.from;
    const toName = LANG_NAMES[req.to] ?? req.to;

    // LLM 翻译的关键是 prompt 设计 —— 不让它"自由发挥"
    const systemPrompt = [
      `你是一个专业的${fromName}到${toName}翻译。`,
      `严格遵守以下规则:`,
      `1. 只输出译文,不要任何解释、说明、引号、前缀("以下是翻译:"等)、后缀`,
      `2. 中文的人名、地名、公司名等专有名词,优先音译,不要意译`,
      `3. 保持原文的标点和数字格式`,
      `4. 如果原文已经是目标语言,直接返回原文`,
    ].join('\n');

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: req.text },
      ],
      temperature: 0, // 翻译要稳定,不要"创造性"
      stream: false,
      thinking: { type: 'disabled' }, // 关闭 DeepSeek 的"思考"阶段,减少响应时间(但可能略微影响质量,需要实测验证)
    };

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new TranslationError(this.name, req.text, networkErr);
    }

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as DeepSeekResponse;
      throw new TranslationError(
        this.name,
        req.text,
        new Error(
          `HTTP ${response.status}: ${errBody.error?.message ?? response.statusText}`,
        ),
      );
    }

    const json = (await response.json()) as DeepSeekResponse;
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new TranslationError(
        this.name,
        req.text,
        new Error('DeepSeek 响应缺少 content 字段'),
      );
    }

    return content.trim();
  }

  // 不实现 translateBatch
  // index.ts 的"自动降级"机制会用 Promise.all 并发逐条调用
  // 对回填脚本 84 次调用而言,完全够用
}