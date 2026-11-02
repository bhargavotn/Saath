import { env } from 'cloudflare:workers';
import { AppError } from '../application/errors';
import type { OwnerId, UsageRepository } from '../application/ports';

export class D1UsageRepository implements UsageRepository {
  async consumeHourlySlot(ownerId: OwnerId, windowStart: string, limit: number): Promise<boolean> {
    if (!env.DB) throw new AppError(503, 'Rehearsal storage is unavailable.');
    const usage = await env.DB.prepare(
      'INSERT INTO ai_usage (id, owner_id, window_start, calls) VALUES (?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET calls = calls + 1 WHERE calls < ? RETURNING calls',
    ).bind(`${ownerId}:${windowStart}`, ownerId, windowStart, limit).first<{ calls: number }>();
    return Boolean(usage);
  }
}
