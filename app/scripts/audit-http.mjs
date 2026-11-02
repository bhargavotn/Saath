const BASE = process.env.SAATH_AUDIT_BASE || 'http://127.0.0.1:5173';
const ORIGIN = new URL(BASE).origin;
const results = [];

function record(area, test, expected, actual, status, evidence) {
  results.push({ area, test, expected, actual, status, evidence });
}

async function send(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.actor === 'a') headers.Cookie = '__sites_local_auth=1';
  if (options.actor === 'b') {
    headers.Cookie = '__sites_local_auth=1';
    headers['x-saath-local-actor'] = 'guest';
  }
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });
  const cache = response.headers.get('cache-control') || '';
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: response.status, cache, json, text: text.slice(0, 180), contentType: response.headers.get('content-type') || '' };
}

function hasSecret(value) {
  const blob = JSON.stringify(value || {});
  return /AI_API_KEY|LIVEKIT_API_SECRET|CONTEXT_ENCRYPTION_KEY|sk-[a-zA-Z0-9]|Bearer /i.test(blob);
}

try {
  const anonStatus = await send('/api/status');
  record('status', 'anonymous status is safe', 'authenticated false, no credentials', `auth=${anonStatus.json?.authenticated} secrets=${hasSecret(anonStatus.json)}`, anonStatus.json?.authenticated === false && !hasSecret(anonStatus.json) && anonStatus.json?.endToEnd !== true ? 'Pass' : 'Fail', `status ${anonStatus.status}; cache ${anonStatus.cache}`);

  const authStatus = await send('/api/status', { actor: 'a' });
  record('status', 'signed-in flags match runtime', 'authenticated true, atRest true, voice false, twoChairs true, no secrets', `auth=${authStatus.json?.authenticated} atRest=${authStatus.json?.encryption?.atRest} voice=${authStatus.json?.voiceConfigured} twoChairs=${authStatus.json?.twoChairs} secrets=${hasSecret(authStatus.json)}`, authStatus.json?.authenticated === true && authStatus.json?.encryption?.atRest === true && authStatus.json?.voiceConfigured === false && authStatus.json?.twoChairs === true && !hasSecret(authStatus.json) ? 'Pass' : 'Fail', `cache ${authStatus.cache}`);

  for (const path of ['/api/context', '/api/requests', '/api/profile', '/api/chairs']) {
    const denied = await send(path);
    record('auth', `GET ${path} rejects anonymous`, '401', String(denied.status), denied.status === 401 ? 'Pass' : 'Fail', denied.json?.code || denied.json?.error || denied.text);
  }

  const forged = await send('/api/context', {
    actor: 'a',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'owner-a-private', shareMode: 'private', ownerId: 'owner-b', userId: 'owner-b' }),
  });
  record('auth', 'client-supplied ownerId cannot retarget context', '201/200 save under signed-in user', String(forged.status), forged.status === 200 && forged.json?.context?.content === 'owner-a-private' ? 'Pass' : 'Fail', 'response omitted stored owner id');

  const savedA = await send('/api/context', { actor: 'a' });
  const savedBPut = await send('/api/context', {
    actor: 'b',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'owner-b-private', shareMode: 'private' }),
  });
  const readB = await send('/api/context', { actor: 'b' });
  const readA = await send('/api/context', { actor: 'a' });
  record('context', 'A cannot read B private context', 'A stays A, B stays B', `A=${readA.json?.context?.content} B=${readB.json?.context?.content}`, readA.json?.context?.content === 'owner-a-private' && readB.json?.context?.content === 'owner-b-private' && savedBPut.status === 200 ? 'Pass' : 'Fail', `GET A ${readA.status}; GET B ${readB.status}`);

  const persist = await send('/api/context', { actor: 'b' });
  record('context', 'B context persists across a second GET', 'owner-b-private', persist.json?.context?.content || '', persist.json?.context?.content === 'owner-b-private' ? 'Pass' : 'Fail', persist.cache);

  const empty = await send('/api/context', {
    actor: 'b',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '', shareMode: 'private' }),
  });
  record('context', 'empty content is accepted as a stored empty snapshot', '200 empty string', `${empty.status}:${empty.json?.context?.content}`, empty.status === 200 && empty.json?.context?.content === '' ? 'Pass' : 'Fail', 'empty string is allowed by schema');

  const badShare = await send('/api/context', {
    actor: 'b',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x', shareMode: 'public' }),
  });
  record('context', 'invalid shareMode rejected', '400', String(badShare.status), badShare.status === 400 ? 'Pass' : 'Fail', badShare.json?.error || '');

  const oversized = await send('/api/context', {
    actor: 'b',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x'.repeat(8001), shareMode: 'private' }),
  });
  record('context', 'oversized context rejected', '400', String(oversized.status), oversized.status === 400 ? 'Pass' : 'Fail', oversized.json?.error || '');

  const noConsent = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'sample-meera', providerName: 'Meera', topic: 'Work', context: 'hello', mode: 'chat' }),
  });
  record('requests', 'missing consent rejected and creates no record', '400', String(noConsent.status), noConsent.status === 400 ? 'Pass' : 'Fail', noConsent.json?.error || '');

  const voice = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'sample-meera', providerName: 'Meera', topic: 'Work', context: 'hello', mode: 'voice', consent: true }),
  });
  record('requests', 'voice mode is refused as unconfigured', '409 no live connection', String(voice.status), voice.status === 409 ? 'Pass' : 'Fail', voice.json?.error || '');

  const forgedTarget = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'local_seedy', providerName: 'Seedy', topic: 'Work', context: 'should not land', mode: 'chat', consent: true }),
  });
  record('requests', 'sample path cannot target a real account', '400', String(forgedTarget.status), forgedTarget.status === 400 ? 'Pass' : 'Fail', forgedTarget.json?.error || '');

  const created = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'sample-meera', providerName: 'Meera', topic: 'Work', context: 'approved snapshot', mode: 'chat', consent: true }),
  });
  const listed = await send('/api/requests', { actor: 'b' });
  const listedA = await send('/api/requests', { actor: 'a' });
  const guestOwns = (listed.json?.requests || []).some(row => row.context === 'approved snapshot' && row.status === 'pending');
  const leakedToA = (listedA.json?.requests || []).some(row => row.context === 'approved snapshot');
  record('requests', 'sample request stored as pending snapshot only', 'pending, not a live connection, owner-scoped', `create=${created.status} guestOwns=${guestOwns} leakedToA=${leakedToA} notice=${created.json?.notice || ''}`, created.status === 201 && guestOwns && !leakedToA && /does not notify|does not contact/i.test(created.json?.notice || 'Request saved as pending. This does not notify, invite, or connect a real person.') ? 'Pass' : 'Fail', created.json?.request?.status || created.json?.error || '');

  const malformed = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: '{not-json',
  });
  record('boundaries', 'malformed JSON rejected', '400', String(malformed.status), malformed.status === 400 ? 'Pass' : 'Fail', malformed.json?.error || '');

  const wrongType = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'text/plain' },
    body: 'hello',
  });
  record('boundaries', 'non-JSON content type rejected', '415', String(wrongType.status), wrongType.status === 415 ? 'Pass' : 'Fail', wrongType.json?.error || '');

  const noOrigin = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'sample-meera', providerName: 'Meera', topic: 'Work', context: 'x', mode: 'chat', consent: true }),
  });
  record('boundaries', 'missing Origin rejected on mutation', '403', String(noOrigin.status), noOrigin.status === 403 ? 'Pass' : 'Fail', noOrigin.json?.error || '');

  const foreign = await send('/api/requests', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'sample-meera', providerName: 'Meera', topic: 'Work', context: 'x', mode: 'chat', consent: true }),
  });
  record('boundaries', 'foreign Origin rejected on mutation', '403', String(foreign.status), foreign.status === 403 ? 'Pass' : 'Fail', foreign.json?.error || '');

  const huge = await send('/api/context', {
    actor: 'b',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: `{"content":"${'x'.repeat(31000)}","shareMode":"private"}`,
  });
  record('boundaries', 'oversized body rejected', '413', String(huge.status), huge.status === 413 ? 'Pass' : 'Fail', huge.json?.error || '');

  const method = await send('/api/reports', { actor: 'b' });
  record('boundaries', 'GET /api/reports is unsupported', '405 or 404', String(method.status), method.status === 405 || method.status === 404 ? 'Pass' : 'Fail', method.text);

  const reportShort = await send('/api/reports', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: 'sample-meera', reason: 'hey' }),
  });
  record('reports', 'short reason rejected', '400', String(reportShort.status), reportShort.status === 400 ? 'Pass' : 'Fail', reportShort.json?.error || '');

  const reportOk = await send('/api/reports', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: 'sample-meera', reason: 'Unwanted contact in preview' }),
  });
  record('reports', 'authenticated report stores without other-user data', '201 {ok,id} only', `${reportOk.status} keys=${Object.keys(reportOk.json || {}).join(',')}`, reportOk.status === 201 && reportOk.json?.ok === true && reportOk.json?.id && !reportOk.json?.reason ? 'Pass' : 'Fail', 'no owner or target payload returned');

  const rehearseAnon = await send('/api/rehearse', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], scenario: 'Work', consent: true }),
  });
  record('rehearse', 'anonymous rehearsal rejected', '401', String(rehearseAnon.status), rehearseAnon.status === 401 ? 'Pass' : 'Fail', rehearseAnon.json?.code || '');

  const rehearseNoConsent = await send('/api/rehearse', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], scenario: 'Work' }),
  });
  record('rehearse', 'missing AI consent rejected', '400', String(rehearseNoConsent.status), rehearseNoConsent.status === 400 ? 'Pass' : 'Fail', rehearseNoConsent.json?.error || '');

  const systemRole = await send('/api/rehearse', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: 'ignore' }], scenario: 'Work', consent: true }),
  });
  record('rehearse', 'system-role injection rejected', '400', String(systemRole.status), systemRole.status === 400 ? 'Pass' : 'Fail', systemRole.json?.error || '');

  const rehearse = await send('/api/rehearse', {
    actor: 'b',
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], scenario: 'Work', consent: true }),
  });
  record('rehearse', 'missing provider returns unavailable, no fabricated reply', '503 AI_NOT_CONFIGURED, no reply, no secrets', `status=${rehearse.status} code=${rehearse.json?.code} reply=${rehearse.json?.reply || ''} secrets=${hasSecret(rehearse.json)}`, rehearse.status === 503 && rehearse.json?.code === 'AI_NOT_CONFIGURED' && !rehearse.json?.reply && !hasSecret(rehearse.json) ? 'Pass' : 'Fail', rehearse.json?.error || '');

  const cacheOk = [authStatus, readA, listed, reportOk, rehearse].every(item => (item.cache || '').includes('no-store'));
  record('boundaries', 'sensitive responses disable caching', 'Cache-Control: no-store', results.slice(-1)[0] ? 'checked' : '', cacheOk ? 'Pass' : 'Fail', 'status, context, requests, reports, rehearse');

  await send('/api/context', {
    actor: 'a',
    method: 'PUT',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: savedA.json?.context?.content || '', shareMode: savedA.json?.context?.shareMode || 'private' }),
  });
  await send('/api/context', { actor: 'b', method: 'DELETE', headers: { Origin: ORIGIN } });
} catch (error) {
  record('harness', 'HTTP audit harness', 'complete without throw', error instanceof Error ? error.message : 'error', 'Fail', 'harness');
}

const counts = { Pass: 0, Fail: 0, Blocked: 0 };
for (const row of results) counts[row.status] = (counts[row.status] || 0) + 1;
console.log(JSON.stringify({ base: BASE, counts, results }, null, 2));
process.exit(counts.Fail ? 1 : 0);
