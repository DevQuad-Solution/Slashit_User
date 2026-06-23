/**
 * KYC
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

export function KYC() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [user, setUserState] = useState(() => storage.load('session', {}));
  // Persist nin and started so refresh doesn't wipe progress
  const [nin, setNin] = useState(() => { try { return localStorage.getItem('slashit_kyc_draft_nin') || ''; } catch(e) { return ''; } });
  const [selfieDataUrl, setSelfieDataUrl] = useState(() => { try { return localStorage.getItem('slashit_user_kyc_selfie') || null; } catch(e) { return null; } });
  const [kycConsent, setKycConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(() => { try { return localStorage.getItem('slashit_kyc_draft_started') === '1'; } catch(e) { return false; } });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const saveUser = u => { updateSession(u); };

  const setNinPersist = (val) => {
    setNin(val);
    try { localStorage.setItem('slashit_kyc_draft_nin', val); } catch(e) {}
  };
  const setStartedPersist = (val) => {
    setStarted(val);
    try { localStorage.setItem('slashit_kyc_draft_started', val ? '1' : '0'); } catch(e) {}
  };

  // Auto-refresh: poll every 3s to detect admin approval
  useEffect(() => {
    const iv = setInterval(() => {
      const fresh = storage.load('session', null);
      if (fresh && fresh.kycStatus !== user.kycStatus) {
        setUserState(fresh);
        updateSession(fresh);
        if (fresh.kycStatus === 'verified') {
          toast.success('✅ Your identity has been verified by admin!');
          const notifs = storage.load('notifications', []);
          storage.save('notifications', [{ id:'notif-kyc-'+Date.now(), type:'kyc_approved', title:'🔐 Identity Verified!', body:'Your KYC has been approved. You can now create and join slashes.', isRead:false, createdAt:new Date().toISOString() }, ...notifs]);
          // Clear draft on approval
          try { localStorage.removeItem('slashit_kyc_draft_nin'); localStorage.removeItem('slashit_kyc_draft_started'); } catch(e) {}
        }
        if (fresh.kycStatus === 'rejected') {
          toast.error('❌ KYC rejected. Please resubmit.');
          const notifs = storage.load('notifications', []);
          storage.save('notifications', [{ id:'notif-kyc-'+Date.now(), type:'kyc_rejected', title:'❌ KYC Rejected', body:'Your identity verification was rejected. Please resubmit with clearer documents.', isRead:false, createdAt:new Date().toISOString() }, ...notifs]);
        }
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [user.kycStatus]);

  // Open camera
  const openCamera = async () => {
    setCameraError('');
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch(e) {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 320;
    c.height = v.videoHeight || 240;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    setSelfieDataUrl(dataUrl);
    // Persist selfie for pending screen thumbnail
    try {
      localStorage.setItem('slashit_user_kyc_selfie', dataUrl);
    } catch(e) {
      toast.error('Storage full — clear browser data and try again');
    }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
    toast.success('📸 Selfie captured!');
  };

  // Close camera without capturing
  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  // Submit KYC — saves real NIN + selfie to dedicated submissions table
  const submit = async () => {
    if (nin.trim().length !== 11 || !/^\d{11}$/.test(nin.trim())) {
      toast.error('Enter your 11-digit NIN');
      return;
    }
    if (!selfieDataUrl) { toast.error('Take your selfie first'); return; }
    if (!kycConsent) { toast.error('You must consent to NIN verification'); return; }
    setLoading(true);
    try {
      // POST /auth/kyc — multipart/form-data
      // Fields: nin (string 11 chars), image (File), consent (boolean)
      // Response: { data: { verified, kycStatus, walletBalance, verificationDetails, user } }

      // Convert base64 dataURL selfie to File object
      const res = await fetch(selfieDataUrl);
      const blob = await res.blob();
      const imageFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      const form = new FormData();
      form.append('nin', nin.trim());
      form.append('image', imageFile);
      form.append('consent', 'true');

      const kycRes = await api.auth.submitKyc(form);
      // Response may include updated kycStatus and user fields
      const kycData = kycRes?.data || {};
      const updatedUser = {
        ...user,
        kycStatus: (kycData.kycStatus || 'pending').toLowerCase(),
        walletBalance: kycData.walletBalance ?? user.walletBalance,
      };
      saveUser(updatedUser);
      // Clear draft state
      try {
        localStorage.removeItem('slashit_kyc_draft_nin');
        localStorage.removeItem('slashit_kyc_draft_started');
      } catch(e) {}
      toast.success('KYC submitted. Under review — we will notify you within 24 hours.');
      nav('/profile');
    } catch(err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('balance')) {
        toast.error('Insufficient wallet balance. Fund your wallet with at least ₦100 before submitting KYC.');
      } else if (msg.toLowerCase().includes('nin') || msg.toLowerCase().includes('invalid')) {
        toast.error(msg || 'Invalid NIN. Check the number and try again.');
      } else {
        toast.error(msg || 'KYC submission failed. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const kycColorMap = { unverified:'#f59e0b', pending:'#2563eb', verified:'#16a34a', rejected:'#dc2626' };
  const kycLabelMap = { unverified:'Unverified', pending:'Pending Review', verified:'Verified ✓', rejected:'Rejected' };
  const kycColor = kycColorMap[user.kycStatus] || '#f59e0b';
  const kycLabel = kycLabelMap[user.kycStatus] || 'Unverified';

  // Already verified
  if (user.kycStatus === 'verified') return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column', padding:24 }}>
      <button onClick={() => nav(-1)} style={{ color:'#64748b', background:'none', fontSize:22, marginBottom:20, alignSelf:'flex-start' }}>←</button>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, textAlign:'center' }}>
        <div style={{ width:100, height:100, background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52, boxShadow:'0 4px 24px rgba(22,163,74,.2)' }}>✅</div>
        <div style={{ fontSize:24, fontWeight:900, color:'#1e293b' }}>Identity Verified!</div>
        <div style={{ fontSize:14, color:'#64748b', lineHeight:1.8, maxWidth:300 }}>Your account is fully verified. You can now create and join slashes freely. Welcome to the community!</div>
        <Btn onClick={() => nav('/home')} style={{ padding:'14px 32px', fontSize:15 }}>Back to Home</Btn>
      </div>
    </div>
  );

  // Pending — show thumbnail + masked NIN from localStorage
  if (user.kycStatus === 'pending') {
    const savedSelfie = (() => { try { return localStorage.getItem('slashit_user_kyc_selfie'); } catch(e) { return null; } })();
    const maskedNin = user.kycNin ? ('•••••••' + String(user.kycNin).slice(-4)) : '•••••••••••';
    return (
      <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column', padding:24 }}>
        <button onClick={() => nav(-1)} style={{ color:'#64748b', background:'none', fontSize:22, marginBottom:20, alignSelf:'flex-start' }}>←</button>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, textAlign:'center' }}>
          <div style={{ width:100, height:100, background:'#fef3c7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>⏳</div>
          <div style={{ fontSize:24, fontWeight:900, color:'#1e293b' }}>Under Review</div>
          <div style={{ fontSize:14, color:'#64748b', lineHeight:1.8, maxWidth:320 }}>
            Your NIN and selfie are being reviewed by our compliance team. This usually takes <strong>1–24 hours</strong>. You will be notified once approved.
          </div>
          {/* Submission proof */}
          <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:16, padding:16, width:'100%', maxWidth:320, display:'flex', gap:14, alignItems:'center', textAlign:'left' }}>
            {savedSelfie
              ? <img src={savedSelfie} alt="Your selfie" style={{ width:56, height:56, borderRadius:10, objectFit:'cover', border:'2px solid #e2e8f0', flexShrink:0 }}/>
              : <div style={{ width:56, height:56, borderRadius:10, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📷</div>
            }
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:4 }}>SUBMITTED</div>
              <div style={{ fontSize:12, color:'#1e293b', fontWeight:600 }}>NIN: <span style={{ fontFamily:'monospace' }}>{maskedNin}</span></div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Submitted {new Date(user.kycSubmittedAt).toLocaleDateString('en-NG')}</div>
            </div>
          </div>
          <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
            <span className="spin" style={{ width:14, height:14, border:'2px solid #2563eb', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#1d4ed8', fontWeight:600 }}>Auto-checking for approval every 3s…</span>
          </div>
          <Btn variant="secondary" onClick={() => nav('/profile')} style={{ padding:'12px 28px' }}>Back to Profile</Btn>
        </div>
      </div>
    );
  }

  // Rejected — allow resubmit
  if (user.kycStatus === 'rejected') return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column', padding:24 }}>
      <button onClick={() => nav(-1)} style={{ color:'#64748b', background:'none', fontSize:22, marginBottom:20, alignSelf:'flex-start' }}>←</button>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, textAlign:'center' }}>
        <div style={{ width:100, height:100, background:'#fee2e2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>❌</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#1e293b' }}>Verification Rejected</div>
        <div style={{ fontSize:14, color:'#64748b', lineHeight:1.8, maxWidth:300 }}>Your KYC was not approved. Common reasons: blurry selfie, incorrect NIN, or name mismatch. Please resubmit with clear photos.</div>
        <Btn onClick={() => { saveUser({...user, kycStatus:'unverified'}); setStartedPersist(true); try { localStorage.removeItem('slashit_user_kyc_selfie'); } catch(e) {} setSelfieDataUrl(null); setNinPersist(''); }} style={{ background:'#dc2626', padding:'14px 28px' }}>Resubmit Verification</Btn>
      </div>
    </div>
  );

  // Camera overlay
  if (cameraOpen) return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#0f172a', padding:'52px 20px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={closeCamera} style={{ color:'rgba(255,255,255,.8)', background:'none', fontSize:22 }}>✕</button>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Take Selfie</div>
        <div style={{ width:32 }}/>
      </div>
      {cameraError ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, gap:16, textAlign:'center' }}>
          <div style={{ fontSize:48 }}>📷</div>
          <div style={{ fontSize:14, color:'#f87171', lineHeight:1.6 }}>{cameraError}</div>
          <Btn onClick={closeCamera} variant="secondary">Go Back</Btn>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:20 }}>
          <div style={{ position:'relative', width:'100%', maxWidth:340, borderRadius:20, overflow:'hidden', border:'3px solid #3b82f6', boxShadow:'0 0 40px rgba(59,130,246,.4)' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', display:'block', background:'#1e293b' }}/>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ width:180, height:220, border:'2.5px dashed rgba(255,255,255,.5)', borderRadius:'50%' }}/>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }}/>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', textAlign:'center' }}>Center your face in the oval · Good lighting · Look straight ahead</div>
          <Btn onClick={capturePhoto} style={{ padding:'16px 40px', fontSize:16, background:'#2563eb', borderRadius:50 }}>📸 Capture</Btn>
        </div>
      )}
    </div>
  );

  // NIN + Selfie form
  if (started) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 28px' }}>
        <button onClick={() => setStartedPersist(false)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block' }}>←</button>
        <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>Identity Verification</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4 }}>Step 2 of 2 — NIN + Live Selfie</div>
      </div>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
        {/* Why */}
        <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', marginBottom:4 }}>🔒 Why we need this</div>
          <div style={{ fontSize:12, color:'#2563eb', lineHeight:1.6 }}>Your NIN is needed to link your virtual account to a verified identity. This protects all group members from fraud and ensures responsible use of the platform.</div>
        </div>
        {/* NIN Input */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>National Identification Number (NIN)</div>
          <input type="tel" value={nin} maxLength={11} onChange={e => setNinPersist(e.target.value.replace(/\D/g,''))}
            placeholder="Enter your 11-digit NIN"
            style={{ fontSize:20, fontWeight:800, letterSpacing:'3px', textAlign:'center', fontFamily:'monospace', border: nin.length===11?'2.5px solid #16a34a':'2px solid #e2e8f0', borderRadius:14, padding:'16px', width:'100%', boxSizing:'border-box' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <div style={{ fontSize:11, color:'#94a3b8' }}>Never share your NIN with anyone</div>
            <div style={{ fontSize:12, fontWeight:700, color: nin.length===11?'#16a34a':'#94a3b8' }}>{nin.length}/11 {nin.length===11&&'✓'}</div>
          </div>
        </div>
        {/* Selfie Capture */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Live Selfie — Phone Camera</div>
          {selfieDataUrl ? (
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', border:'2.5px solid #16a34a' }}>
              <img src={selfieDataUrl} alt="Selfie" style={{ width:'100%', display:'block', maxHeight:200, objectFit:'cover' }}/>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(22,163,74,.85)', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>✓ Selfie captured</span>
                <button onClick={openCamera} style={{ fontSize:11, color:'#fff', background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.3)', borderRadius:8, padding:'4px 10px', fontWeight:700 }}>Retake</button>
              </div>
            </div>
          ) : (
            <div onClick={openCamera}
              style={{ border:'2px dashed #cbd5e1', borderRadius:16, padding:'32px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, cursor:'pointer', background:'#fff', transition:'all .15s' }}>
              <div style={{ width:72, height:72, background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📷</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#1e293b', marginBottom:4 }}>Open Camera</div>
                <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>Take a clear selfie · Good lighting<br/>Look straight at the camera</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'#2563eb', background:'#eff6ff', padding:'6px 16px', borderRadius:20 }}>Tap to Open Camera →</div>
            </div>
          )}
        </div>
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:12, fontSize:11, color:'#64748b', lineHeight:1.6 }}>
          🛡️ Your identity data will be handled securely. NIN verification partner integration is in progress. Selfie is used only for identity matching during this session.
        </div>
        {/* KYC/biometric consent — must tick before submitting */}
        <div
          onClick={()=>setKycConsent(v=>!v)}
          style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 14px', userSelect:'none', WebkitUserSelect:'none' }}>
          <input type="checkbox" checked={!!kycConsent}
            onChange={e=>{ e.stopPropagation(); setKycConsent(e.target.checked); }}
            onClick={e=>e.stopPropagation()}
            style={{ width:20, height:20, marginTop:1, accentColor:'#d97706', flexShrink:0, cursor:'pointer' }}/>
          <span style={{ fontSize:12, color:'#78350f', lineHeight:1.5 }}>
            I consent to identity verification and understand my NIN and selfie will be used to verify my identity. I confirm this information is accurate and belongs to me.
          </span>
        </div>
        <Btn full loading={loading} disabled={nin.length!==11||!selfieDataUrl||!kycConsent} onClick={submit} style={{ padding:'16px', fontSize:15, borderRadius:14 }}>
          Submit for Verification →
        </Btn>
        <div style={{ fontSize:11, color:'#64748b', textAlign:'center', marginTop:6 }}>
          Wallet balance: <strong style={{ color: (user?.walletBalance || 0) >= 100 ? '#16a34a' : '#dc2626' }}>₦{(user?.walletBalance || 0).toLocaleString()}</strong>
          {(user?.walletBalance || 0) < 100 && (
            <span style={{ color:'#dc2626', display:'block', marginTop:3, fontWeight:600 }}>
              ⚠️ Fund your wallet with at least ₦100 before submitting
            </span>
          )}
        </div>
        {nin.length===11 && !selfieDataUrl && (
          <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center' }}>Take your selfie to enable submission</div>
        )}
      </div>
    </div>
  );

  // Landing page
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'52px 20px 0' }}>
        <button onClick={() => nav(-1)} style={{ color:'#64748b', background:'none', fontSize:22, marginBottom:20 }}>←</button>
      </div>
      <div style={{ flex:1, padding:'0 20px 24px', display:'flex', flexDirection:'column', gap:20 }}>
        {/* Profile card */}
        <div style={{ background:'#fff', borderRadius:20, padding:'24px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, boxShadow:'0 1px 10px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' }}>
          <div style={{ width:72, height:72, background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, border:'3px solid #bae6fd' }}>
            {user.avatarEmoji || '🧑🏾'}
          </div>
          <div style={{ fontSize:17, fontWeight:900, color:'#1e293b' }}>{user.name}</div>
          <div style={{ fontSize:13, color:'#64748b' }}>{user.email}</div>
          <span style={{ background: kycColor+'22', color: kycColor, fontWeight:700, fontSize:12, padding:'4px 14px', borderRadius:20, border:`1px solid ${kycColor}44` }}>
            {kycLabel}
          </span>
        </div>
        {/* Steps card */}
        <div style={{ background:'#fff', borderRadius:20, padding:20, boxShadow:'0 1px 10px rgba(0,0,0,.06)', border:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:40, height:40, background:'#fef3c7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🔐</div>
            <div>
              <div style={{ fontWeight:800, color:'#1e293b', fontSize:15 }}>Complete Verification</div>
              <div style={{ fontSize:12, color:'#64748b' }}>Unlock full access to SlashIt</div>
            </div>
          </div>
          {[
            { num:1, title:'Basic Info', sub:'Name, Email and Phone — already done', done: true },
            { num:2, title:'NIN Entry', sub:'Your 11-digit National Identification Number', done: false },
            { num:3, title:'Live Selfie', sub:'Quick photo via your phone camera', done: false },
            { num:4, title:'Admin Review', sub:'Verified within 1–24 hours', done: false },
          ].map((s, i) => (
            <div key={s.num} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 0', borderTop: i>0?'1px solid #f1f5f9':'none' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0, background: s.done?'#16a34a':'#f1f5f9', border: s.done?'2px solid #16a34a':'2px solid #e2e8f0', color: s.done?'#fff':'#94a3b8' }}>
                {s.done ? '✓' : s.num}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color: s.done?'#15803d':'#1e293b' }}>{s.title}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{s.sub}</div>
              </div>
            </div>
          ))}
          <Btn full onClick={() => setStartedPersist(true)} style={{ marginTop:16, padding:'16px', fontSize:15, background:'#16a34a', borderRadius:14 }}>
            Start Verification →
          </Btn>
        </div>
        <div style={{ fontSize:11, color:'#94a3b8', textAlign:'center', lineHeight:1.7 }}>
          🔒 Your data is handled securely · Identity verification partner integration in progress · Compliance checks underway
        </div>
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { KYCPage }
export { KYC as KYCPage };
