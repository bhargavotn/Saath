import type { ContextRecord, ContextRepository, FieldCipher, OwnerId, RequestRecord, RequestRepository } from '../application/ports.ts';
import type { RequestStatus } from '../domain.ts';

export class EncryptedContextRepository implements ContextRepository {
  private readonly inner: ContextRepository;
  private readonly cipher: FieldCipher;

  constructor(inner: ContextRepository, cipher: FieldCipher) {
    this.inner = inner;
    this.cipher = cipher;
  }

  async findByOwner(ownerId: OwnerId) {
    const record = await this.inner.findByOwner(ownerId);
    if (!record) return null;
    return { ...record, content: await this.cipher.decrypt(record.content) };
  }

  async upsert(ownerId: OwnerId, record: ContextRecord) {
    await this.inner.upsert(ownerId, {
      ...record,
      content: await this.cipher.encrypt(record.content),
    });
    return record;
  }

  deleteByOwner(ownerId: OwnerId) {
    return this.inner.deleteByOwner(ownerId);
  }
}

export class EncryptedRequestRepository implements RequestRepository {
  private readonly inner: RequestRepository;
  private readonly cipher: FieldCipher;

  constructor(inner: RequestRepository, cipher: FieldCipher) {
    this.inner = inner;
    this.cipher = cipher;
  }

  async listByOwner(ownerId: OwnerId) {
    return this.openMany(await this.inner.listByOwner(ownerId));
  }

  async listByProvider(providerId: string) {
    return this.openMany(await this.inner.listByProvider(providerId));
  }

  async findOwned(ownerId: OwnerId, id: string) {
    return this.openOne(await this.inner.findOwned(ownerId, id));
  }

  async findForProvider(providerId: string, id: string) {
    return this.openOne(await this.inner.findForProvider(providerId, id));
  }

  async listByOwnerAndProvider(ownerId: OwnerId, providerId: string) {
    return this.openMany(await this.inner.listByOwnerAndProvider(ownerId, providerId));
  }

  async create(record: RequestRecord) {
    await this.inner.create({
      ...record,
      context: await this.cipher.encrypt(record.context),
    });
    return record;
  }

  updateStatus(ownerId: OwnerId, id: string, status: RequestStatus) {
    return this.inner.updateStatus(ownerId, id, status);
  }

  private async openOne(record: RequestRecord | null) {
    if (!record) return null;
    return { ...record, context: await this.cipher.decrypt(record.context) };
  }

  private async openMany(records: RequestRecord[]) {
    const opened: RequestRecord[] = [];
    for (const record of records) opened.push({ ...record, context: await this.cipher.decrypt(record.context) });
    return opened;
  }
}
