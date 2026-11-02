import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profiles } from '@/db/schema';
import type { EnrollmentRole, OwnerId, ProfileRecord, ProfileRepository } from '../application/ports';

function asRecord(row: typeof profiles.$inferSelect): ProfileRecord {
  return {
    ownerId: row.ownerId,
    displayName: row.displayName,
    clientEnrolled: Boolean(row.clientEnrolled),
    listenerEnrolled: Boolean(row.listenerEnrolled),
    activeRole: row.activeRole as EnrollmentRole,
    pairingCode: row.pairingCode,
    updatedAt: row.updatedAt,
  };
}

export class D1ProfileRepository implements ProfileRepository {
  private readonly db;

  constructor(db = getDb()) {
    this.db = db;
  }

  async findByOwner(ownerId: OwnerId): Promise<ProfileRecord | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.ownerId, ownerId));
    return row ? asRecord(row) : null;
  }

  async findByPairingCode(code: string): Promise<ProfileRecord | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.pairingCode, code));
    return row ? asRecord(row) : null;
  }

  async upsert(record: ProfileRecord): Promise<ProfileRecord> {
    await this.db.insert(profiles).values({
      ownerId: record.ownerId,
      displayName: record.displayName,
      clientEnrolled: record.clientEnrolled ? 1 : 0,
      listenerEnrolled: record.listenerEnrolled ? 1 : 0,
      activeRole: record.activeRole,
      pairingCode: record.pairingCode,
      updatedAt: record.updatedAt,
    }).onConflictDoUpdate({
      target: profiles.ownerId,
      set: {
        displayName: record.displayName,
        clientEnrolled: record.clientEnrolled ? 1 : 0,
        listenerEnrolled: record.listenerEnrolled ? 1 : 0,
        activeRole: record.activeRole,
        pairingCode: record.pairingCode,
        updatedAt: record.updatedAt,
      },
    });
    return record;
  }
}
