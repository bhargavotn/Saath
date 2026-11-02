import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { sessionRequests } from '@/db/schema';
import type { OwnerId, RequestRecord, RequestRepository } from '../application/ports';
import type { RequestStatus } from '../domain';

function asRecord(row: typeof sessionRequests.$inferSelect): RequestRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    providerId: row.providerId,
    providerName: row.providerName,
    topic: row.topic,
    context: row.context,
    mode: row.mode as RequestRecord['mode'],
    status: row.status as RequestStatus,
    createdAt: row.createdAt,
  };
}

export class D1RequestRepository implements RequestRepository {
  constructor(private readonly db = getDb()) {}

  async listByOwner(ownerId: OwnerId): Promise<RequestRecord[]> {
    const rows = await this.db.select().from(sessionRequests).where(eq(sessionRequests.ownerId, ownerId)).orderBy(desc(sessionRequests.createdAt)).limit(100);
    return rows.map(asRecord);
  }

  async listByProvider(providerId: string): Promise<RequestRecord[]> {
    const rows = await this.db.select().from(sessionRequests).where(eq(sessionRequests.providerId, providerId)).orderBy(desc(sessionRequests.createdAt)).limit(100);
    return rows.map(asRecord);
  }

  async findOwned(ownerId: OwnerId, id: string): Promise<RequestRecord | null> {
    const [row] = await this.db.select().from(sessionRequests).where(and(eq(sessionRequests.id, id), eq(sessionRequests.ownerId, ownerId)));
    return row ? asRecord(row) : null;
  }

  async findForProvider(providerId: string, id: string): Promise<RequestRecord | null> {
    const [row] = await this.db.select().from(sessionRequests).where(and(eq(sessionRequests.id, id), eq(sessionRequests.providerId, providerId)));
    return row ? asRecord(row) : null;
  }

  async listByOwnerAndProvider(ownerId: OwnerId, providerId: string): Promise<RequestRecord[]> {
    const rows = await this.db.select().from(sessionRequests).where(and(eq(sessionRequests.ownerId, ownerId), eq(sessionRequests.providerId, providerId)));
    return rows.map(asRecord);
  }

  async create(record: RequestRecord): Promise<RequestRecord> {
    await this.db.insert(sessionRequests).values(record);
    return record;
  }

  async updateStatus(ownerId: OwnerId, id: string, status: RequestStatus): Promise<void> {
    await this.db.update(sessionRequests).set({ status }).where(and(eq(sessionRequests.id, id), eq(sessionRequests.ownerId, ownerId)));
  }
}
