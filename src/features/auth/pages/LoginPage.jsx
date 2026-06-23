/**
 * LoginPage
 * User sign-in page.
 * POST /auth/signin { identifier, password } → data: { user, accessToken }
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../../api';
import { storage } from '../../../storage';
import { extractUser, mapUser } from '../../../utils/session';
import { toast } from '../../../toast';

export function LoginPage() {
  const nav = useNavigate();

  const prefillEmail = localStorage.getItem('slashit_prefill_email') || '';
  const [email,     setEmail]     = useState(prefillEmail);
  const [pw,        setPw]        = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (prefillEmail) localStorage.removeItem('slashit_prefill_email');
  }, []);

  const login = async () => {
    if (!email || !pw) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const res   = await api.auth.signin(email.trim(), pw);
      const token = res.data?.accessToken || res.data?.token || res.accessToken;
      const user  = res.data?.user || (typeof res.data === 'object' ? res.data : {});
      if (!token) throw new Error('Login failed — please check your credentials');
      setToken(token);

      const prev    = storage.load('session', {});
      const rawUser = extractUser(res) || user;
      const session = mapUser(rawUser, {
        ...prev,
        email:   prev.email   || email,
        hubId:   prev.hubId   || '',
        hubName: prev.hubName || '',
        city:    prev.city    || '',
        state:   prev.state   || '',
      });
      storage.save('session', session);

      try {
        const pending = JSON.parse(localStorage.getItem('slashit_pending_join') || 'null');
        if (pending?.slashId) {
          localStorage.removeItem('slashit_pending_join');
          toast.success('Welcome back!');
          nav('/slash/' + pending.slashId);
          return;
        }
      } catch (e) {}

      toast.success('Welcome back!');
      nav(session.hubId ? '/home' : '/onboarding');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.includes('403')) {
        toast.error('Wrong email or password. If you just registered, complete email verification first — tap "Create account" and use the same email to finish setup.');
      } else {
        toast.error(msg || 'Login failed. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {pwVisible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );
  const EmailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
  const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const fieldStyle = {
    paddingLeft: 44, background: '#f1f5f9', border: '1.5px solid #e2e8f0',
    borderRadius: 12, padding: '13px 14px 13px 44px', fontSize: 14,
    width: '100%', boxSizing: 'border-box', outline: 'none',
    transition: 'border-color .2s', color: '#1e293b',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#dce8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(37,99,235,.13)', padding: '40px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo.jpg" alt="SlashIt" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>SlashIt</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Sign in to your SlashIt account</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>Email</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}><EmailIcon /></span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && login()}
                style={fieldStyle}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                onBlur={e  => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>Password</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}><LockIcon /></span>
              <input type={pwVisible ? 'text' : 'password'} value={pw}
                onChange={e => setPw(e.target.value)} placeholder="Enter your password"
                onKeyDown={e => e.key === 'Enter' && login()}
                style={{ ...fieldStyle, paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                onBlur={e  => { e.target.style.borderColor = '#e2e8f0'; }} />
              <button onClick={() => setPwVisible(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <EyeIcon />
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <button onClick={() => nav('/forgot-password')} style={{ color: '#2563eb', fontWeight: 600, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        <button onClick={login} disabled={loading}
          style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <span className="spin" style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />}
          Sign In
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
          New to SlashIt?{' '}
          <button onClick={() => nav('/signup')} style={{ color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            + Create account
          </button>
        </div>
      </div>
    </div>
  );
}
