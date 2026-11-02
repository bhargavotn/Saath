'use client';

import { useState } from 'react';
import { ArrowRight, Ear, HeartHandshake, ShieldCheck, LogIn, UserPlus, LogOut, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import type { EnrollmentProfile, EnrollmentRole } from '@/lib/domain';

type Props = {
  auth: boolean;
  displayName: string;
  profile: EnrollmentProfile | null;
  busy: boolean;
  onEnroll: (input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) => void;
  onAuthSuccess?: (user: any) => void;
  onSignOut?: () => void;
};

export default function Enrollment({ auth, displayName, profile, busy, onEnroll, onAuthSuccess, onSignOut }: Props) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'listener'>('client');
  const [authBusy, setAuthBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const enrolled = Boolean(profile?.clientEnrolled || profile?.listenerEnrolled);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setAuthBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid credentials.');
      }
      setSuccessMsg(data.message || 'Signed in successfully.');
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setAuthBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim() || email.split('@')[0],
          role,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Registration failed.');
      }
      setSuccessMsg('Account created successfully!');
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function quickDemoLogin(demoEmail: string, demoPass: string, demoRole: 'client' | 'listener', demoName: string) {
    setAuthBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data.user) {
        setSuccessMsg(`Signed in as ${data.user.fullName || data.user.displayName}`);
        if (onAuthSuccess) onAuthSuccess(data.user);
      } else {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPass, fullName: demoName, role: demoRole }),
        });
        const regData = (await regRes.json()) as any;
        if (regRes.ok && regData.user) {
          setSuccessMsg(`Signed in as ${demoName}`);
          if (onAuthSuccess) onAuthSuccess(regData.user);
        } else {
          throw new Error(regData.error || 'Quick login failed.');
        }
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">SAATH SECURE IDENTITY & CLINICAL ENROLLMENT</div>
        <h1>{auth ? 'Your Saath Account.' : 'Real Account Sign-In.'}<br/><em>{auth ? 'Manage your roles and pairing.' : 'Create an account or sign in.'}</em></h1>
        <p>
          {auth
            ? `You are currently authenticated as ${displayName || profile?.displayName || 'User'}. You can switch roles or update your sanctuary profile.`
            : 'Access your private encrypted sanctuary, clinical assessments, and connect with verified listeners.'}
        </p>
      </div>

      {!auth ? (
        <section className="plain-panel" style={{ maxWidth: 640, margin: '0 auto 2.5rem auto' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className={`button small ${tab === 'signin' ? '' : 'quiet'}`}
              onClick={() => { setTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ fontWeight: tab === 'signin' ? 700 : 500 }}
            >
              <LogIn size={15} style={{ marginRight: 6 }}/> Sign In
            </button>
            <button
              type="button"
              className={`button small ${tab === 'register' ? '' : 'quiet'}`}
              onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ fontWeight: tab === 'register' ? 700 : 500 }}
            >
              <UserPlus size={15} style={{ marginRight: 6 }}/> Create Account
            </button>
          </div>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
              <AlertCircle size={17}/>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
              <CheckCircle2 size={17}/>
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav@saath.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <button type="submit" className="button full" disabled={authBusy} style={{ marginTop: '0.5rem' }}>
                {authBusy ? 'Authenticating…' : 'Sign In to Saath'} <ArrowRight size={16}/>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav@saath.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Password (minimum 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Primary Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    style={{
                      padding: '0.65rem',
                      border: role === 'client' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      background: role === 'client' ? '#f0f9ff' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong>Client</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Seeking listener & care</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('listener')}
                    style={{
                      padding: '0.65rem',
                      border: role === 'listener' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      background: role === 'listener' ? '#f0f9ff' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong>Peer Listener</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Provide empathy & support</div>
                  </button>
                </div>
              </div>

              <button type="submit" className="button full" disabled={authBusy} style={{ marginTop: '0.5rem' }}>
                {authBusy ? 'Creating Account…' : 'Register Account'} <ArrowRight size={16}/>
              </button>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#f59e0b"/> Instant Demo Access (One-Click)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button small quiet"
                disabled={authBusy}
                onClick={() => quickDemoLogin('aarav.client@counselor.ai', 'SaathSecure2026!', 'client', 'Aarav Sharma')}
                style={{ fontSize: '0.82rem' }}
              >
                Sign in as Client (Aarav)
              </button>
              <button
                type="button"
                className="button small quiet"
                disabled={authBusy}
                onClick={() => quickDemoLogin('meera.listener@counselor.ai', 'SaathSecure2026!', 'listener', 'Meera Patel')}
                style={{ fontSize: '0.82rem' }}
              >
                Sign in as Listener (Meera)
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="plain-panel" style={{ maxWidth: 640, margin: '0 auto 2.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Active Signed-In Account</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{displayName || profile?.displayName || 'Active User'}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Active Role: <strong style={{ textTransform: 'capitalize', color: '#0284c7' }}>{profile?.activeRole || 'client'}</strong>
              {profile?.pairingCode ? ` · Pairing Code: ${profile.pairingCode}` : ''}
            </div>
          </div>
          {onSignOut && (
            <button type="button" className="button small quiet" onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
              <LogOut size={15}/> Sign Out
            </button>
          )}
        </section>
      )}

      <div className="enroll-grid">
        <article className="enroll-card">
          <span className="eyebrow">CLIENT</span>
          <HeartHandshake size={28} strokeWidth={1.4}/>
          <h2>I am looking for a listener.</h2>
          <p>This first visit is for the person who wants to express themselves. Save private context, mark a mood, and decide what to share. You can still enroll as a listener later on the same account.</p>
          <ul className="simple-list">
            <li>Private notes can be encrypted at rest when the server key is configured.</li>
            <li>Pair with an enrolled listener using their six-character code.</li>
            <li>After you enroll, you land in one shared home with verified listeners.</li>
          </ul>
          {auth ? (
            <button className="button full" disabled={busy || Boolean(profile?.clientEnrolled)} onClick={() => onEnroll({
              clientEnrolled: true,
              listenerEnrolled: Boolean(profile?.listenerEnrolled),
              activeRole: 'client',
              displayName: displayName || profile?.displayName || 'Client',
            })}>
              {profile?.clientEnrolled ? 'Enrolled as a client' : 'Enroll as a client'}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <button className="button full" onClick={() => { setTab('register'); setRole('client'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Create Client Account <ArrowRight size={16}/>
            </button>
          )}
        </article>

        <article className="enroll-card listener">
          <span className="eyebrow">LISTENER</span>
          <Ear size={28} strokeWidth={1.4}/>
          <h2>I can sit with someone.</h2>
          <p>Receive paired requests, accept or decline them, and keep the same account if you also need support. Enrollment is an active listener role.</p>
          <ul className="simple-list">
            <li>You receive a unique pairing code. Only people you share it with can request you.</li>
            <li>Accepting a request is done by you, not by the client.</li>
            <li>A listener provides empathetic, non-judgmental presence.</li>
          </ul>
          {auth ? (
            <button className="button full" disabled={busy || Boolean(profile?.listenerEnrolled)} onClick={() => onEnroll({
              clientEnrolled: Boolean(profile?.clientEnrolled),
              listenerEnrolled: true,
              activeRole: 'listener',
              displayName: displayName || profile?.displayName || 'Listener',
            })}>
              {profile?.listenerEnrolled ? 'Enrolled as a listener' : 'Enroll as a listener'}
              <ArrowRight size={16}/>
            </button>
          ) : (
            <button className="button full" onClick={() => { setTab('register'); setRole('listener'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Create Listener Account <ArrowRight size={16}/>
            </button>
          )}
        </article>
      </div>

      {enrolled && (
        <section className="plain-panel enroll-sync" style={{ marginTop: '2rem' }}>
          <h2>Saved on this account</h2>
          <p>
            {profile?.displayName || 'You'} ·
            {profile?.clientEnrolled ? ' client' : ''}
            {profile?.clientEnrolled && profile?.listenerEnrolled ? ' and' : ''}
            {profile?.listenerEnrolled ? ' listener' : ''}
            {profile?.activeRole ? ` · using ${profile.activeRole} now` : ''}
          </p>
          {profile?.pairingCode && (
            <p className="pairing-code">Listener pairing code <strong>{profile.pairingCode}</strong></p>
          )}
          <p className="small-print">Switching roles updates your saved profile on the database. It does not create a second login.</p>
        </section>
      )}
    </>
  );
}
