/**
 * ForgotPassword
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

export function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=new-password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resetToken, setResetToken] = useState(''); // JWT from verifyCode, passed to resetPassword

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await api.auth.sendCode(email, 'forgot_password');
      setStep(1); setCooldown(30);
      toast.success(`Code sent to ${email}`);
    } catch(err) {
      const msg = err.message || '';
      if (msg.includes('starting up') || msg.includes('Cannot reach') || msg.includes('fetch')) {
        // Render free tier is sleeping — retry once after 4 seconds
        toast.error('Server is waking up. Retrying in 4 seconds…');
        await new Promise(r => setTimeout(r, 4000));
        try {
          await api.auth.sendCode(email, 'forgot_password');
          setStep(1); setCooldown(30);
          toast.success(`Code sent to ${email}`);
        } catch(err2) {
          toast.error('Still unreachable. Check your internet connection and try again.');
        }
      } else {
        toast.error(msg || 'Could not send code. Check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    try {
      // POST /auth/code { email, reason: "forgot_password" }
      await api.auth.sendCode(email, 'forgot_password');
      setCooldown(30);
      toast.success(`New code sent to ${email}`);
    } catch(err) {
      toast.error(err.message || 'Could not resend code');
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 6) { toast.error('Enter the complete 6-digit code'); return; }
    setLoading(true);
    try {
      // POST /auth/verify-code { email, code, reason: 'forgot_password' }
      const res = await api.auth.verifyCode(email, otp.trim(), 'forgot_password');
      // verifyCode returns a JWT token in the response — extract it for resetPassword
      const token = res?.data?.token || res?.data?.accessToken
                 || res?.data?.resetToken || res?.token
                 || (typeof res?.data === 'string' ? res.data : '') || '';
      if (!token) {
        toast.error('Verification succeeded but no reset token received. Try again.');
        return;
      }
      setResetToken(token);
      setStep(2);
      toast.success('Code verified. Set your new password.');
    } catch(err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('rate limit')) {
        toast.error('Too many attempts. Wait a few minutes and try again.');
      } else {
        // Always show the exact backend message so user knows what went wrong
        toast.error(msg || 'Verification failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      // Confirmed: reset-password takes { token, newPassword } (not email)
      if (!resetToken) {
        toast.error('Session expired. Go back and request a new code.');
        setStep(0); setOtp(''); setResetToken('');
        return;
      }
      await api.auth.resetPassword(resetToken, newPw);
      toast.success('Password reset! Sign in with your new password.');
      nav('/login');
    } catch(err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        toast.error('Code expired. Go back and request a new code.');
        setStep(0);
      } else {
        toast.error(msg || 'Reset failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step labels
  const stepLabels = ['Enter Email', 'Verify Code', 'New Password'];

  // Shared input style
  const inputStyle = {
    background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:12,
    padding:'13px 14px', fontSize:14, width:'100%', boxSizing:'border-box',
    outline:'none', color:'#1e293b', transition:'border-color .2s',
  };

  const EyeIcon = ({visible}) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#dce8f7', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400, background:'#fff', borderRadius:24, boxShadow:'0 8px 40px rgba(37,99,235,.13)', padding:'40px 32px 32px' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:24 }}>
          <img src="/logo.jpg" alt="SlashIt" style={{ width:36, height:36, objectFit:'contain', borderRadius:8 }}/>
          <span style={{ fontSize:22, fontWeight:900, color:'#1e293b' }}>SlashIt</span>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:28 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:11, fontWeight:800,
                  background: i < step ? '#2563eb' : i === step ? '#1e293b' : '#e2e8f0',
                  color: i < step ? '#fff' : i === step ? '#fff' : '#94a3b8',
                  transition:'all .3s',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div style={{ fontSize:9, fontWeight:700, color: i === step ? '#2563eb' : i < step ? '#16a34a' : '#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>
                  {label}
                </div>
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ width:36, height:2, background: i < step ? '#2563eb' : '#e2e8f0', margin:'0 6px', marginBottom:16, transition:'background .3s' }}/>
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Enter Email ── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#1e293b', marginBottom:6, textAlign:'center' }}>Forgot Password?</div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:24, textAlign:'center', lineHeight:1.6 }}>
              Enter your email address and we will send you a 6-digit verification code.
            </div>
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Email Address</div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.edu.ng" onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  style={{ ...inputStyle, paddingLeft:44 }}
                  onFocus={e => e.target.style.borderColor='#2563eb'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
              </div>
            </div>
            <div style={{ height:20 }}/>
            <button onClick={sendOtp} disabled={loading}
              style={{ width:'100%', padding:'14px', background:'#2563eb', color:'#fff', fontWeight:800, fontSize:15, borderRadius:14, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading && <span className="spin" style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/>}
              Send Code
            </button>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <button onClick={() => nav('/login')} style={{ color:'#64748b', fontWeight:600, fontSize:13, background:'none', border:'none', cursor:'pointer' }}>← Back to Sign In</button>
            </div>
          </div>
        )}

        {/* ── Step 1: Enter OTP ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#1e293b', marginBottom:6, textAlign:'center' }}>Check Your Email</div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:6, textAlign:'center', lineHeight:1.6 }}>
              We sent a 6-digit code to
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#2563eb', textAlign:'center', marginBottom:24 }}>{email}</div>
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Verification Code</div>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                placeholder="000000" maxLength={6}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                style={{ ...inputStyle, fontSize:28, letterSpacing:14, textAlign:'center', fontWeight:900, padding:'14px' }}
                onFocus={e => e.target.style.borderColor='#2563eb'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
            </div>

            <button onClick={verifyOtp} disabled={loading}
              style={{ width:'100%', padding:'14px', background:'#2563eb', color:'#fff', fontWeight:800, fontSize:15, borderRadius:14, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
              {loading && <span className="spin" style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/>}
              Verify Code
            </button>
            <div style={{ textAlign:'center' }}>
              <button onClick={resendOtp} disabled={cooldown > 0}
                style={{ color: cooldown > 0 ? '#94a3b8' : '#2563eb', fontWeight:600, fontSize:13, background:'none', border:'none', cursor: cooldown > 0 ? 'default' : 'pointer' }}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
            <div style={{ textAlign:'center', marginTop:8 }}>
              <button onClick={() => { setStep(0); setOtp(''); }} style={{ color:'#64748b', fontWeight:600, fontSize:13, background:'none', border:'none', cursor:'pointer' }}>← Wrong email?</button>
            </div>
          </div>
        )}

        {/* ── Step 2: New Password ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#1e293b', marginBottom:6, textAlign:'center' }}>Set New Password</div>
            <div style={{ fontSize:13, color:'#64748b', marginBottom:24, textAlign:'center', lineHeight:1.6 }}>
              Create a new password for <strong style={{ color:'#1e293b' }}>{email}</strong>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>New Password</div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingLeft:44, paddingRight:44 }}
                    onFocus={e => e.target.style.borderColor='#2563eb'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
                  <button onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <EyeIcon visible={showPw}/>
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Confirm New Password</div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter password"
                    style={{ ...inputStyle, paddingLeft:44, paddingRight:44 }}
                    onFocus={e => e.target.style.borderColor='#2563eb'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
                  <button onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    <EyeIcon visible={showConfirm}/>
                  </button>
                </div>
              </div>
            </div>
            {newPw.length > 0 && newPw.length < 6 && (
              <div style={{ background:'#fef3c7', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#92400e', marginBottom:12 }}>Password must be at least 6 characters</div>
            )}
            {newPw.length >= 6 && confirmPw.length > 0 && newPw !== confirmPw && (
              <div style={{ background:'#fee2e2', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#dc2626', marginBottom:12 }}>Passwords do not match</div>
            )}
            <button onClick={resetPassword} disabled={loading || newPw.length < 6 || newPw !== confirmPw}
              style={{ width:'100%', padding:'14px', background: newPw.length >= 6 && newPw === confirmPw ? '#2563eb' : '#e2e8f0', color: newPw.length >= 6 && newPw === confirmPw ? '#fff' : '#94a3b8', fontWeight:800, fontSize:15, borderRadius:14, border:'none', cursor: loading || newPw.length < 6 || newPw !== confirmPw ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading && <span className="spin" style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block' }}/>}
              Reset Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { ForgotPasswordPage }
export { ForgotPassword as ForgotPasswordPage };
