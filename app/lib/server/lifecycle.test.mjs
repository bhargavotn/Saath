import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyRequestAction, expireIfNeeded, canTransitionActivity, composeIntroduction} from '../domain.ts';

test('owners can cancel pending requests and cannot accept themselves',()=>{
 assert.equal(applyRequestAction('pending','cancel','owner'),'cancelled');
 assert.throws(()=>applyRequestAction('pending','accept','owner'),/Only the recipient/);
 assert.throws(()=>applyRequestAction('cancelled','cancel','owner'),/cannot be cancelled/);
});

test('pending requests expire after seven days',()=>{
 const created = new Date('2026-01-01T00:00:00.000Z').toISOString();
 assert.equal(expireIfNeeded('pending', created, Date.parse('2026-01-02T00:00:00.000Z')), 'pending');
 assert.equal(expireIfNeeded('pending', created, Date.parse('2026-01-09T00:00:00.000Z')), 'expired');
 assert.equal(expireIfNeeded('accepted', created, Date.parse('2026-01-09T00:00:00.000Z')), 'accepted');
});

test('activity transitions stay inside the documented lifecycle',()=>{
 assert.equal(canTransitionActivity('not-started','in-progress'), true);
 assert.equal(canTransitionActivity('done','not-started'), false);
 assert.equal(canTransitionActivity('archived','not-started'), true);
});

test('introduction cards repeat the user words without inference',()=>{
 const text = composeIntroduction({
  beforeTalking: 'I need time.',
  supportStyle: 'listening',
  pace: 'time-to-think',
  offLimits: 'Work gossip',
  readiness: 'Ask for help',
 });
 assert.match(text, /I need time/);
 assert.doesNotMatch(text, /attachment|trauma|personality|diagnos/i);
});
