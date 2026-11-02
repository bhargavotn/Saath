import { desc, eq, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { chairSessions } from '@/db/schema';
import type { ChairRecord, ChairRepository, ChairSessionMode, ChairStatus, OwnerId } from '../application/ports';
import type { ChairStage } from '../domain';

function asRecord(row: typeof chairSessions.$inferSelect): ChairRecord {
  return {
    id: row.id,
    code: row.code,
    hostId: row.hostId,
    guestId: row.guestId,
    hostName: row.hostName,
    guestName: row.guestName,
    mode: row.mode as ChairSessionMode,
    status: row.status as ChairStatus,
    stage: row.stage as ChairStage,
    paused: Boolean(row.paused),
    guestJoined: Boolean(row.guestJoined),
    note: row.note,
    aiReply: row.aiReply,
    updatedAt: row.updatedAt,
  };
}

function asValues(record: ChairRecord) {
  return {
    id: record.id,
    code: record.code,
    hostId: record.hostId,
    guestId: record.guestId,
    hostName: record.hostName,
    guestName: record.guestName,
    mode: record.mode,
    status: record.status,
    stage: record.stage,
    paused: record.paused ? 1 : 0,
    guestJoined: record.guestJoined ? 1 : 0,
    note: record.note,
    aiReply: record.aiReply,
    updatedAt: record.updatedAt,
  };
}

export class D1ChairRepository implements ChairRepository {
  private readonly db;

  constructor(db = getDb()) {
    this.db = db;
  }

  async findById(id: string): Promise<ChairRecord | null> {
    const [row] = await this.db.select().from(chairSessions).where(eq(chairSessions.id, id));
    return row ? asRecord(row) : null;
  }

  async findByCode(code: string): Promise<ChairRecord | null> {
    const [row] = await this.db.select().from(chairSessions).where(eq(chairSessions.code, code));
    return row ? asRecord(row) : null;
  }

  async listByMember(ownerId: OwnerId): Promise<ChairRecord[]> {
    const rows = await this.db
      .select()
      .from(chairSessions)
      .where(or(eq(chairSessions.hostId, ownerId), eq(chairSessions.guestId, ownerId)))
      .orderBy(desc(chairSessions.updatedAt))
      .limit(40);
    return rows.map(asRecord);
  }

  async create(record: ChairRecord): Promise<ChairRecord> {
    await this.db.insert(chairSessions).values(asValues(record));
    return record;
  }

  async save(record: ChairRecord): Promise<ChairRecord> {
    await this.db.update(chairSessions).set(asValues(record)).where(eq(chairSessions.id, record.id));
    return record;
  }
}
