import { applyRequestAction, expireIfNeeded, isActiveRequest, isSampleProviderId, type RequestStatus } from '../domain.ts';
import { AppError } from './errors.ts';
import type { CreateRequestInput, OwnerId, PatchRequestInput, ProfileRepository, PublicRequest, RequestRecord, RequestRepository } from './ports.ts';
import { ProfileService } from './profile-service.ts';

function publicRequest(record: RequestRecord): PublicRequest {
  const { ownerId: _ownerId, ...rest } = record;
  return rest;
}

export class RequestService {
  private readonly requests: RequestRepository;
  private readonly profiles: ProfileService | null;
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(
    requests: RequestRepository,
    now: () => number = Date.now,
    createId: () => string = () => crypto.randomUUID(),
    profiles: ProfileRepository | null = null,
  ) {
    this.requests = requests;
    this.profiles = profiles ? new ProfileService(profiles, now) : null;
    this.now = now;
    this.createId = createId;
  }

  async list(ownerId: OwnerId): Promise<{ requests: PublicRequest[]; incoming: PublicRequest[] }> {
    const incoming = this.profiles && !(await this.profiles.read(ownerId)).profile?.listenerEnrolled
      ? []
      : await this.collect(await this.requests.listByProvider(ownerId));
    return {
      requests: await this.collect(await this.requests.listByOwner(ownerId)),
      incoming,
    };
  }

  async create(ownerId: OwnerId, input: CreateRequestInput): Promise<{ request: PublicRequest; notice: string }> {
    if (input.mode !== 'chat') {
      throw new AppError(409, 'Voice and video rooms are not connected. Chat requests can be saved; they do not contact a real person.');
    }
    const target = await this.resolveTarget(ownerId, input);
    const existing = await this.requests.listByOwnerAndProvider(ownerId, target.providerId);
    const hasActive = existing.some(row => isActiveRequest(expireIfNeeded(row.status, row.createdAt, this.now())));
    if (hasActive) throw new AppError(409, 'You already have an active request with this person.');
    const record: RequestRecord = {
      id: this.createId(),
      ownerId,
      providerId: target.providerId,
      providerName: target.providerName,
      topic: input.topic,
      context: input.context,
      mode: input.mode,
      status: 'pending',
      createdAt: new Date(this.now()).toISOString(),
    };
    await this.requests.create(record);
    return {
      request: publicRequest(record),
      notice: target.live
        ? 'Request saved as pending. The enrolled listener can accept or decline it from their account.'
        : 'Request saved as pending. This does not notify, invite, or connect a real person.',
    };
  }

  async change(actorId: OwnerId, input: PatchRequestInput): Promise<{ request: PublicRequest }> {
    const owned = await this.requests.findOwned(actorId, input.id);
    const incoming = owned ? null : await this.requests.findForProvider(actorId, input.id);
    const row = owned ?? incoming;
    if (!row) throw new AppError(404, 'That request was not found.');
    if (!owned && this.profiles && (input.action === 'accept' || input.action === 'decline')) {
      await this.profiles.requireListener(actorId);
    }
    const current = expireIfNeeded(row.status, row.createdAt, this.now());
    let next: RequestStatus;
    try {
      next = applyRequestAction(current, input.action, owned ? 'owner' : 'recipient');
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw new AppError((error as { status: number }).status, error.message);
      }
      throw error;
    }
    await this.requests.updateStatus(row.ownerId, row.id, next);
    return { request: publicRequest({ ...row, status: next }) };
  }

  private async resolveTarget(ownerId: OwnerId, input: CreateRequestInput) {
    if (!input.pairingCode) {
      if (!input.providerId || !input.providerName) {
        throw new AppError(400, 'Choose a sample person or enter a listener pairing code.');
      }
      if (!isSampleProviderId(input.providerId)) {
        throw new AppError(400, 'Choose a listed sample person or enter a listener pairing code.');
      }
      return { providerId: input.providerId, providerName: input.providerName, live: false };
    }
    if (!this.profiles) throw new AppError(409, 'Listener pairing is not available.');
    const listener = await this.profiles.findListenerByCode(input.pairingCode);
    if (listener.ownerId === ownerId) {
      throw new AppError(400, 'You cannot send a request to your own listener code.');
    }
    return {
      providerId: listener.ownerId,
      providerName: listener.displayName || 'Listener',
      live: true,
    };
  }

  private async collect(rows: RequestRecord[]): Promise<PublicRequest[]> {
    const timestamp = this.now();
    const requests: PublicRequest[] = [];
    for (const row of rows) {
      const next = expireIfNeeded(row.status, row.createdAt, timestamp);
      if (next !== row.status) await this.requests.updateStatus(row.ownerId, row.id, next);
      requests.push(publicRequest({ ...row, status: next }));
    }
    return requests;
  }
}
