import { getDb } from '@/db';
import { reports } from '@/db/schema';
import type { ReportRecord, ReportRepository } from '../application/ports';

export class D1ReportRepository implements ReportRepository {
  constructor(private readonly db = getDb()) {}

  async create(record: ReportRecord): Promise<ReportRecord> {
    await this.db.insert(reports).values(record);
    return record;
  }
}
