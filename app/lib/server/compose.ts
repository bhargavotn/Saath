import { env } from 'cloudflare:workers';
import { ChairService } from '../application/chair-service.ts';
import { ContextService } from '../application/context-service.ts';
import { ProfileService } from '../application/profile-service.ts';
import { RehearsalService } from '../application/rehearsal-service.ts';
import { ReportService } from '../application/report-service.ts';
import { RequestService } from '../application/request-service.ts';
import { WordingService } from '../application/wording-service.ts';
import { createFieldCipher } from '../infrastructure/aes-gcm-cipher.ts';
import { D1ChairRepository } from '../infrastructure/d1-chair-repository.ts';
import { D1ContextRepository } from '../infrastructure/d1-context-repository.ts';
import { D1ProfileRepository } from '../infrastructure/d1-profile-repository.ts';
import { D1ReportRepository } from '../infrastructure/d1-report-repository.ts';
import { D1RequestRepository } from '../infrastructure/d1-request-repository.ts';
import { D1UsageRepository } from '../infrastructure/d1-usage-repository.ts';
import { EncryptedContextRepository, EncryptedRequestRepository } from '../infrastructure/encrypted-repositories.ts';
import { OpenAICompatibleGateway } from '../infrastructure/openai-compatible-gateway.ts';
import { aiReady } from './ai.ts';
import { voiceReady } from './voice.ts';

type EncryptionEnv = { CONTEXT_ENCRYPTION_KEY?: string };

export function createCipher() {
  return createFieldCipher((env as unknown as EncryptionEnv).CONTEXT_ENCRYPTION_KEY);
}

export function encryptionStatus() {
  const atRest = createCipher().configured();
  return {
    atRest,
    endToEnd: false,
    algorithm: atRest ? 'AES-256-GCM' : null,
    detail: atRest
      ? 'Private context, request notes, and Two Chairs notes are encrypted at rest with AES-256-GCM. The server decrypts them for the signed-in owner. This is not end-to-end encryption.'
      : 'CONTEXT_ENCRYPTION_KEY is not configured. Private text is stored as written. This is not end-to-end encryption.',
  };
}

export function backendCapabilities() {
  const encryption = encryptionStatus();
  return {
    persistence: 'd1' as const,
    pairing: true,
    twoChairs: true,
    aiConfigured: aiReady(),
    voiceConfigured: voiceReady(),
    encryption,
  };
}

export function createServices() {
  const cipher = createCipher();
  const profiles = new D1ProfileRepository();
  const model = new OpenAICompatibleGateway();
  const rehearsal = new RehearsalService(model, new D1UsageRepository());
  return {
    context: new ContextService(new EncryptedContextRepository(new D1ContextRepository(), cipher)),
    requests: new RequestService(
      new EncryptedRequestRepository(new D1RequestRepository(), cipher),
      Date.now,
      () => crypto.randomUUID(),
      profiles,
    ),
    reports: new ReportService(new D1ReportRepository()),
    rehearsal,
    wording: new WordingService(model),
    profiles: new ProfileService(profiles),
    chairs: new ChairService(
      new D1ChairRepository(),
      cipher,
      profiles,
      rehearsal,
      Date.now,
      Math.random,
      () => crypto.randomUUID(),
      voiceReady(),
    ),
    encryption: encryptionStatus(),
  };
}
