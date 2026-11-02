import { AppError } from './errors.ts';
import type { ContextRecord, ContextRepository, OwnerId } from './ports.ts';
import type { ShareMode } from '../domain.ts';

export class ContextService {
  private readonly contexts: ContextRepository;

  constructor(contexts: ContextRepository) {
    this.contexts = contexts;
  }

  async read(ownerId: OwnerId): Promise<{ context: ContextRecord | null }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    return { context: await this.contexts.findByOwner(ownerId) };
  }

  async save(ownerId: OwnerId, input: { content: string; shareMode?: ShareMode }): Promise<{ context: ContextRecord }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    const context = await this.contexts.upsert(ownerId, {
      content: input.content,
      shareMode: input.shareMode ?? 'private',
      updatedAt: new Date().toISOString(),
    });
    return { context };
  }

  async remove(ownerId: OwnerId): Promise<{ ok: true }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    await this.contexts.deleteByOwner(ownerId);
    return { ok: true };
  }
}
