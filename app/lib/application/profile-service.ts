import { AppError } from './errors.ts';
import type { EnrollInput, EnrollmentRole, OwnerId, ProfileRecord, ProfileRepository, PublicProfile } from './ports.ts';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function publicProfile(record: ProfileRecord): PublicProfile {
  const { ownerId: _ownerId, ...visible } = record;
  return visible;
}

export class ProfileService {
  private readonly profiles: ProfileRepository;
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(
    profiles: ProfileRepository,
    now: () => number = Date.now,
    random: () => number = Math.random,
  ) {
    this.profiles = profiles;
    this.now = now;
    this.random = random;
  }

  async read(ownerId: OwnerId): Promise<{ profile: PublicProfile | null }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    const record = await this.profiles.findByOwner(ownerId);
    return { profile: record ? publicProfile(record) : null };
  }

  async enroll(ownerId: OwnerId, input: EnrollInput): Promise<{ profile: PublicProfile }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    if (!input.clientEnrolled && !input.listenerEnrolled) {
      throw new AppError(400, 'Choose client, listener, or both.');
    }
    const existing = await this.profiles.findByOwner(ownerId);
    const clientEnrolled = input.clientEnrolled || Boolean(existing?.clientEnrolled);
    const listenerEnrolled = input.listenerEnrolled || Boolean(existing?.listenerEnrolled);
    const activeRole = this.resolveActiveRole(input.activeRole, clientEnrolled, listenerEnrolled, existing?.activeRole);
    const displayName = (input.displayName ?? existing?.displayName ?? '').trim().slice(0, 80);
    const pairingCode = listenerEnrolled
      ? existing?.pairingCode ?? await this.uniquePairingCode()
      : existing?.pairingCode ?? null;
    const record: ProfileRecord = {
      ownerId,
      displayName,
      clientEnrolled,
      listenerEnrolled,
      activeRole,
      pairingCode,
      updatedAt: new Date(this.now()).toISOString(),
    };
    return { profile: publicProfile(await this.profiles.upsert(record)) };
  }

  async switchRole(ownerId: OwnerId, role: EnrollmentRole): Promise<{ profile: PublicProfile }> {
    if (!ownerId) throw new AppError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
    const existing = await this.profiles.findByOwner(ownerId);
    if (!existing) throw new AppError(404, 'Enroll as a client or listener first.');
    if (role === 'client' && !existing.clientEnrolled) {
      throw new AppError(409, 'Enroll as a client before switching to that role.');
    }
    if (role === 'listener' && !existing.listenerEnrolled) {
      throw new AppError(409, 'Enroll as a listener before switching to that role.');
    }
    return {
      profile: publicProfile(await this.profiles.upsert({
        ...existing,
        activeRole: role,
        updatedAt: new Date(this.now()).toISOString(),
      })),
    };
  }

  async requireListener(ownerId: OwnerId): Promise<ProfileRecord> {
    const profile = await this.profiles.findByOwner(ownerId);
    if (!profile?.listenerEnrolled) {
      throw new AppError(403, 'Enroll as a listener before managing incoming requests.');
    }
    return profile;
  }

  async findListenerByCode(code: string): Promise<ProfileRecord> {
    const profile = await this.profiles.findByPairingCode(code.trim().toUpperCase());
    if (!profile?.listenerEnrolled) {
      throw new AppError(404, 'No enrolled listener uses that pairing code.');
    }
    return profile;
  }

  private resolveActiveRole(
    requested: EnrollmentRole | undefined,
    clientEnrolled: boolean,
    listenerEnrolled: boolean,
    previous?: EnrollmentRole,
  ): EnrollmentRole {
    if (requested === 'listener' && listenerEnrolled) return 'listener';
    if (requested === 'client' && clientEnrolled) return 'client';
    if (previous === 'listener' && listenerEnrolled) return 'listener';
    if (previous === 'client' && clientEnrolled) return 'client';
    return clientEnrolled ? 'client' : 'listener';
  }

  private async uniquePairingCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = this.makeCode();
      const existing = await this.profiles.findByPairingCode(code);
      if (!existing) return code;
    }
    throw new AppError(500, 'A pairing code could not be created. Please try again.');
  }

  private makeCode() {
    let code = '';
    for (let index = 0; index < 6; index += 1) {
      code += CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)];
    }
    return code;
  }
}
