'use client';

import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { CommMode, ProviderDraft, ProviderRole } from '@/lib/domain';
import { saveProviderDraft } from '@/lib/client/store';
import { FIXTURE_NOTICE } from '@/lib/domain';

const emptyDraft = (): ProviderDraft => ({
  displayName: '',
  introduction: '',
  languages: '',
  topics: '',
  role: '',
  modes: ['chat'],
  price: '',
  availability: '',
  submittedAt: '',
});

type Props = {
  initial: ProviderDraft | null;
  onSaved: (draft: ProviderDraft) => void;
  flash: (message: string) => void;
};

export default function ProviderOnboarding({ initial, onSaved, flash }: Props) {
  const [draft, setDraft] = useState<ProviderDraft>(initial ?? emptyDraft());

  function toggleMode(mode: CommMode) {
    setDraft(current => ({
      ...current,
      modes: current.modes.includes(mode) ? current.modes.filter(item => item !== mode) : [...current.modes, mode],
    }));
  }

  return (
    <section>
      <div className="page-heading">
        <div className="eyebrow">LISTEN OR COUNSEL</div>
        <h1>Offer your presence.</h1>
        <p>A peer listener is not a therapist. Professional counsellors stay clearly labelled. You cannot verify yourself.</p>
      </div>
      <p className="sample-notice"><ShieldCheck size={17}/> {FIXTURE_NOTICE} Verification requires an authorised operator process.</p>
      <div className="plain-panel">
        <label>Display name<input value={draft.displayName} onChange={event => setDraft({ ...draft, displayName: event.target.value })} maxLength={80}/></label>
        <label>Introduction<textarea value={draft.introduction} onChange={event => setDraft({ ...draft, introduction: event.target.value })} maxLength={800}/></label>
        <label>Languages<input value={draft.languages} onChange={event => setDraft({ ...draft, languages: event.target.value })} placeholder="English, Hindi"/></label>
        <label>Topics<input value={draft.topics} onChange={event => setDraft({ ...draft, topics: event.target.value })} placeholder="Work, family"/></label>
        <label>Role
          <select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as ProviderRole | '' })}>
            <option value="">Choose a role</option>
            <option>Peer listener</option>
            <option>Counsellor</option>
          </select>
        </label>
        {draft.role === 'Peer listener' && <p className="small-print">Peer listeners offer lived understanding. This is not therapy, diagnosis, or professional counselling.</p>}
        {draft.role === 'Counsellor' && <p className="small-print">Counsellor is a role label only. Qualifications stay unverified until an authorised operator reviews them.</p>}
        <fieldset className="choice-grid">
          <legend>Supported communication modes</legend>
          {(['chat', 'voice', 'video'] as CommMode[]).map(mode => (
            <label key={mode} className="checkbox-label">
              <input type="checkbox" checked={draft.modes.includes(mode)} onChange={() => toggleMode(mode)}/>
              {mode}{mode !== 'chat' ? ' — provider not connected' : ''}
            </label>
          ))}
        </fieldset>
        <label>Price, if applicable<input value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} placeholder="Free or an amount. No payment is taken."/></label>
        <label>Availability<textarea value={draft.availability} onChange={event => setDraft({ ...draft, availability: event.target.value })} placeholder="Example hours only until live availability exists."/></label>
        <button
          type="button"
          className="button"
          disabled={!draft.displayName.trim() || !draft.role}
          onClick={() => {
            const saved = saveProviderDraft({ ...draft, submittedAt: new Date().toISOString() });
            onSaved(saved);
            flash('Onboarding draft saved in this browser. It is not a live listing and does not grant a verified badge.');
          }}
        >
          Save draft <ArrowRight size={16}/>
        </button>
      </div>
    </section>
  );
}
