import type {
  ChairRecord,
  ChairRepository,
  ContextRecord,
  ContextRepository,
  LanguageModel,
  OwnerId,
  ProfileRecord,
  ProfileRepository,
  ReportRecord,
  ReportRepository,
  RequestRecord,
  RequestRepository,
  UsageRepository,
} from '../application/ports.ts';
import type { RequestStatus } from '../domain.ts';

export class MemoryContextRepository implements ContextRepository {
  private readonly rows = new Map<OwnerId, ContextRecord>();

  async findByOwner(ownerId: OwnerId) {
    return this.rows.get(ownerId) ?? null;
  }

  async upsert(ownerId: OwnerId, record: ContextRecord) {
    this.rows.set(ownerId, record);
    return record;
  }

  async deleteByOwner(ownerId: OwnerId) {
    this.rows.delete(ownerId);
  }
}

export class MemoryRequestRepository implements RequestRepository {
  private readonly rows: RequestRecord[] = [];

  async listByOwner(ownerId: OwnerId) {
    return this.rows.filter(row => row.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listByProvider(providerId: string) {
    return this.rows.filter(row => row.providerId === providerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findOwned(ownerId: OwnerId, id: string) {
    return this.rows.find(row => row.ownerId === ownerId && row.id === id) ?? null;
  }

  async findForProvider(providerId: string, id: string) {
    return this.rows.find(row => row.providerId === providerId && row.id === id) ?? null;
  }

  async listByOwnerAndProvider(ownerId: OwnerId, providerId: string) {
    return this.rows.filter(row => row.ownerId === ownerId && row.providerId === providerId);
  }

  async create(record: RequestRecord) {
    this.rows.push(record);
    return record;
  }

  async updateStatus(ownerId: OwnerId, id: string, status: RequestStatus) {
    const row = this.rows.find(item => item.ownerId === ownerId && item.id === id);
    if (row) row.status = status;
  }
}

export class MemoryProfileRepository implements ProfileRepository {
  private readonly rows = new Map<OwnerId, ProfileRecord>();

  async findByOwner(ownerId: OwnerId) {
    return this.rows.get(ownerId) ?? null;
  }

  async findByPairingCode(code: string) {
    return [...this.rows.values()].find(row => row.pairingCode === code) ?? null;
  }

  async upsert(record: ProfileRecord) {
    this.rows.set(record.ownerId, record);
    return record;
  }
}

export class MemoryReportRepository implements ReportRepository {
  readonly rows: ReportRecord[] = [];

  async create(record: ReportRecord) {
    this.rows.push(record);
    return record;
  }
}

export class MemoryUsageRepository implements UsageRepository {
  private readonly counts = new Map<string, number>();

  async consumeHourlySlot(ownerId: OwnerId, windowStart: string, limit: number) {
    const key = `${ownerId}:${windowStart}`;
    const next = (this.counts.get(key) ?? 0) + 1;
    if (next > limit) return false;
    this.counts.set(key, next);
    return true;
  }
}

export class MemoryChairRepository implements ChairRepository {
  private readonly rows: ChairRecord[] = [];

  async findById(id: string) {
    return this.rows.find(row => row.id === id) ?? null;
  }

  async findByCode(code: string) {
    return this.rows.find(row => row.code === code) ?? null;
  }

  async listByMember(ownerId: OwnerId) {
    return this.rows
      .filter(row => row.hostId === ownerId || row.guestId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async create(record: ChairRecord) {
    this.rows.push(record);
    return record;
  }

  async save(record: ChairRecord) {
    const index = this.rows.findIndex(row => row.id === record.id);
    if (index >= 0) this.rows[index] = record;
    return record;
  }
}

export class MemoryLanguageModel implements LanguageModel {
  private readonly reply: string | null;
  private readonly enabled: boolean;

  constructor(reply: string | null, enabled = true) {
    this.reply = reply;
    this.enabled = enabled;
  }

  configured() {
    return this.enabled;
  }

  async complete() {
    if (!this.reply) throw new Error('empty');
    return this.reply;
  }
}
