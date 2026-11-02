import { AppError } from './errors.ts';
import type { LanguageModel } from './ports.ts';

export class WordingService {
  private readonly models: LanguageModel;

  constructor(models: LanguageModel) {
    this.models = models;
  }

  async suggest(text: string): Promise<{ suggestion: string; notice: string }> {
    if (!this.models.configured()) {
      throw new AppError(503, 'Wording assistance is not configured. Your original words were not changed.', 'AI_NOT_CONFIGURED');
    }
    try {
      const suggestion = await this.models.complete({
        system: 'Rewrite the user text more clearly. Do not add facts, diagnoses, personality labels, or details they did not write. Keep meaning and first-person voice. Return only the rewritten text.',
        messages: [{ role: 'user', content: text }],
        maxTokens: 400,
        timeoutMs: 20000,
      });
      return {
        suggestion: suggestion.slice(0, 2000),
        notice: 'Suggested wording only. Nothing is saved until you approve it. No facts should have been added.',
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new AppError(504, 'Wording assistance took too long. Your original words are unchanged.');
      }
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'The AI provider could not respond. Please try again.');
    }
  }
}
