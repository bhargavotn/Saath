import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { contexts } from '@/db/schema';
import type { ContextRecord, ContextRepository, OwnerId } from '../application/ports';

export class D1ContextRepository implements ContextRepository {
  constructor(private readonly db = getDb()) {}

  async findByOwner(ownerId: OwnerId): Promise<ContextRecord | null> {
    const [row] = await this.db.select().from(contexts).where(eq(contexts.ownerId, ownerId));
    return row ? { content: row.content, shareMode: row.shareMode as ContextRecord['shareMode'], updatedAt: row.updatedAt } : null;
  }

  async upsert(ownerId: OwnerId, record: ContextRecord): Promise<ContextRecord> {
    await this.db.insert(contexts).values({ ownerId, ...record }).onConflictDoUpdate({
      target: contexts.ownerId,
      set: { content: record.content, shareMode: record.shareMode, updatedAt: record.updatedAt },
    });
    return record;
  }

  async deleteByOwner(ownerId: OwnerId): Promise<void> {
    await this.db.delete(contexts).where(eq(contexts.ownerId, ownerId));
  }
}
