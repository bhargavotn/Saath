'use client';

import { ArrowRight, Leaf } from 'lucide-react';
import { interestOptions, moodOptions, samplePeople } from '@/lib/fixtures';
import { labelMood, SAMPLE_PROFILE_NOTICE, type EnrollmentProfile, type InterestId, type MoodEntry, type MoodKind, type Person, type SessionRequest, type View } from '@/lib/domain';

type Props = {
  profile: EnrollmentProfile | null;
  incoming: SessionRequest[];
  accepted: SessionRequest[];
  moods: MoodEntry[];
  interests: InterestId[];
  onSaveMood: (mood: MoodKind) => void;
  onToggleInterest: (id: InterestId) => void;
  go: (view: View) => void;
  onTalkWithPersona: (person: Person) => void;
  onAskForPerson: () => void;
};

export default function ArriveHome({
  profile,
  incoming,
  accepted,
  moods,
  interests,
  onSaveMood,
  onToggleInterest,
  go,
  onTalkWithPersona,
  onAskForPerson,
}: Props) {
  const latest = moods[0] ?? null;
  const pendingIncoming = incoming.filter(item => item.status === 'pending');
  const personReady = accepted[0] ?? null;
  const suggested = samplePeople.find(item => {
    if (interests.includes('spiritual-life') || interests.includes('quiet-sitting')) return item.id === 'sample-kabir';
    if (interests.includes('work')) return item.id === 'sample-arjun';
    if (interests.includes('finding-words')) return item.id === 'sample-isha';
    if (interests.includes('family') || interests.includes('alongside')) return item.id === 'sample-meera';
    return item.id === 'sample-isha';
  }) ?? samplePeople[2];

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">ONE SHARED HOME</div>
        <h1>A place to say what you came to say.</h1>
        <p>
          This first visit is for the person who wants to express themselves.
          Explore what you need, mark a mood, share an interest, then sit with a person if one has actually accepted — or with a clearly fictional AI personality if not.
        </p>
      </div>
      <p className="sample-notice">
        <Leaf size={17}/>
        {profile?.displayName || 'You'}
        {profile?.clientEnrolled ? ' · client' : ''}
        {profile?.listenerEnrolled ? ' · listener' : ''}
        . Client and listener share this home. Saath does not decide that you need a human. You can ask for a person at any time.
      </p>

      <section className="plain-panel arrive-next">
        <span className="eyebrow">WHAT HAPPENS NEXT</span>
        {personReady ? (
          <>
            <h2>A person has accepted.</h2>
            <p>{personReady.providerName} accepted your request. Open Two Chairs when you are both ready. Voice is not claimed unless a room provider is configured.</p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={() => go('chairs')}>Open Two Chairs <ArrowRight size={16}/></button>
              <button type="button" className="outline-button" onClick={() => go('activities')}>Do a shared activity</button>
            </div>
          </>
        ) : pendingIncoming.length ? (
          <>
            <h2>Someone is waiting for you.</h2>
            <p>A paired request is pending. Accept only if you can sit with them. This is the human path.</p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={() => go('connect')}>Review incoming requests <ArrowRight size={16}/></button>
            </div>
          </>
        ) : (
          <>
            <h2>No live person is waiting.</h2>
            <p>
              You can talk with {suggested.name}, a fictional AI personality for {suggested.specialty.toLowerCase()}.
              If you would rather have an open human conversation, ask for a person. {SAMPLE_PROFILE_NOTICE}
            </p>
            <div className="inline-actions">
              <button type="button" className="button" onClick={() => onTalkWithPersona(suggested)}>Talk with {suggested.name} <ArrowRight size={16}/></button>
              <button type="button" className="outline-button" onClick={onAskForPerson}>I’d rather talk with a person</button>
            </div>
          </>
        )}
      </section>

      <section className="plain-panel">
        <h2>How are you arriving?</h2>
        <p>Mood tracking stays in this browser. It is not a diagnosis, and it does not trigger an emergency response.</p>
        <div className="choice-grid mood-grid">
          {moodOptions.map(item => (
            <button
              type="button"
              key={item.id}
              className={latest?.mood === item.id ? 'selected' : ''}
              onClick={() => onSaveMood(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>
        {latest && (
          <p className="small-print">Last marked: {labelMood(latest.mood)} · {new Date(latest.createdAt).toLocaleString()}</p>
        )}
        {moods.length > 1 && (
          <ol className="mood-log">
            {moods.slice(0, 5).map(item => (
              <li key={item.id}>{labelMood(item.mood)} · {new Date(item.createdAt).toLocaleDateString()}</li>
            ))}
          </ol>
        )}
      </section>

      <section className="plain-panel">
        <h2>What would you like to sit with?</h2>
        <p>Interests help suggest an activity or an AI personality. They are not shared unless you later preview and approve them.</p>
        <div className="choice-grid">
          {interestOptions.map(item => (
            <button
              type="button"
              key={item.id}
              className={interests.includes(item.id) ? 'selected' : ''}
              onClick={() => onToggleInterest(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="inline-actions">
          <button type="button" className="outline-button" onClick={() => go('activities')}>Do a written activity</button>
          <button type="button" className="quiet" onClick={() => go('space')}>Open up in My space</button>
        </div>
      </section>

      <section className="plain-panel">
        <h2>Explore, then decide.</h2>
        <p>Nothing here is required. Look around, then choose one next step.</p>
        <div className="choice-grid arrive-explore">
          <button type="button" onClick={() => go('connect')}><strong>A person</strong><span>Pair with a listener who has shared a code.</span></button>
          <button type="button" onClick={() => go('rehearsal')}><strong>Practise</strong><span>Find words with a fictional counterpart.</span></button>
          <button type="button" onClick={() => go('chairs')}><strong>Two Chairs</strong><span>Same-device, AI chair, or a joined person.</span></button>
          <button type="button" onClick={() => go('activities')}><strong>Activities</strong><span>Quiet, spiritual, or shared written tasks.</span></button>
          <button type="button" onClick={() => go('circles')}><strong>Circles</strong><span>Shared-experience groups. Not open yet.</span></button>
          <button type="button" onClick={() => go('space')}><strong>My space</strong><span>Private notes, requests, and reflections.</span></button>
        </div>
      </section>
    </>
  );
}
