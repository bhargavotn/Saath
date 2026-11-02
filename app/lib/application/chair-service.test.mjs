import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ChairService} from './chair-service.ts';
import {RehearsalService} from './rehearsal-service.ts';
import {ProfileService} from './profile-service.ts';
import {MemoryChairRepository, MemoryLanguageModel, MemoryProfileRepository, MemoryUsageRepository} from '../infrastructure/memory.ts';
import {PlainCipher, AesGcmCipher} from '../infrastructure/aes-gcm-cipher.ts';

function chairs(options = {}) {
  const store = options.store ?? new MemoryChairRepository();
  const profiles = options.profiles ?? new MemoryProfileRepository();
  const rehearsal = options.rehearsal ?? new RehearsalService(new MemoryLanguageModel('I hear that this mattered.', true), new MemoryUsageRepository(), () => 0);
  const cipher = options.cipher ?? new PlainCipher();
  return {
    store,
    profiles,
    service: new ChairService(store, cipher, profiles, rehearsal, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 0.3, () => 'chair-1', options.voice ?? false),
  };
}

test('same-device rooms persist turns and refuse voice until LiveKit exists', async () => {
  const {service} = chairs();
  const created = await service.create('host-1', {mode: 'same-device', displayName: 'Riya'});
  assert.equal(created.session.status, 'waiting');
  assert.equal(created.session.code.length, 6);
  const started = await service.act('host-1', {id: 'chair-1', action: 'start'});
  assert.equal(started.session.status, 'active');
  assert.equal(started.session.stage, 'agree');
  const next = await service.act('host-1', {id: 'chair-1', action: 'next'});
  assert.equal(next.session.stage, 'a-speaks');
  await assert.rejects(() => service.act('host-1', {id: 'chair-1', action: 'call'}), /LIVEKIT_URL/);
  await assert.rejects(() => service.read('stranger', 'chair-1'), /not found/);
});

test('a second person must actually join a paired room before it can start', async () => {
  const profiles = new MemoryProfileRepository();
  const profileService = new ProfileService(profiles, () => Date.parse('2026-11-01T00:00:00.000Z'), () => 0.4);
  await profileService.enroll('listener-1', {clientEnrolled: false, listenerEnrolled: true, displayName: 'Asha'});
  const code = (await profileService.read('listener-1')).profile?.pairingCode;
  const {service} = chairs({profiles});
  const created = await service.create('client-1', {mode: 'paired', displayName: 'Riya', pairingCode: code});
  assert.equal(created.session.guestJoined, false);
  await assert.rejects(() => service.act('client-1', {id: 'chair-1', action: 'start'}), /has not joined/);
  const joined = await service.join('listener-1', created.session.code, 'Asha');
  assert.equal(joined.session.guestJoined, true);
  assert.equal(joined.session.you, 'guest');
  const started = await service.act('listener-1', {id: 'chair-1', action: 'start'});
  assert.equal(started.session.status, 'active');
});

test('AI chair replies only on Person B steps and stays fictional', async () => {
  const {service} = chairs();
  await service.create('host-1', {mode: 'ai', displayName: 'Riya'});
  await service.act('host-1', {id: 'chair-1', action: 'start'});
  await assert.rejects(() => service.act('host-1', {id: 'chair-1', action: 'ai-turn', message: 'Can you speak now?'}), /Person B step/);
  await service.act('host-1', {id: 'chair-1', action: 'next'});
  await service.act('host-1', {id: 'chair-1', action: 'next'});
  const replied = await service.act('host-1', {id: 'chair-1', action: 'ai-turn', message: 'I felt unheard at dinner.'});
  assert.equal(replied.session.stage, 'b-reflects');
  assert.match(replied.session.aiReply, /this mattered/);
});

test('chair notes are encrypted at rest', async () => {
  const store = new MemoryChairRepository();
  const cipher = new AesGcmCipher('b'.repeat(64));
  const {service} = chairs({store, cipher});
  await service.create('host-1', {mode: 'same-device'});
  await service.act('host-1', {id: 'chair-1', action: 'note', note: 'keep this between us'});
  const stored = await store.findById('chair-1');
  assert.ok(stored?.note.startsWith('saath-v1:'));
  assert.equal(stored?.note.includes('keep this between us'), false);
  assert.equal((await service.read('host-1', 'chair-1')).session.note, 'keep this between us');
});
