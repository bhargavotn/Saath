'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { FIXTURE_NOTICE, type ConversationRecord } from '@/lib/domain';
import { appendConversationMessage, updateConversation } from '@/lib/client/store';

type Props = {
  conversation: ConversationRecord;
  onChange: (conversation: ConversationRecord) => void;
  flash: (message: string) => void;
  onReport: (targetId: string) => void;
};

const PAGE = 20;

export default function ConversationRoom({ conversation, onChange, flash, onReport }: Props) {
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const visible = useMemo(() => conversation.messages.slice(-page * PAGE), [conversation.messages, page]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy || conversation.left || conversation.paused || conversation.blocked) return;
    setBusy(true);
    const message = {
      id: crypto.randomUUID(),
      clientKey: crypto.randomUUID(),
      sender: 'you' as const,
      content: draft.trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
      status: 'sent' as const,
    };
    const next = appendConversationMessage(conversation.id, message);
    if (next) onChange(next);
    setDraft('');
    setBusy(false);
    flash('Message kept in this browser fixture. No live participant received it.');
  }

  return (
    <section className="rehearsal-layout">
      <aside className="settings-panel">
        <h2>{conversation.title}</h2>
        <p className="small-print">{FIXTURE_NOTICE}</p>
        <p className="small-print">Membership is checked in the interface. Server-side message persistence is waiting for the supplied schema.</p>
        <button type="button" className="outline-button" onClick={() => {
          const next = updateConversation(conversation.id, { paused: !conversation.paused });
          if (next) onChange(next);
        }}>{conversation.paused ? 'Resume' : 'Pause'}</button>
        <button type="button" className="outline-button" onClick={() => {
          const next = updateConversation(conversation.id, { left: true });
          if (next) onChange(next);
        }}>Leave</button>
        <button type="button" className="outline-button" onClick={() => {
          const next = updateConversation(conversation.id, { blocked: true, left: true });
          if (next) onChange(next);
          onReport(conversation.id);
        }}>Report and block</button>
        <p className="integration-state">Voice and video rooms are not connected. Camera and microphone are not requested here.</p>
      </aside>
      <section className="chat-panel">
        <div className="chat-header">
          <div>
            <strong>Text conversation</strong>
            <span>{conversation.left ? 'You left this conversation' : conversation.blocked ? 'Blocked' : conversation.paused ? 'Paused' : 'Development fixture'}</span>
          </div>
        </div>
        <div className="chat-messages" aria-live="polite">
          {conversation.messages.length > visible.length && (
            <button type="button" className="quiet" onClick={() => setPage(page + 1)}>Load earlier messages</button>
          )}
          {visible.map(message => (
            <div key={message.id} className={`message ${message.sender === 'you' ? 'user' : ''}`}>
              <span>{message.sender === 'you' ? 'YOU' : message.sender === 'system' ? 'SAATH' : 'COUNTERPART'}</span>
              <p>{message.content}</p>
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={send}>
          <textarea aria-label="Conversation message" value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} placeholder={conversation.left ? 'You have left this conversation.' : 'Write a message…'} disabled={conversation.left || conversation.paused || conversation.blocked}/>
          <button className="round-button" aria-label="Send message" disabled={busy || !draft.trim() || conversation.left || conversation.paused || conversation.blocked}><Send size={18}/></button>
        </form>
        <div className="chat-footer">Bounded messages · safe retry uses a client key so repeats are not duplicated in this fixture.</div>
      </section>
    </section>
  );
}
