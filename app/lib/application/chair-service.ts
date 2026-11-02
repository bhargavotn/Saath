import { chairSpeaker, nextChairStage } from '../domain.ts';
import { AppError } from './errors.ts';
import type {
  ChairRecord,
  ChairRepository,
  ChairSessionMode,
  FieldCipher,
  OwnerId,
  ProfileRepository,
  PublicChair,
} from './ports.ts';
import { RehearsalService } from './rehearsal-service.ts';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type ChairAction = 'start' | 'next' | 'pause' | 'resume' | 'leave' | 'note' | 'ai-turn' | 'call';

export function publicChair(record: ChairRecord, actorId: OwnerId, voiceAvailable = false): PublicChair {
  return {
    id: record.id,
    code: record.code,
    hostName: record.hostName,
    guestName: record.guestName,
    mode: record.mode,
    status: record.status,
    stage: record.stage,
    paused: record.paused,
    guestJoined: record.guestJoined,
    note: record.note,
    aiReply: record.aiReply,
    updatedAt: record.updatedAt,
    you: record.hostId === actorId ? 'host' : 'guest',
    voiceAvailable,
  };
}

export class ChairService {
  private readonly chairs: ChairRepository;
  private readonly cipher: FieldCipher;
  private readonly profiles: ProfileRepository | null;
  private readonly rehearsal: RehearsalService | null;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly createId: () => string;
  private readonly voiceAvailable: boolean;

  constructor(
    chairs: ChairRepository,
    cipher: FieldCipher,
    profiles: ProfileRepository | null = null,
    rehearsal: RehearsalService | null = null,
    now: () => number = Date.now,
    random: () => number = Math.random,
    createId: () => string = () => crypto.randomUUID(),
    voiceAvailable = false,
  ) {
    this.chairs = chairs;
    this.cipher = cipher;
    this.profiles = profiles;
    this.rehearsal = rehearsal;
    this.now = now;
    this.random = random;
    this.createId = createId;
    this.voiceAvailable = voiceAvailable;
  }

  async list(ownerId: OwnerId): Promise<{ sessions: PublicChair[] }> {
    const rows = await this.chairs.listByMember(ownerId);
    const sessions: PublicChair[] = [];
    for (const row of rows) sessions.push(await this.present(row, ownerId));
    return { sessions };
  }

  async read(ownerId: OwnerId, id: string): Promise<{ session: PublicChair }> {
    return { session: await this.present(await this.requireMember(ownerId, id), ownerId) };
  }

  async create(
    ownerId: OwnerId,
    input: { mode: ChairSessionMode; displayName?: string; pairingCode?: string },
  ): Promise<{ session: PublicChair }> {
    if (!ownerId) throw new AppError(401, 'Sign in to open a Two Chairs room.', 'AUTH_REQUIRED');
    let guestId: string | null = null;
    let guestName: string | null = input.mode === 'ai' ? 'Fictional chair' : null;
    if (input.mode === 'paired' && input.pairingCode) {
      if (!this.profiles) throw new AppError(409, 'Listener pairing is not available.');
      const listener = await this.profiles.findByPairingCode(input.pairingCode.trim().toUpperCase());
      if (!listener?.listenerEnrolled) throw new AppError(404, 'No enrolled listener uses that pairing code.');
      if (listener.ownerId === ownerId) throw new AppError(400, 'You cannot pair a room with your own listener code.');
      guestId = listener.ownerId;
      guestName = listener.displayName || 'Listener';
    }
    const record: ChairRecord = {
      id: this.createId(),
      code: await this.uniqueCode(),
      hostId: ownerId,
      guestId,
      hostName: (input.displayName || 'Person A').slice(0, 80),
      guestName,
      mode: input.mode,
      status: 'waiting',
      stage: 'agree',
      paused: false,
      guestJoined: false,
      note: '',
      aiReply: '',
      updatedAt: new Date(this.now()).toISOString(),
    };
    return { session: await this.present(await this.chairs.create(record), ownerId) };
  }

  async join(ownerId: OwnerId, code: string, displayName?: string): Promise<{ session: PublicChair }> {
    if (!ownerId) throw new AppError(401, 'Sign in to join a Two Chairs room.', 'AUTH_REQUIRED');
    const row = await this.chairs.findByCode(code.trim().toUpperCase());
    if (!row || row.status === 'closed') throw new AppError(404, 'That Two Chairs room was not found.');
    if (row.hostId === ownerId) return { session: await this.present(row, ownerId) };
    if (row.mode !== 'paired') throw new AppError(409, 'This room is not waiting for another person.');
    if (row.guestId && row.guestId !== ownerId) throw new AppError(409, 'Someone else has already joined this room.');
    const next: ChairRecord = {
      ...row,
      guestId: ownerId,
      guestName: (displayName || row.guestName || 'Person B').slice(0, 80),
      guestJoined: true,
      updatedAt: new Date(this.now()).toISOString(),
    };
    return { session: await this.present(await this.chairs.save(next), ownerId) };
  }

  async act(
    ownerId: OwnerId,
    input: { id: string; action: ChairAction; note?: string; message?: string },
  ): Promise<{ session: PublicChair }> {
    const row = await this.requireMember(ownerId, input.id);
    if (input.action === 'call') {
      throw new AppError(
        409,
        this.voiceAvailable
          ? 'LIVEKIT environment values are present, but a voice room is not implemented yet. Stay with the text turns.'
          : 'Voice calling is not connected. LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are unset. Use the text turns here.',
        'VOICE_UNAVAILABLE',
      );
    }
    if (row.status === 'closed' && input.action !== 'leave') {
      throw new AppError(409, 'This Two Chairs room is closed.');
    }
    const next: ChairRecord = { ...row, updatedAt: new Date(this.now()).toISOString() };
    if (input.action === 'start') {
      if (row.mode === 'paired' && !row.guestJoined) {
        throw new AppError(409, 'The other person has not joined yet.');
      }
      next.status = 'active';
      next.stage = 'agree';
      next.paused = false;
    } else if (input.action === 'pause') {
      if (row.status !== 'active') throw new AppError(409, 'Start the room before pausing.');
      next.paused = true;
    } else if (input.action === 'resume') {
      next.paused = false;
    } else if (input.action === 'next') {
      if (row.status !== 'active' || row.paused) throw new AppError(409, 'The room must be active and unpaused to continue.');
      const stage = nextChairStage(row.stage);
      if (stage === 'done') next.status = 'closed';
      else {
        next.stage = stage;
        next.aiReply = '';
      }
    } else if (input.action === 'leave') {
      next.status = 'closed';
    } else if (input.action === 'note') {
      next.note = await this.cipher.encrypt((input.note ?? '').slice(0, 2000));
    } else if (input.action === 'ai-turn') {
      if (row.mode !== 'ai') throw new AppError(409, 'The AI chair is only available in fictional rehearsal mode.');
      if (row.status !== 'active' || row.paused) throw new AppError(409, 'Start the room before asking the AI chair.');
      if (chairSpeaker(row.stage) !== 'b' && row.stage !== 'switch') {
        throw new AppError(409, 'Wait for a Person B step before asking the fictional chair.');
      }
      if (!this.rehearsal) throw new AppError(503, 'AI rehearsal is not configured yet.', 'AI_NOT_CONFIGURED');
      const spoken = (input.message ?? '').trim() || `It is the ${row.stage} step. Reflect briefly as Person B.`;
      const result = await this.rehearsal.reply(ownerId, {
        messages: [{ role: 'user', content: spoken }],
        scenario: `Two Chairs fictional Person B. Stage: ${row.stage}.`,
        style: 'receptive',
      });
      next.aiReply = result.reply;
    } else {
      throw new AppError(400, 'Unknown Two Chairs action.');
    }
    return { session: await this.present(await this.chairs.save(next), ownerId) };
  }

  private async requireMember(ownerId: OwnerId, id: string): Promise<ChairRecord> {
    const row = await this.chairs.findById(id);
    if (!row || (row.hostId !== ownerId && row.guestId !== ownerId)) {
      throw new AppError(404, 'That Two Chairs room was not found.');
    }
    return row;
  }

  private async present(record: ChairRecord, ownerId: OwnerId): Promise<PublicChair> {
    return publicChair({ ...record, note: await this.cipher.decrypt(record.note) }, ownerId, this.voiceAvailable);
  }

  private async uniqueCode() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      let code = '';
      for (let index = 0; index < 6; index += 1) {
        code += CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)];
      }
      if (!(await this.chairs.findByCode(code))) return code;
    }
    throw new AppError(500, 'A room code could not be created. Please try again.');
  }
}
