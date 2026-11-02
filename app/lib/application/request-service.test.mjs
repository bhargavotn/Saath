import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RequestService} from './request-service.ts';
import {ContextService} from './context-service.ts';
import {RehearsalService} from './rehearsal-service.ts';
import {ReportService} from './report-service.ts';
import {AppError} from './errors.ts';
import {MemoryContextRepository, MemoryLanguageModel, MemoryProfileRepository, MemoryReportRepository, MemoryRequestRepository, MemoryUsageRepository} from '../infrastructure/memory.ts';
import {ProfileService} from './profile-service.ts';
import {AesGcmCipher, createFieldCipher} from '../infrastructure/aes-gcm-cipher.ts';
import {EncryptedContextRepository} from '../infrastructure/encrypted-repositories.ts';

test('context is owner-scoped and can be deleted without touching another owner', async () => {
  const store = new MemoryContextRepository();
  const service = new ContextService(store);
  await service.save('owner-a', {content: 'private note', shareMode: 'private'});
  await service.save('owner-b', {content: 'other note', shareMode: 'ask-first'});
  await service.remove('owner-a');
  assert.equal((await service.read('owner-a')).context, null);
  assert.equal((await service.read('owner-b')).context?.content, 'other note');
});

test('requests stay pending, reject duplicates, and refuse self-accept', async () => {
  const service = new RequestService(new MemoryRequestRepository(), () => Date.parse('2026-11-01T00:00:00.000Z'), () => 'req-1');
  const created = await service.create('owner-a', {
    providerId: 'sample-meera',
    providerName: 'Meera',
    topic: 'Work',
    context: 'hello',
    mode: 'chat',
  });
  assert.equal(created.request.status, 'pending');
  await assert.rejects(() => service.create('owner-a', {
    providerId: 'sample-meera',
    providerName: 'Meera',
    topic: 'Work',
    context: 'again',
    mode: 'chat',
  }), /already have an active request/);
  await assert.rejects(() => service.change('owner-a', {id: 'req-1', action: 'accept'}), /Only the recipient/);
  const cancelled = await service.change('owner-a', {id: 'req-1', action: 'cancel'});
  assert.equal(cancelled.request.status, 'cancelled');
});

test('an enrolled listener can accept a paired request and the client sees it', async () => {
  const requests = new MemoryRequestRepository();
  const profiles = new MemoryProfileRepository();
  const profileService = new ProfileService(profiles, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 0.1);
  await profileService.enroll('listener-1', {clientEnrolled: false, listenerEnrolled: true, displayName: 'Asha'});
  const code = (await profileService.read('listener-1')).profile?.pairingCode;
  assert.ok(code);
  const service = new RequestService(requests, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 'pair-1', profiles);
  const created = await service.create('client-1', {
    topic: 'Work',
    context: 'I need a quiet listen',
    mode: 'chat',
    pairingCode: code,
  });
  assert.equal(created.request.providerName, 'Asha');
  assert.equal(created.request.status, 'pending');
  const incoming = await service.list('listener-1');
  assert.equal(incoming.incoming[0]?.id, 'pair-1');
  const accepted = await service.change('listener-1', {id: 'pair-1', action: 'accept'});
  assert.equal(accepted.request.status, 'accepted');
  const outgoing = await service.list('client-1');
  assert.equal(outgoing.requests[0]?.status, 'accepted');
});

test('private context is encrypted at rest and returns plaintext to the owner', async () => {
  const key = 'a'.repeat(64);
  const cipher = new AesGcmCipher(key);
  const memory = new MemoryContextRepository();
  const service = new ContextService(new EncryptedContextRepository(memory, cipher));
  await service.save('owner-a', {content: 'keep this private', shareMode: 'private'});
  const stored = await memory.findByOwner('owner-a');
  assert.ok(stored?.content.startsWith('saath-v1:'));
  assert.notEqual(stored?.content.includes('keep this private'), true);
  assert.equal((await service.read('owner-a')).context?.content, 'keep this private');
  assert.equal(createFieldCipher(undefined).configured(), false);
});

test('one account can enroll as client and listener, then switch roles', async () => {
  const service = new ProfileService(new MemoryProfileRepository(), () => Date.parse('2026-11-01T00:00:00.000Z'), () => 0.2);
  const first = await service.enroll('user-1', {clientEnrolled: true, listenerEnrolled: false, displayName: 'Riya'});
  assert.equal(first.profile.activeRole, 'client');
  assert.equal(first.profile.pairingCode, null);
  const both = await service.enroll('user-1', {clientEnrolled: true, listenerEnrolled: true});
  assert.equal(both.profile.clientEnrolled, true);
  assert.equal(both.profile.listenerEnrolled, true);
  assert.ok(both.profile.pairingCode);
  const switched = await service.switchRole('user-1', 'listener');
  assert.equal(switched.profile.activeRole, 'listener');
});

test('rehearsal does not fabricate a reply when the model is missing', async () => {
  const service = new RehearsalService(new MemoryLanguageModel(null, false), new MemoryUsageRepository());
  await assert.rejects(() => service.reply('owner-a', {
    messages: [{role: 'user', content: 'hello'}],
    scenario: 'A boundary',
    style: 'receptive',
  }), /not configured/);
});

test('rehearsal enforces the hourly usage limit', async () => {
  const usage = new MemoryUsageRepository();
  const service = new RehearsalService(new MemoryLanguageModel('A short fictional reply.'), usage, () => 0);
  for (let index = 0; index < 20; index += 1) {
    await service.reply('owner-a', {messages: [{role: 'user', content: 'hi'}], scenario: 'Work', style: 'receptive'});
  }
  await assert.rejects(() => service.reply('owner-a', {
    messages: [{role: 'user', content: 'hi'}],
    scenario: 'Work',
    style: 'receptive',
  }), /20 rehearsal replies/);
});

test('a sample request cannot target another account as the provider', async () => {
  const requests = new MemoryRequestRepository();
  const profiles = new MemoryProfileRepository();
  const service = new RequestService(requests, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 'forged-1', profiles);
  await assert.rejects(() => service.create('owner-a', {
    providerId: 'owner-b',
    providerName: 'Not a sample',
    topic: 'Work',
    context: 'private snapshot',
    mode: 'chat',
  }), /listed sample person/);
  assert.equal((await service.list('owner-b')).incoming.length, 0);
});

test('empty context is saved, updated, and deleted without touching another owner', async () => {
  const service = new ContextService(new MemoryContextRepository());
  const empty = await service.save('owner-a', {content: '', shareMode: 'private'});
  assert.equal(empty.context.content, '');
  await service.save('owner-b', {content: 'b stays', shareMode: 'ask-first'});
  const updated = await service.save('owner-a', {content: 'a now', shareMode: 'ask-first'});
  assert.equal(updated.context.content, 'a now');
  assert.equal((await service.read('owner-b')).context?.content, 'b stays');
  await service.remove('owner-a');
  assert.equal((await service.read('owner-a')).context, null);
  assert.equal((await service.read('owner-b')).context?.content, 'b stays');
});

test('rehearsal maps timeout, empty output, and upstream failure without leaking secrets', async () => {
  const timeout = new MemoryLanguageModel('unused', true);
  timeout.complete = async () => {
    const error = new Error('aborted');
    error.name = 'TimeoutError';
    throw error;
  };
  await assert.rejects(
    () => new RehearsalService(timeout, new MemoryUsageRepository(), () => 0).reply('owner-a', {
      messages: [{role: 'user', content: 'hi'}],
      scenario: 'Work',
    }),
    /took too long/,
  );

  const empty = new MemoryLanguageModel('', true);
  empty.complete = async () => {
    throw new AppError(502, 'The AI provider returned an empty response.');
  };
  await assert.rejects(
    () => new RehearsalService(empty, new MemoryUsageRepository(), () => 0).reply('owner-a', {
      messages: [{role: 'user', content: 'hi'}],
      scenario: 'Work',
    }),
    /empty response/,
  );

  const upstream = new MemoryLanguageModel('unused', true);
  upstream.complete = async () => {
    throw new AppError(502, 'The AI provider could not respond. Please try again.');
  };
  await assert.rejects(
    () => new RehearsalService(upstream, new MemoryUsageRepository(), () => 0).reply('owner-a', {
      messages: [{role: 'user', content: 'hi'}],
      scenario: 'Work',
    }),
    /could not respond/,
  );

  const seen = [];
  const probe = new MemoryLanguageModel('Fictional reply only.', true);
  probe.complete = async input => {
    seen.push(input);
    return 'Fictional reply only.';
  };
  const result = await new RehearsalService(probe, new MemoryUsageRepository(), () => 0).reply('owner-a', {
    messages: [{role: 'user', content: 'Just the line I typed'}],
    scenario: 'A boundary',
  });
  assert.equal(result.reply, 'Fictional reply only.');
  assert.match(result.disclaimer, /does not predict/);
  assert.equal(JSON.stringify(seen).includes('sk-'), false);
  assert.equal(JSON.stringify(seen[0].messages).includes('secret-private-context'), false);
});

test('rehearsal quota is isolated per user and holds under concurrent requests', async () => {
  const usage = new MemoryUsageRepository();
  const service = new RehearsalService(new MemoryLanguageModel('ok'), usage, () => 0);
  const first = await Promise.all(Array.from({length: 20}, () => service.reply('owner-a', {
    messages: [{role: 'user', content: 'hi'}],
    scenario: 'Work',
  })));
  assert.equal(first.length, 20);
  const overflow = await Promise.allSettled(Array.from({length: 5}, () => service.reply('owner-a', {
    messages: [{role: 'user', content: 'hi'}],
    scenario: 'Work',
  })));
  assert.equal(overflow.every(item => item.status === 'rejected'), true);
  const other = await service.reply('owner-b', {
    messages: [{role: 'user', content: 'hi'}],
    scenario: 'Work',
  });
  assert.equal(other.reply, 'ok');
});

test('reports require an authenticated owner and store only the submitted fields', async () => {
  const store = new MemoryReportRepository();
  const service = new ReportService(store, () => 'rep-1');
  await assert.rejects(() => service.submit('', {targetId: 'sample-meera', reason: 'Unwanted contact'}), /Sign in/);
  const saved = await service.submit('owner-a', {targetId: 'sample-meera', reason: 'Unwanted contact'});
  assert.equal(saved.ok, true);
  assert.equal(store.rows[0].ownerId, 'owner-a');
  assert.equal(store.rows[0].reason, 'Unwanted contact');
});
