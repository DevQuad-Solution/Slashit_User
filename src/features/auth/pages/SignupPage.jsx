/**
 * Signup
 * Extracted from App.jsx. Uses useSession() instead of currentUser module variable.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { api, setToken, getToken, clearToken } from '../../../api';
import { storage, getFlags, getPlatformConfig, getAdminProducts, getAdminPackages,
         getAdminPlans, getAdminHubs, getLeaderboardConfig, getAdminHostels,
         pollStorage, chatStorage, msgStorage, pushBrowserNotif } from '../../../storage';
import { fmt, delay, fromNow, timeUntil, PLANS, CATEGORIES, BANTER_MESSAGES,
         FOOD_PACKAGES, MOCK_SLASHES, MOCK_PRODUCTS, MOCK_TRANSACTIONS,
         MOCK_NOTIFICATIONS, MOCK_LEADERBOARD, LEADERBOARD_CONFIG, HOSTELS } from '../../../data';
import { mapUser, extractUser, normalizePhone } from '../../../utils/session';
import { useSession } from '../../../hooks/useSession';
import { useAuth } from '../../../context/AuthContext';
import { Btn, Card, Input, Badge, FillBar, Modal } from '../../../components/ui';
import { toast } from '../../../toast';

export function Signup() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', consent_terms:false, consent_data:false, consent_age:false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(err=>({...err,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 6) e.name = 'Full name must be at least 6 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone required';
    if (!form.password) e.password = 'Password required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  // Step 0 → send OTP + create account
  // Helper to normalize Nigerian phone to international format
  const normalizePhone = (p) => {
    const digits = p.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
    if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
    if (digits.startsWith('+234')) return digits;
    return p;
  };

  // CORRECT FLOW per API docs:
  // Step 1: POST /api/auth/ → creates account AND sends verification email
  // Step 2: POST /api/auth/verify-code → verify OTP, returns token
  // Step 3: POST /api/auth/onboarding → finalise with token + hubId (done on onboarding screen)
  // Step 4: POST /api/auth/signin → login to get access token for session

  const submitForm = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      // POST /api/auth/ — creates account AND sends OTP email automatically
      await api.auth.signup({
        fullName: form.name,
        email: form.email,
        phoneNumber: normalizePhone(form.phone),
        password: form.password,
      });
      // Do NOT call sendCode — signup already sent the OTP.
      // Calling sendCode would overwrite/confuse the OTP.
      setStep(1);
      setResendCooldown(60);
      toast.success('Code sent! Check ' + form.email + ' — look in SPAM or JUNK if not in inbox.');
    } catch(err) {
      const raw = err.message || '';
      if (raw.toLowerCase().includes('already exists') || raw.toLowerCase().includes('already registered') || raw.toLowerCase().includes('already')) {
        toast.error('This email already has an account. Tap Sign In to log in.');
      } else if (raw.toLowerCase().includes('invalid') || raw.toLowerCase().includes('phone')) {
        toast.error(raw);
      } else {
        toast.error(raw || 'Could not create account. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c=>c-1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      // Use 'signup' to match the reason the OTP was originally stored with
      await api.auth.sendCode(form.email, 'signup');
      setResendCooldown(60);
      toast.success('New code sent to ' + form.email + '. Check spam/junk too.');
    } catch(err) {
      toast.error(err.message || 'Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  // Verify OTP flow per docs:
  // POST /auth/verify-code { email, code, reason:"emailVerification" }
  //   → returns token in data (used for onboarding)
  // POST /auth/onboarding { token, email, hubId } (done on next screen)
  // POST /auth/signin { identifier, password } → session token
  const verifyEmail = async () => {
    if (!verifyCode) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      // POST /auth/verify-code { email, code, reason:"signup" }
      // Always use 'signup' reason — both initial OTP and resend use 'signup'
      const verifyRes = await api.auth.verifyCode(form.email, verifyCode.trim(), 'signup');

      // The backend returns the onboarding JWT in data
      // Shape: { data: "JWT_STRING" }  or  { data: { token:"JWT" } }
      const verifyToken = typeof verifyRes?.data === 'string' && verifyRes.data.length > 10
        ? verifyRes.data
        : verifyRes?.data?.token || verifyRes?.data?.accessToken
          || verifyRes?.token || verifyRes?.accessToken || '';

      // Store credentials for onboarding
      localStorage.setItem('slashit_signup_email', form.email);
      localStorage.setItem('slashit_signup_pw',    form.password);

      if (verifyToken) {
        // We have a real JWT — store and proceed to onboarding
        localStorage.setItem('slashit_verify_token', verifyToken);
        toast.success('Email verified! Choose your pickup hub.');
        nav('/onboarding');
      } else {
        // verifyCode succeeded but returned no token — this account may need
        // a fresh onboarding call. Go to onboarding and let finish() handle it.
        // Note: onboarding will fail with invalid token but signin may work
        // if the account was already activated on a prior attempt
        localStorage.removeItem('slashit_verify_token');
        toast.success('Email verified! Choose your hub to continue.');
        nav('/onboarding');
      }
    } catch(err) {
      const raw = err.message || '';
      if (raw.includes('Failed to fetch') || raw === 'Failed to fetch') {
        toast.error('Connection error. Check your internet and try again.');
      } else if (raw.toLowerCase().includes('invalid') || raw.toLowerCase().includes('expired')) {
        toast.error('Code is wrong or expired. Use the Resend button to get a new one.');
      } else if (raw.toLowerCase().includes('signup data not found')) {
        // Backend in-memory session expired (Render free tier restarts every 15min)
        // The account WAS created — try to sign in directly
        toast.success('Verifying your account…');
        try {
          const signinRes = await api.auth.signin(form.email, form.password);
          const token = signinRes?.data?.accessToken || signinRes?.data?.token;
          if (token) {
            localStorage.setItem('slashit_signup_email', form.email);
            localStorage.setItem('slashit_signup_pw', form.password);
            localStorage.removeItem('slashit_verify_token');
            toast.success('Account verified! Choose your pickup hub.');
            nav('/onboarding');
          } else {
            throw new Error('No token from signin');
          }
        } catch(signinErr) {
          toast.error('Your account was created but the session expired. Please sign in with your email and password.');
          nav('/login');
        }
      } else if (raw.toLowerCase().includes('not found') || raw.toLowerCase().includes('expired')) {
        toast.error('Code expired. Tap Resend to get a new code.');
      } else {
        toast.error(raw || 'Verification failed. Try again.');
      }
    } finally { setLoading(false); }
  };

  if (step === 1) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1e3a8a,#1d4ed8)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'52px 24px 20px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>Enter your code</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.75)', marginTop:6, lineHeight:1.6 }}>
          We sent a <strong style={{color:'#fff'}}>6-digit verification code</strong> to<br/><strong style={{color:'#fff'}}>{form.email}</strong>
        </div>
        <div style={{ marginTop:12, background:'rgba(255,193,7,.15)', border:'1px solid rgba(255,193,7,.4)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#fde68a', lineHeight:1.8, textAlign:'left', fontWeight:600 }}>
          ⚠️ <strong>Check your SPAM / JUNK folder</strong> — most providers filter this email<br/>
          <span style={{fontWeight:400,fontSize:11,opacity:.9}}>Subject line: look for "Verify", "OTP" or "SlashIt"<br/>
          Code expires in ~10 minutes</span>
        </div>
      </div>
      <div style={{ flex:1, background:'#fff', borderRadius:'28px 28px 0 0', padding:'24px 20px' }}>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:8 }}>Enter 6-Digit Code</label>
          <input value={verifyCode} onChange={e=>setVerifyCode(e.target.value.trim().replace(/\D/g,''))} placeholder="000000" maxLength={6} inputMode="numeric" pattern="[0-9]*"
            style={{ fontSize:28, letterSpacing:14, textAlign:'center', fontWeight:800, border:'2px solid #e2e8f0', borderRadius:14, padding:'14px', width:'100%', boxSizing:'border-box' }}
            onKeyDown={e=>e.key==='Enter'&&verifyEmail()}
            onFocus={e=>e.target.style.borderColor='#2563eb'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}
          />
          <div style={{ fontSize:11, color:'#94a3b8', textAlign:'center', marginTop:6 }}>
            {verifyCode.length}/6 digits entered
          </div>
        </div>
        <Btn full loading={loading} disabled={verifyCode.length!==6} onClick={verifyEmail}>Verify &amp; Continue</Btn>
        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={resendOtp} disabled={resendCooldown>0||resending}
            style={{ color:resendCooldown>0?'#94a3b8':'#2563eb', fontWeight:700, fontSize:13, background:'none', border:'none', cursor:resendCooldown>0||resending?'default':'pointer', opacity:resending?0.6:1 }}>
            {resending ? '📨 Sending…' : resendCooldown>0 ? `Resend in ${resendCooldown}s` : '🔄 Resend code'}
          </button>
        </div>
        <button onClick={()=>setStep(0)} style={{ width:'100%', marginTop:10, padding:'12px', color:'#94a3b8', fontWeight:600, fontSize:13, background:'none', border:'none' }}>← Back to form</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1e3a8a,#1d4ed8)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'48px 24px 24px', textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:14, overflow:'hidden', background:'#fff', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src="/logo.jpg" alt="SlashIt" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
        </div>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>Create account</div>
      </div>
      <div style={{ flex:1, background:'#fff', borderRadius:'28px 28px 0 0', padding:'24px 20px', overflowY:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          <Input label="Full Name" type="text" value={form.name} onChange={set('name')} placeholder="Your full name" error={errors.name}/>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@school.edu.ng" error={errors.email}/>
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="08012345678" error={errors.phone}/>
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" error={errors.password}/>
          <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" error={errors.confirmPassword}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14, background:'#f8fafc', borderRadius:12, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>You must agree to continue</div>
          {[
            { key:'terms', label:<span>I agree to SlashIt <button onClick={e=>{e.stopPropagation();window.open('/terms','_blank')}} style={{color:'#2563eb',background:'none',fontWeight:700,fontSize:12,textDecoration:'underline',border:'none',cursor:'pointer'}}>Terms of Service</button> and <button onClick={e=>{e.stopPropagation();window.open('/privacy','_blank')}} style={{color:'#2563eb',background:'none',fontWeight:700,fontSize:12,textDecoration:'underline',border:'none',cursor:'pointer'}}>Privacy Policy</button></span> },
            { key:'data', label:'I consent to SlashIt processing my personal data for account management and group buying coordination' },
            { key:'age', label:'I confirm I am 18 years or older and eligible to use this service' },
          ].map(item=>(
            <div key={item.key}
              onClick={()=>setForm(f=>({...f,['consent_'+item.key]:!f['consent_'+item.key]}))}
              style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', userSelect:'none', WebkitUserSelect:'none' }}>
              <input type="checkbox"
                checked={!!form['consent_'+item.key]}
                onChange={e=>{ e.stopPropagation(); setForm(f=>({...f,['consent_'+item.key]:e.target.checked})); }}
                onClick={e=>e.stopPropagation()}
                style={{ width:20, height:20, marginTop:1, accentColor:'#2563eb', flexShrink:0, cursor:'pointer' }}/>
              <span style={{ fontSize:12, color:'#334155', lineHeight:1.5 }}>{item.label}</span>
            </div>
          ))}
        </div>
        <Btn full loading={loading} disabled={!form.consent_terms||!form.consent_data||!form.consent_age} onClick={submitForm}>Create Account & Send Code</Btn>
        <div style={{ textAlign:'center', marginTop:14 }}>
          <span style={{ color:'#64748b', fontSize:13 }}>Have an account? </span>
          <button onClick={()=>nav('/login')} style={{ color:'#2563eb', fontWeight:700, fontSize:13, background:'none', border:'none', cursor:'pointer' }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { SignupPage }
export { Signup as SignupPage };
