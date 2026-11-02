'use client';

import { useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { introQuestions } from '@/lib/fixtures';
import { composeIntroduction, type IntroAnswers, type PacePreference, type SupportStyle } from '@/lib/domain';
import { emptyIntroAnswers, saveIntro } from '@/lib/client/store';
import { api } from '@/lib/client/api';

type Props = {
  initial: IntroAnswers | null;
  auth: boolean;
  ai: boolean;
  onClose: () => void;
  onSaved: (answers: IntroAnswers, completed: boolean) => void;
  flash: (message: string) => void;
};

export default function GettingToKnowYou({ initial, auth, ai, onClose, onSaved, flash }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntroAnswers>(initial ?? emptyIntroAnswers());
  const [assist, setAssist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const question = introQuestions[step];

  function persist(next: IntroAnswers, completed: boolean) {
    const card = saveIntro(next, completed);
    onSaved(card.answers, completed);
  }

  function setValue(value: string) {
    setAnswers(current => ({ ...current, [question.key]: value }));
  }

  const currentValue = answers[question.key];

  return (
    <section className="intro-flow">
      <div className="page-heading">
        <div className="eyebrow">GETTING TO KNOW YOU</div>
        <h1>Let’s make this space feel more like you.</h1>
        <p>Answer a few small questions, or come back whenever you’re ready. There is no timer.</p>
      </div>
      <p className="sample-notice">These answers stay private by default. Saath does not infer personality types, diagnoses, trauma histories, attachment styles, or compatibility scores.</p>
      <div className="plain-panel intro-card">
        <span className="eyebrow">QUESTION {step + 1} OF {introQuestions.length}</span>
        <h2>{question.prompt}</h2>
        {question.kind === 'text' && (
          <textarea value={currentValue} onChange={event => setValue(event.target.value)} maxLength={800} placeholder="Only if you want to…"/>
        )}
        {question.kind === 'support' && (
          <div className="choice-grid">
            {(['listening', 'reflection', 'suggestions', 'ask-first'] as SupportStyle[]).map(option => (
              <button type="button" key={option} className={answers.supportStyle === option ? 'selected' : ''} onClick={() => setValue(option)}>
                {option === 'ask-first' ? 'Ask me first' : option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}
        {question.kind === 'pace' && (
          <div className="choice-grid">
            {(['time-to-think', 'gentle-questions', 'talking-freely'] as PacePreference[]).map(option => (
              <button type="button" key={option} className={answers.pace === option ? 'selected' : ''} onClick={() => setValue(option)}>
                {option.replaceAll('-', ' ')}
              </button>
            ))}
          </div>
        )}
        <div className="chair-controls intro-controls">
          <button type="button" className="outline-button" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft size={16}/> Back</button>
          <button type="button" className="quiet" onClick={() => {
            persist(answers, false);
            if (step === introQuestions.length - 1) onClose();
            else setStep(step + 1);
          }}>Skip</button>
          <button type="button" className="button" onClick={() => {
            persist(answers, step === introQuestions.length - 1);
            if (step === introQuestions.length - 1) {
              flash(auth ? 'Introduction saved privately in this browser. The production schema is still pending.' : 'Introduction kept in this browser. Sign in later if you want account-backed storage when the schema arrives.');
              onClose();
            } else setStep(step + 1);
          }}>{step === introQuestions.length - 1 ? 'Save' : 'Save and continue'}<ArrowRight size={16}/></button>
        </div>
        <p className="small-print">You can resume from My space. Target time is a few minutes; nothing is required to use support.</p>
      </div>
      <section className="plain-panel">
        <h2>Your introduction card</h2>
        <p>Private by default. Built only from your answers.</p>
        <pre className="intro-preview">{composeIntroduction(answers)}</pre>
        <label className="checkbox-label">
          <input type="checkbox" checked={assist} onChange={event => setAssist(event.target.checked)}/>
          I consent to send this introduction text to the configured AI provider for wording help. It must not add facts.
        </label>
        <button
          type="button"
          className="text-button"
          disabled={!assist || busy || !composeIntroduction(answers).trim()}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await api<{suggestion: string}>('/api/wording', 'POST', {
                text: composeIntroduction(answers),
                consent: true,
                approveFactsUnchanged: true,
              });
              setSuggestion(result.suggestion);
            } catch (error) {
              flash(error instanceof Error ? error.message : 'Wording help is unavailable.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {ai ? (busy ? 'Asking for wording…' : 'Suggest clearer wording') : 'Wording help unavailable until AI is configured'}
        </button>
        {suggestion && (
          <div className="wording-preview">
            <p>Suggested wording — review before anything changes. No facts should have been added.</p>
            <pre className="intro-preview">{suggestion}</pre>
            <button type="button" className="outline-button" onClick={() => {
              const next = { ...answers, beforeTalking: suggestion };
              persist(next, false);
              setSuggestion('');
              flash('You approved the suggested wording. It is still private.');
            }}>Use this wording</button>
            <button type="button" className="quiet" onClick={() => setSuggestion('')}>Keep my words</button>
          </div>
        )}
      </section>
    </section>
  );
}
