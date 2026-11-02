'use client';

import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const PHASES = [
  { id: 'inhale', label: 'Breathe in', seconds: 4 },
  { id: 'hold', label: 'Hold', seconds: 4 },
  { id: 'exhale', label: 'Breathe out', seconds: 4 },
  { id: 'rest', label: 'Rest', seconds: 4 },
] as const;

const TIMERS = [1, 3, 5] as const;

type Props = {
  onClose?: () => void;
  onReady?: () => void;
};

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function BreathingExercise({ onClose, onReady }: Props) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [minutes, setMinutes] = useState<(typeof TIMERS)[number]>(3);
  const [remaining, setRemaining] = useState(3 * 60);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!running || reduced) return;
    const timer = window.setTimeout(() => {
      setPhase(current => (current + 1) % PHASES.length);
    }, PHASES[phase].seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [running, phase, reduced]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining(current => {
        if (current <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const current = PHASES[phase];

  return (
    <section className="breathing-guide" aria-labelledby="breathing-title">
      <span className="eyebrow">OPTIONAL PACE</span>
      <h2 id="breathing-title">Breathe with this if you want to.</h2>
      <p>Inhale, hold, exhale, rest. Four seconds each. A timer can hold the pause. You can stop whenever you like.</p>
      <div className="timer-picks" role="group" aria-label="Breathing timer">
        {TIMERS.map(item => (
          <button
            type="button"
            key={item}
            className={minutes === item ? 'selected' : ''}
            disabled={running}
            onClick={() => {
              setMinutes(item);
              setRemaining(item * 60);
              setFinished(false);
            }}
          >
            {item} min
          </button>
        ))}
      </div>
      <div className={`breathing-circle ${running && !reduced ? `is-${current.id}` : ''}`} aria-hidden="true">
        <span>{running ? current.label : finished ? 'Ready' : 'Ready'}</span>
      </div>
      <p className="breathing-cue" aria-live="polite">
        {running ? `${current.label} · ${formatTime(remaining)} left` : finished ? 'The timer has ended. Continue when you are ready.' : `Start when you are ready · ${formatTime(remaining)}`}
      </p>
      <div className="inline-actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            if (running) {
              setRunning(false);
              return;
            }
            setPhase(0);
            setFinished(false);
            if (remaining <= 0) setRemaining(minutes * 60);
            setRunning(true);
          }}
        >
          {running ? <Pause size={16}/> : <Play size={16}/>}
          {running ? 'Pause' : finished ? 'Begin again' : 'Start'}
        </button>
        {onReady && (
          <button
            type="button"
            className="outline-button"
            onClick={() => {
              setRunning(false);
              onReady();
            }}
          >
            I’m ready to continue
          </button>
        )}
        {onClose && (
          <button type="button" className="outline-button" onClick={() => { setRunning(false); onClose(); }}>
            Leave this guide
          </button>
        )}
      </div>
      <p className="small-print">This is a pacing guide. It is not treatment, panic control, or a promise that you will feel calmer. Silence is still available.</p>
    </section>
  );
}
