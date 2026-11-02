'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, ChevronDown, Pause, Play, Volume2, X } from 'lucide-react';
import BreathingExercise from '@/components/BreathingExercise';
import { loadFixtures, saveQuietThoughts } from '@/lib/client/store';
import './ambient-sound.css';

type Sound = 'rain' | 'brown' | 'stereo';
type AudioSession = { context: AudioContext; gain: GainNode; sources: (AudioBufferSourceNode | OscillatorNode)[]; nodes: AudioNode[] };

type AmbientApi = {
  playing: boolean;
  busy: boolean;
  error: string;
  play: (next?: Sound) => Promise<void>;
  pause: () => void;
  openPanel: () => void;
};

const AmbientContext = createContext<AmbientApi | null>(null);

export function useAmbient(): AmbientApi {
  const value = useContext(AmbientContext);
  if (!value) {
    return {
      playing: false,
      busy: false,
      error: '',
      play: async () => {},
      pause: () => {},
      openPanel: () => {},
    };
  }
  return value;
}

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [breathe, setBreathe] = useState(false);
  const [sound, setSound] = useState<Sound>('rain');
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(20);
  const [error, setError] = useState('');
  const [thoughts, setThoughts] = useState('');
  const session = useRef<AudioSession | null>(null);
  const generation = useRef(0);

  function dispose() {
    generation.current += 1;
    const active = session.current;
    session.current = null;
    if (!active) return;
    active.sources.forEach(source => { try { source.stop(); } catch { /* Already stopped. */ } });
    active.nodes.forEach(node => { try { node.disconnect(); } catch { /* Already disconnected. */ } });
    void active.context.close().catch(() => {});
  }

  useEffect(() => () => dispose(), []);
  useEffect(() => {
    setThoughts(loadFixtures().quietThoughts);
  }, []);
  useEffect(() => {
    const active = session.current;
    if (active) active.gain.gain.setTargetAtTime(volume * 0.0012, active.context.currentTime, 0.1);
  }, [volume]);

  async function start(next: Sound) {
    dispose();
    const ticket = generation.current;
    setError('');
    setBusy(true);
    setPlaying(false);
    try {
      const AudioConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioConstructor) throw new Error('This browser does not support ambient audio.');
      const context = new AudioConstructor();
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      const active: AudioSession = { context, gain, sources: [], nodes: [gain] };
      session.current = active;
      if (next === 'stereo') {
        const merger = context.createChannelMerger(2);
        merger.connect(gain);
        active.nodes.push(merger);
        [180, 186].forEach((frequency, channel) => {
          const oscillator = context.createOscillator();
          const attenuator = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          attenuator.gain.value = 0.3;
          oscillator.connect(attenuator);
          attenuator.connect(merger, 0, channel);
          active.sources.push(oscillator);
          active.nodes.push(oscillator, attenuator);
        });
      } else {
        const buffer = context.createBuffer(2, context.sampleRate * 8, context.sampleRate);
        for (let channel = 0; channel < 2; channel += 1) {
          const samples = buffer.getChannelData(channel);
          let previous = 0;
          for (let index = 0; index < samples.length; index += 1) {
            const white = Math.random() * 2 - 1;
            previous = (previous + white * 0.02) / 1.02;
            samples[index] = next === 'brown' ? previous * 3.5 : white * 0.3;
          }
        }
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = next === 'rain' ? 2400 : 900;
        source.connect(filter);
        filter.connect(gain);
        active.sources.push(source);
        active.nodes.push(source, filter);
      }
      await context.resume();
      if (generation.current !== ticket) return;
      active.sources.forEach(source => source.start());
      gain.gain.setTargetAtTime(volume * 0.0012, context.currentTime, 0.25);
      setPlaying(true);
    } catch (cause) {
      if (generation.current !== ticket) return;
      dispose();
      setError(cause instanceof Error ? cause.message : 'Audio could not start. Please try again.');
    } finally {
      if (generation.current === ticket || !session.current) setBusy(false);
    }
  }

  function pause() { dispose(); setPlaying(false); setBusy(false); }
  function changeSound(next: Sound) { setSound(next); if (playing) void start(next); }

  const api = useMemo<AmbientApi>(() => ({
    playing,
    busy,
    error,
    play: (next = 'rain') => start(next),
    pause,
    openPanel: () => setOpen(true),
  }), [playing, busy, error, volume]);

  return (
    <AmbientContext.Provider value={api}>
      {children}
      <aside className="saath-sound" aria-label="Optional ambient sound">
        {open && <section className="saath-sound-panel" aria-labelledby="saath-sound-title">
          <div className="saath-sound-heading"><div><span className="saath-sound-eyebrow">A LITTLE ATMOSPHERE</span><h2 id="saath-sound-title">Make room for quiet.</h2></div><button type="button" className="saath-sound-icon" onClick={() => setOpen(false)} aria-label="Close sound controls"><X size={18}/></button></div>
          <p>Optional sound, at your pace. Silence is always welcome. Sound is a listening preference, not treatment, panic control, or brainwave therapy.</p>
          <label className="saath-sound-label" htmlFor="saath-sound-select">Your sound</label>
          <select id="saath-sound-select" value={sound} disabled={busy} onChange={event => changeSound(event.target.value as Sound)}><option value="rain">Gentle rain texture</option><option value="brown">Soft brown noise</option><option value="stereo">Stereo tones (headphones)</option></select>
          {sound === 'stereo' && <p className="saath-sound-note">180 Hz left / 186 Hz right · 6 Hz difference. Listening effect; no medical or brainwave benefit claimed.</p>}
          <div className="saath-sound-volume"><Volume2 size={16} aria-hidden="true"/><label htmlFor="saath-sound-volume">Volume</label><output htmlFor="saath-sound-volume">{volume}%</output></div>
          <input id="saath-sound-volume" type="range" min="0" max="100" step="1" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Ambient sound volume"/>
          <button type="button" className="saath-sound-play" disabled={busy} onClick={() => playing ? pause() : void start(sound)}>{playing ? <Pause size={16}/> : <Play size={16}/>} {busy ? 'Preparing sound…' : playing ? 'Pause sound' : 'Play sound'}</button>
          <button type="button" className="saath-sound-play saath-sound-mute" onClick={pause}>Stop / mute immediately</button>
          <button type="button" className="saath-sound-play" onClick={() => setBreathe(value => !value)}>
            {breathe ? 'Hide breathing guide' : 'Open a breathing guide'}
          </button>
          {breathe && (
            <BreathingExercise
              onClose={() => setBreathe(false)}
              onReady={() => setBreathe(false)}
            />
          )}
          <label className="saath-sound-label" htmlFor="quiet-thoughts">Open up, if you want to</label>
          <textarea
            id="quiet-thoughts"
            value={thoughts}
            maxLength={4000}
            placeholder="A thought you can leave here…"
            onChange={event => {
              const next = event.target.value;
              setThoughts(next);
              saveQuietThoughts(next);
            }}
          />
          <p className="saath-sound-note">Quiet corner is for sitting with what you feel. Thoughts stay in this browser. This is not treatment or a promise that you will feel better.</p>
          <p className="saath-sound-note">Starts only when you choose. Keep your device volume comfortable. Closing this panel keeps sound playing; use Pause or Stop to end it.</p>
          {error && <p className="saath-sound-error" role="alert">{error}</p>}
        </section>}
        <button type="button" className={`saath-sound-toggle ${playing ? 'is-playing' : ''}`} aria-expanded={open} onClick={() => setOpen(value => !value)}><AudioLines size={18}/><span>{playing ? 'Sound on' : 'Quiet corner'}</span>{open && <ChevronDown size={15}/>}</button>
      </aside>
    </AmbientContext.Provider>
  );
}

export default function AmbientSound() {
  return null;
}
