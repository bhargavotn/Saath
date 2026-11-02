'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Leaf, Pause, X } from 'lucide-react';
import { momentPhrases, samplePeople, urgentResources } from '@/lib/fixtures';
import { useAmbient } from '@/components/AmbientSound';
import BreathingExercise from '@/components/BreathingExercise';
import type { Person, View } from '@/lib/domain';

type Props = {
  go: (view: View) => void;
  enrolled: boolean;
  onPhrasePreview: (phrase: string, person: Person | null) => void;
};

export default function NeedAMoment({ go, enrolled, onPhrasePreview }: Props) {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [breathe, setBreathe] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  const ambient = useAmbient();

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className="moment-entry" onClick={() => { setOpen(true); setHelp(false); setPhrase(''); setBreathe(false); }}>
        Need a moment?
      </button>
      {open && (
        <div className="moment-screen" role="dialog" aria-modal="true" aria-labelledby="moment-title">
          <button type="button" className="moment-close" onClick={() => setOpen(false)} aria-label="Leave this quiet screen"><X size={18}/></button>
          <span className="eyebrow">ONE MOMENT AT A TIME</span>
          <h2 id="moment-title">You can take this one moment at a time.</h2>
          <p>What would feel helpful right now?</p>
          {breathe ? (
            <BreathingExercise
              onClose={() => setBreathe(false)}
              onReady={() => {
                setBreathe(false);
                setOpen(false);
                go(enrolled ? 'arrive' : 'enroll');
              }}
            />
          ) : (
          <div className="moment-choices">
            <button ref={first} type="button" onClick={() => { ambient.pause(); }}>Stay here quietly</button>
            <button type="button" onClick={() => setBreathe(true)}>A simple breathing guide</button>
            <button type="button" onClick={() => { if (ambient.playing) ambient.pause(); else void ambient.play('rain'); }}>
              {ambient.playing ? <><Pause size={16}/> Pause sound</> : 'Play a gentle sound'}
            </button>
            <button type="button" onClick={() => { setOpen(false); go('rehearsal'); }}>Help me find words</button>
            <button type="button" onClick={() => { setOpen(false); go('connect'); }}>Connect with someone</button>
          </div>
          )}
          <p className="small-print">Nothing here is required. Silence stays available. Sound and breathing are optional and are not treatment.</p>
          <div className="moment-phrases">
            <span className="eyebrow">PHRASES YOU CAN EDIT</span>
            <p>Selecting a phrase does not send it. You preview the recipient and exact words first.</p>
            {momentPhrases.map(item => (
              <button type="button" key={item} className={phrase === item ? 'selected' : ''} onClick={() => setPhrase(item)}>{item}</button>
            ))}
            <label htmlFor="moment-phrase">Exact message</label>
            <textarea id="moment-phrase" value={phrase} onChange={event => setPhrase(event.target.value)} maxLength={400} placeholder="Write or edit a phrase…"/>
            <button
              type="button"
              className="button"
              disabled={!phrase.trim()}
              onClick={() => {
                const person = samplePeople.find(item => !item.actuallyAvailable) ?? null;
                onPhrasePreview(phrase.trim(), person);
                setOpen(false);
              }}
            >
              Preview before sending <ArrowRight size={16}/>
            </button>
          </div>
          <p className="sample-notice"><Leaf size={16}/> Nobody is currently available as a live participant. AI personalities cannot accept a request. You can stay quiet, write, or explore rehearsal.</p>
          <button type="button" className="quiet" onClick={() => setHelp(value => !value)}>Urgent help</button>
          {help && (
            <div className="urgent-help">
              <h3>If you need urgent help</h3>
              <p>Saath does not dispatch emergency services and does not infer crisis from typing, sound, or camera. Use local emergency services if you are in immediate danger.</p>
              {urgentResources.map(resource => (
                <p key={resource.url}>
                  <a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>
                  <span> · {resource.region} · reviewed {resource.reviewedOn}</span>
                </p>
              ))}
              <p className="small-print">Regional phone numbers are not listed until they pass the documented review in URGENT_HELP.md. Unreviewed numbers are never invented here.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
