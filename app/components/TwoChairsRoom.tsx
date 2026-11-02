'use client';

import { useEffect, useState } from 'react';
import { Armchair, ArrowRight, Pause, Play, ShieldCheck } from 'lucide-react';
import { api, localActor, setLocalActor } from '@/lib/client/api';
import { chairSpeaker, type ChairStage, type EnrollmentProfile } from '@/lib/domain';
import type { ChairSessionMode, PublicChair } from '@/lib/application/ports';

const chairCopy: Record<ChairStage, { title: string; text: string }> = {
  agree: { title: 'Both people agree to participate', text: 'Stay only if both of you freely agree. Either person may pass, pause, or leave.' },
  'a-speaks': { title: 'Person A speaks', text: 'Person A says what happened, how it felt, and what they need. Person B listens.' },
  'b-reflects': { title: 'Person B reflects what they understood', text: 'Person B tries “What I’m hearing is…”. Advice can wait.' },
  'a-clarifies': { title: 'Person A clarifies', text: 'Person A can correct, add, or pass. Then you may switch roles.' },
  switch: { title: 'Switch roles', text: 'Person B will speak next. Person A will listen.' },
  'b-speaks': { title: 'Person B speaks', text: 'Person B has the same room to speak without interruption.' },
  'a-reflects': { title: 'Person A reflects what they understood', text: 'Person A reflects, then checks whether they understood.' },
  'b-clarifies': { title: 'Person B clarifies', text: 'Person B can correct or pass.' },
  closing: { title: 'Optional closing reflection', text: 'Name one thing you heard, or choose to stop here. There is no recording by default.' },
};

const stages: ChairStage[] = ['agree', 'a-speaks', 'b-reflects', 'a-clarifies', 'switch', 'b-speaks', 'a-reflects', 'b-clarifies', 'closing'];

type Props = {
  auth: boolean;
  displayName: string;
  profile: EnrollmentProfile | null;
  aiConfigured: boolean;
  voiceConfigured: boolean;
  onNotice: (message: string) => void;
};

export default function TwoChairsRoom({ auth, displayName, profile, aiConfigured, voiceConfigured, onNotice }: Props) {
  const [mode, setMode] = useState<ChairSessionMode>('same-device');
  const [session, setSession] = useState<PublicChair | null>(null);
  const [sessions, setSessions] = useState<PublicChair[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [note, setNote] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [actor, setActor] = useState<'host' | 'guest'>(localActor());

  useEffect(() => {
    if (!auth) return;
    api<{ sessions: PublicChair[] }>('/api/chairs').then(result => {
      const rows = result.sessions || [];
      setSessions(rows);
      const open = rows.find(row => row.status !== 'closed');
      if (open) {
        setSession(open);
        setNote(open.note);
      }
    }).catch(() => {});
  }, [auth]);

  useEffect(() => {
    if (!auth || !session || session.status === 'closed' || session.mode !== 'paired') return;
    const timer = window.setInterval(() => {
      api<{ session: PublicChair }>(`/api/chairs?id=${encodeURIComponent(session.id)}`).then(result => {
        setSession(result.session);
        setNote(result.session.note);
      }).catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [auth, session?.id, session?.status, session?.mode]);

  async function createRoom() {
    if (!auth) {
      window.location.href = '/?view=enroll';
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ session: PublicChair }>('/api/chairs', 'POST', {
        mode,
        displayName: displayName || profile?.displayName || 'Person A',
        pairingCode: mode === 'paired' && pairingCode.trim() ? pairingCode.trim().toUpperCase() : undefined,
      });
      setSession(result.session);
      setNote(result.session.note);
      onNotice(mode === 'paired'
        ? `Room ${result.session.code} is waiting. The other person joins with that code.`
        : mode === 'ai'
          ? 'Fictional Person B is ready when you reach a Person B step.'
          : 'Same-device room saved. You can start when both of you are ready.');
    } catch (error) {
      onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (!auth) {
      window.location.href = '/?view=enroll';
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ session: PublicChair }>('/api/chairs/join', 'POST', {
        code: joinCode.trim().toUpperCase(),
        displayName: displayName || profile?.displayName || 'Person B',
      });
      setSession(result.session);
      setNote(result.session.note);
      onNotice(result.session.you === 'guest' ? 'You joined as Person B.' : 'You are already the host of this room.');
    } catch (error) {
      onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(action: 'start' | 'next' | 'pause' | 'resume' | 'leave' | 'note' | 'ai-turn' | 'call', extra: { note?: string; message?: string } = {}) {
    if (!session) return;
    setBusy(true);
    try {
      const result = await api<{ session: PublicChair }>('/api/chairs', 'PATCH', { id: session.id, action, ...extra });
      if (action === 'leave' || result.session.status === 'closed') {
        setSession(null);
        setNote('');
        onNotice('The room is closed.');
        const listed = await api<{ sessions: PublicChair[] }>('/api/chairs').catch(() => ({ sessions: [] }));
        setSessions(listed.sessions || []);
        return;
      }
      setSession(result.session);
      setNote(result.session.note);
      if (action === 'ai-turn') onNotice('Fictional Person B answered. This does not predict a real person.');
    } catch (error) {
      onNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function switchLocalActor(next: 'host' | 'guest') {
    setLocalActor(next);
    setActor(next);
    setSession(null);
    window.location.reload();
  }

  const stage = session?.stage ?? 'agree';
  const stepIndex = Math.max(0, stages.indexOf(stage));
  const speaker = chairSpeaker(stage);
  const canAskAi = Boolean(session && session.mode === 'ai' && session.status === 'active' && !session.paused && (speaker === 'b' || stage === 'switch'));

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">LESS INTERRUPTING. MORE UNDERSTANDING.</div>
        <h1>Two chairs.<br/><em>Room for both of you.</em></h1>
        <p>Open a saved room. A second person is shown only after they join. The AI chair stays fictional.</p>
      </div>

      <div className="sample-notice">
        <ShieldCheck size={18}/>
        <span>
          {voiceConfigured
            ? 'Voice environment values are present, but a live call room is not implemented yet. '
            : 'Voice calling is not connected. '}
          Text turns work now. {aiConfigured ? 'AI rehearsal is configured for the fictional chair.' : 'AI is not configured yet, so the fictional chair cannot answer.'}
        </span>
      </div>

      {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="plain-panel chair-local">
          <h2>Local two-person test</h2>
          <p>This tab is {actor === 'guest' ? 'Guest' : 'Seedy'}. Open another tab, switch that tab to Guest, then join the room code.</p>
          <div className="inline-actions">
            <button className={actor === 'host' ? 'button' : 'outline-button'} type="button" onClick={() => switchLocalActor('host')}>This tab: Seedy</button>
            <button className={actor === 'guest' ? 'button' : 'outline-button'} type="button" onClick={() => switchLocalActor('guest')}>This tab: Guest</button>
          </div>
        </div>
      )}

      {!session && (
        <>
          <div className="choice-grid">
            {([
              ['same-device', 'Same-device guided exercise', 'Both people share one screen. Turns are saved on the server.'],
              ['ai', 'Fictional AI chair', 'You sit as Person A. A clearly fictional Person B answers on B steps.'],
              ['paired', 'Connect a person', 'Share a room code, or a listener pairing code. Presence waits for a real join.'],
            ] as [ChairSessionMode, string, string][]).map(([id, title, text]) => (
              <button type="button" key={id} className={mode === id ? 'selected' : ''} onClick={() => setMode(id)}>
                <strong>{title}</strong>
                {text}
              </button>
            ))}
          </div>
          {mode === 'paired' && (
            <label>
              Listener pairing code, optional
              <input value={pairingCode} onChange={event => setPairingCode(event.target.value.toUpperCase())} maxLength={6} placeholder="If you have one"/>
            </label>
          )}
          <div className="inline-actions">
            <button className="button" type="button" disabled={busy} onClick={createRoom}>
              {auth ? 'Open a room' : 'Sign in to open a room'} <ArrowRight size={16}/>
            </button>
          </div>
          <section className="plain-panel">
            <h2>Join with a room code</h2>
            <p>If someone already opened a paired room, enter the six-character code they share with you.</p>
            <input aria-label="Room code" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ROOM CODE"/>
            <div className="inline-actions">
              <button className="outline-button" type="button" disabled={busy || joinCode.trim().length !== 6} onClick={joinRoom}>Join as Person B</button>
            </div>
          </section>
          {sessions.some(row => row.status !== 'closed') && (
            <section className="plain-panel">
              <h2>Open rooms on this account</h2>
              {sessions.filter(row => row.status !== 'closed').map(row => (
                <button type="button" className="request-row" key={row.id} onClick={() => { setSession(row); setNote(row.note); }}>
                  <div>
                    <strong>{row.code}</strong>
                    <span>{row.mode} · {row.status} · {row.you}</span>
                  </div>
                  <span className="status-badge">{row.guestJoined ? 'Person B is here' : 'Waiting'}</span>
                </button>
              ))}
            </section>
          )}
        </>
      )}

      {session && (
        <>
          <div className="chairs-room">
            <div className="chairs-stage">
              <div className={speaker === 'a' || speaker === 'both' ? 'chair-seat speaking' : 'chair-seat'}>
                <Armchair size={103} strokeWidth={1}/>
                <span>{session.hostName || 'Person A'}</span>
              </div>
              <div className="between-chairs"><span>✳</span><div/></div>
              <div className={speaker === 'b' || speaker === 'both' ? 'chair-seat speaking' : 'chair-seat'}>
                <Armchair size={103} strokeWidth={1}/>
                <span>{session.guestName || (session.mode === 'ai' ? 'Fictional chair' : 'Person B')}</span>
              </div>
            </div>
            <div className="chair-instructions">
              <span className="eyebrow">
                {session.status === 'closed'
                  ? 'ROOM CLOSED'
                  : session.paused
                    ? 'TAKE THE TIME YOU NEED'
                    : session.status === 'waiting'
                      ? `ROOM ${session.code}`
                      : `STEP ${stepIndex + 1} OF ${stages.length}`}
              </span>
              <h2>
                {session.status === 'closed'
                  ? 'You made space for each other.'
                  : session.paused
                    ? 'A pause is part of the conversation.'
                    : session.status === 'waiting'
                      ? session.mode === 'paired' && !session.guestJoined
                        ? 'Waiting for the other person.'
                        : 'Agree to listen. Agree you can pause.'
                      : chairCopy[stage].title}
              </h2>
              <p>
                {session.status === 'closed'
                  ? 'The room is closed. Notes stay on this account.'
                  : session.paused
                    ? 'You can return when you both feel ready, or leave the exercise here.'
                    : session.status === 'waiting' && session.mode === 'paired' && !session.guestJoined
                      ? `Share ${session.code}. No one is shown in the other chair until they join.`
                      : chairCopy[stage].text}
              </p>
              <p className="small-print">You are {session.you === 'host' ? 'Person A' : 'Person B'} · {session.mode} · {session.guestJoined ? 'Person B has joined' : 'Person B has not joined'}</p>
              <div className="chair-controls">
                {session.status === 'waiting' && (
                  <button className="button" type="button" disabled={busy || (session.mode === 'paired' && !session.guestJoined)} onClick={() => act('start')}>
                    We’re ready <ArrowRight size={17}/>
                  </button>
                )}
                {session.status === 'active' && (
                  <>
                    <button className="outline-button" type="button" disabled={busy} onClick={() => act(session.paused ? 'resume' : 'pause')}>
                      {session.paused ? <Play size={16}/> : <Pause size={16}/>} {session.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button className="button" type="button" disabled={busy || session.paused} onClick={() => act('next')}>
                      {stage === 'closing' ? 'Finish gently' : 'Next step'} <ArrowRight size={17}/>
                    </button>
                  </>
                )}
                <button className="quiet" type="button" disabled={busy} onClick={() => act('leave')}>Leave room</button>
              </div>
            </div>
          </div>

          {session.mode === 'ai' && (
            <section className="plain-panel">
              <h2>Fictional Person B</h2>
              <p>This chair answers only on Person B steps. It does not predict a real person.</p>
              <textarea aria-label="Message for the fictional chair" value={aiMessage} onChange={event => setAiMessage(event.target.value)} maxLength={2000} placeholder="What should Person B hear or reflect?"/>
              <div className="inline-actions">
                <button className="button" type="button" disabled={busy || !canAskAi} onClick={() => act('ai-turn', { message: aiMessage })}>
                  Ask fictional chair <ArrowRight size={16}/>
                </button>
              </div>
              {session.aiReply && <p className="intro-preview">{session.aiReply}</p>}
            </section>
          )}

          <div className="two-column">
            <section className="plain-panel">
              <h2>A thought to keep</h2>
              <p>Saved on this room and encrypted at rest when the server key is set. The server can still decrypt it for you.</p>
              <textarea placeholder="One thing I want to remember…" value={note} onChange={event => setNote(event.target.value)} maxLength={2000}/>
              <button className="text-button" type="button" disabled={busy} onClick={() => act('note', { note })}>Save note</button>
            </section>
            <section className="plain-panel">
              <h2>Call or invite</h2>
              <p>Room code <strong>{session.code}</strong>. A live call is not opened from here yet.</p>
              <div className="inline-actions">
                <button className="outline-button" type="button" disabled={busy} onClick={() => act('call')}>Try a voice call</button>
                <button className="text-button" type="button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`Two Chairs room ${session.code}. Join in Saath with that code when you are ready.`);
                    onNotice('Room code copied. Send it only to the person you asked.');
                  } catch {
                    onNotice('Copy is not available. Write the room code down.');
                  }
                }}>Copy room invite</button>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
