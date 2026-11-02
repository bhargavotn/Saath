import { AppError } from './errors.ts';
import type { OwnerId, ReportRepository } from './ports.ts';

export class ReportService {
  private readonly reports: ReportRepository;
  private readonly createId: () => string;

  constructor(reports: ReportRepository, createId: () => string = () => crypto.randomUUID()) {
    this.reports = reports;
    this.createId = createId;
  }

  async submit(ownerId: OwnerId, input: { targetId: string; reason: string }): Promise<{ ok: true; id: string }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    const id = this.createId();
    await this.reports.create({
      id,
      ownerId,
      targetId: input.targetId,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    });
    return { ok: true, id };
  }
}
