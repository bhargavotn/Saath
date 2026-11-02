import type { ChairStage, CommMode, RequestAction, RequestStatus, ShareMode } from '../domain.ts';

export type OwnerId = string;

export type ContextRecord = {
  content: string;
  shareMode: ShareMode;
  updatedAt: string;
};

export type RequestRecord = {
  id: string;
  ownerId: OwnerId;
  providerId: string;
  providerName: string;
  topic: string;
  context: string;
  mode: CommMode;
  status: RequestStatus;
  createdAt: string;
};

export type ReportRecord = {
  id: string;
  ownerId: OwnerId;
  targetId: string;
  reason: string;
  createdAt: string;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export interface ContextRepository {
  findByOwner(ownerId: OwnerId): Promise<ContextRecord | null>;
  upsert(ownerId: OwnerId, record: ContextRecord): Promise<ContextRecord>;
  deleteByOwner(ownerId: OwnerId): Promise<void>;
}

export interface RequestRepository {
  listByOwner(ownerId: OwnerId): Promise<RequestRecord[]>;
  listByProvider(providerId: string): Promise<RequestRecord[]>;
  findOwned(ownerId: OwnerId, id: string): Promise<RequestRecord | null>;
  findForProvider(providerId: string, id: string): Promise<RequestRecord | null>;
  listByOwnerAndProvider(ownerId: OwnerId, providerId: string): Promise<RequestRecord[]>;
  create(record: RequestRecord): Promise<RequestRecord>;
  updateStatus(ownerId: OwnerId, id: string, status: RequestStatus): Promise<void>;
}

export type EnrollmentRole = 'client' | 'listener';

export type ProfileRecord = {
  ownerId: OwnerId;
  displayName: string;
  clientEnrolled: boolean;
  listenerEnrolled: boolean;
  activeRole: EnrollmentRole;
  pairingCode: string | null;
  updatedAt: string;
};

export type PublicProfile = Omit<ProfileRecord, 'ownerId'>;

export type EnrollInput = {
  clientEnrolled: boolean;
  listenerEnrolled: boolean;
  displayName?: string;
  activeRole?: EnrollmentRole;
};

export interface ProfileRepository {
  findByOwner(ownerId: OwnerId): Promise<ProfileRecord | null>;
  findByPairingCode(code: string): Promise<ProfileRecord | null>;
  upsert(record: ProfileRecord): Promise<ProfileRecord>;
}

export interface FieldCipher {
  configured(): boolean;
  encrypt(plaintext: string): Promise<string>;
  decrypt(value: string): Promise<string>;
}

export interface ReportRepository {
  create(record: ReportRecord): Promise<ReportRecord>;
}

export interface UsageRepository {
  consumeHourlySlot(ownerId: OwnerId, windowStart: string, limit: number): Promise<boolean>;
}

export interface LanguageModel {
  configured(): boolean;
  complete(input: { system: string; messages: ChatTurn[]; maxTokens: number; timeoutMs: number }): Promise<string>;
}

export type PublicRequest = Omit<RequestRecord, 'ownerId'>;

export type CreateRequestInput = {
  providerId?: string;
  providerName?: string;
  topic: string;
  context: string;
  mode: CommMode;
  pairingCode?: string;
};

export type PatchRequestInput = {
  id: string;
  action: RequestAction;
};

export type ChairSessionMode = 'same-device' | 'ai' | 'paired';
export type ChairStatus = 'waiting' | 'active' | 'closed';

export type ChairRecord = {
  id: string;
  code: string;
  hostId: OwnerId;
  guestId: string | null;
  hostName: string;
  guestName: string | null;
  mode: ChairSessionMode;
  status: ChairStatus;
  stage: ChairStage;
  paused: boolean;
  guestJoined: boolean;
  note: string;
  aiReply: string;
  updatedAt: string;
};

export type PublicChair = Omit<ChairRecord, 'hostId' | 'guestId'> & {
  you: 'host' | 'guest';
  voiceAvailable: boolean;
};

export interface ChairRepository {
  findById(id: string): Promise<ChairRecord | null>;
  findByCode(code: string): Promise<ChairRecord | null>;
  listByMember(ownerId: OwnerId): Promise<ChairRecord[]>;
  create(record: ChairRecord): Promise<ChairRecord>;
  save(record: ChairRecord): Promise<ChairRecord>;
}
