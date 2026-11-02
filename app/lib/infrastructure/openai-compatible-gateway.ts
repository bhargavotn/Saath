import { aiConfig } from '@/lib/server/ai';
import { AppError } from '../application/errors';
import type { ChatTurn, LanguageModel } from '../application/ports';

export class OpenAICompatibleGateway implements LanguageModel {
  constructor(private readonly config = aiConfig()) {}

  configured(): boolean {
    return Boolean(this.config.key && this.config.model);
  }

  async complete(input: { system: string; messages: ChatTurn[]; maxTokens: number; timeoutMs: number }): Promise<string> {
    if (!this.config.key || !this.config.model) {
      throw new AppError(503, 'AI rehearsal is not configured yet. You can still use the private writing prompts.', 'AI_NOT_CONFIGURED');
    }
    const endpoint = new URL(this.config.base.replace(/\/$/, '') + '/chat/completions');
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) {
      throw new AppError(503, 'AI provider configuration needs attention.');
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.key}` },
      signal: AbortSignal.timeout(input.timeoutMs),
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: input.maxTokens,
        messages: [{ role: 'system', content: input.system }, ...input.messages],
      }),
    });
    if (!response.ok) throw new AppError(502, 'The AI provider could not respond. Please try again.');
    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    const text = result.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new AppError(502, 'The AI provider returned an empty response.');
    return text;
  }
}
