/**
 * JoinLanding
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

export function JoinLanding() {
  const nav = useNavigate();
  const { id } = useParams();
  const [slash, setSlash] = useState(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [step, setStep] = useState('view'); // view | reserve | reserved | full
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Load slash from localStorage
  useEffect(() => {
    reservations.expire();
    const allSlashes = JSON.parse(localStorage.getItem('slashit_user_slashes') || '[]');
    const found = allSlashes.find(s => String(s.id) === String(id));
    if (found) { setSlash(found); } else {
      // Try mock data as fallback
      setSlash(null);
    }
  }, [id]);

  // Countdown timer for reservation
  useEffect(() => {
    if (!reservation) return;
    const iv = setInterval(() => {
      const ms = new Date(reservation.expiresAt).getTime() - Date.now();
      if (ms <= 0) { setCountdown('Expired'); clearInterval(iv); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, [reservation]);

  const availableSlots = slash ? slash.totalSlots - (slash.filledSlots || 0) - (slash.reservedSlots || 0) : 0;
  const pct = slash ? Math.round((slash.filledSlots || 0) / slash.totalSlots * 100) : 0;

  const timeLeft = (() => {
    if (!slash) return '';
    const diff = new Date(slash.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  })();

  const handleReserve = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 10) { setPhoneError('Enter a valid phone number (e.g. 08012345678)'); return; }
    if (availableSlots <= 0) { toast.error('No slots available'); return; }
    setSubmitting(true);
    await delay(800);
    const res = reservations.add(id, cleaned);
    // Increment reservedSlots on the slash
    try {
      const allSlashes = JSON.parse(localStorage.getItem('slashit_user_slashes') || '[]');
      const upd = allSlashes.map(s => String(s.id) === String(id) ? { ...s, reservedSlots: (s.reservedSlots || 0) + 1 } : s);
      localStorage.setItem('slashit_user_slashes', JSON.stringify(upd));
    } catch(e) {}
    // Save pending join intent for after signup
    localStorage.setItem('slashit_pending_join', JSON.stringify({ slashId: id, phone: cleaned, reservationId: res.id }));
    setReservation(res);
    setStep('reserved');
    setSubmitting(false);
  };

  if (!slash) return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24 }}>
      <div style={{ fontSize:48 }}>🔍</div>
      <div style={{ fontWeight:800, fontSize:18, color:'#1e293b' }}>Slash not found</div>
      <div style={{ fontSize:13, color:'#64748b', textAlign:'center' }}>This slash may have expired or been cancelled.</div>
      <button onClick={() => nav('/login')} style={{ background:'#2563eb', color:'#fff', fontWeight:700, padding:'12px 24px', borderRadius:12, border:'none', fontSize:14, marginTop:8 }}>Open SlashIt</button>
    </div>
  );

  if (step === 'reserved') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1e3a8a,#2563eb)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:8 }}>Slot Reserved!</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,.8)', lineHeight:1.6, maxWidth:320, marginBottom:24 }}>
        We have held a slot in <strong style={{ color:'#fff' }}>{slash.name}</strong> for your number <strong style={{ color:'#93c5fd' }}>{phone}</strong>.<br/><br/>
        {storage.load('session', null)
          ? 'You are already signed in. Go join the slash now before your slot expires!'
          : <>You have <strong style={{ color:'#fbbf24' }}>{countdown || '2h 0m 0s'}</strong> to create your account and join. After that the slot will be released.</>
        }
      </div>
      <div style={{ background:'rgba(255,255,255,.15)', borderRadius:16, padding:'16px 20px', marginBottom:24, width:'100%', maxWidth:320 }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginBottom:4 }}>⏰ Your slot expires in</div>
        <div style={{ fontSize:28, fontWeight:900, color:'#fbbf24', letterSpacing:1 }}>{countdown || '2:00:00'}</div>
      </div>
      {storage.load('session', null) ? (
        <button onClick={() => nav('/slash/' + id)} style={{ width:'100%', maxWidth:320, background:'#fff', color:'#1d4ed8', fontWeight:800, padding:'16px', borderRadius:14, border:'none', fontSize:16, marginBottom:12 }}>
          Go Join Slash Now →
        </button>
      ) : (
        <>
          <button onClick={() => nav('/signup')} style={{ width:'100%', maxWidth:320, background:'#fff', color:'#1d4ed8', fontWeight:800, padding:'16px', borderRadius:14, border:'none', fontSize:16, marginBottom:12 }}>
            Create Account & Join →
          </button>
          <button onClick={() => nav('/login')} style={{ color:'rgba(255,255,255,.7)', background:'none', border:'none', fontSize:13, fontWeight:600 }}>Already have an account? Sign in</button>
        </>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(150deg,#0c1f6e 0%,#1e3a8a 45%,#2563eb 100%)', padding:'52px 20px 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, position:'relative', zIndex:1 }}>
          <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', background:'#fff', flexShrink:0 }}>
            <img src="/logo.jpg" alt="SlashIt" style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e=>{e.target.style.display='none';}}/>
          </div>
          <span style={{ fontWeight:900, fontSize:18, color:'#fff' }}>Slash<span style={{ color:'#93c5fd' }}>It</span></span>
          <span style={{ marginLeft:'auto', background:availableSlots>0?'rgba(74,222,128,.2)':'rgba(239,68,68,.2)', border:`1px solid ${availableSlots>0?'rgba(74,222,128,.4)':'rgba(239,68,68,.4)'}`, borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:availableSlots>0?'#86efac':'#fca5a5' }}>
            {availableSlots > 0 ? '● OPEN' : '● FULL'}
          </span>
        </div>
        <div style={{ fontSize:52, marginBottom:10, position:'relative', zIndex:1 }}>{slash.emoji}</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2, position:'relative', zIndex:1 }}>{slash.name}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4 }}>Group buy · {slash.hubName}, {slash.city}</div>
      </div>

      {/* Price band */}
      <div style={{ background:'linear-gradient(95deg,#1a3bbf,#2563eb)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, color:'#93c5fd', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Your slot costs</div>
          <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>{fmt(slash.pricePerSlot)}</div>
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,.12)', border:'2px solid rgba(255,255,255,.2)', borderRadius:14, padding:'8px 16px' }}>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{availableSlots}</div>
          <div style={{ fontSize:10, fontWeight:700, color:'#bfdbfe', textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>slots left</div>
        </div>
      </div>

      {/* Urgency */}
      <div style={{ background:'linear-gradient(90deg,#b91c1c,#dc2626)', padding:'7px 20px', display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:700, color:'#fff' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#fca5a5', flexShrink:0 }}/>
        ⏰ {timeLeft} remaining
      </div>

      <div style={{ padding:'16px 16px 80px' }}>
        {/* Progress */}
        <div style={{ background:'#fff', borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:8 }}>
            <span>Slots filled</span>
            <span style={{ color:'#2563eb' }}>{slash.filledSlots} of {slash.totalSlots}</span>
          </div>
          <div style={{ height:8, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#1e40af,#3b82f6)', borderRadius:99, transition:'width .4s' }}/>
          </div>
          {(slash.reservedSlots || 0) > 0 && (
            <div style={{ fontSize:11, color:'#d97706', marginTop:6, fontWeight:600 }}>⏳ {slash.reservedSlots} slot{slash.reservedSlots>1?'s':''} spots reserved (awaiting signup)</div>
          )}
        </div>

        {/* Details */}
        <div style={{ background:'#fff', borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
          {[
            ['📍', 'Pickup Location', `${slash.hubName}, ${slash.city}`],
            ['🛡️', 'Payment', 'Escrow-protected — funds released only after delivery verified'],
            ['👥', 'Group Size', `${slash.totalSlots} members split the cost`],
          ].map(([icon, label, val]) => (
            <div key={label} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
              <div>
                <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginTop:1 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Reserve form */}
        {availableSlots > 0 && step === 'view' && (
          <div style={{ background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Reserve your slot</div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:14, lineHeight:1.5 }}>Enter your phone number to hold a slot for 2 hours while you create your account.</div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 }}>Phone Number</label>
              <input
                type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                placeholder="08012345678"
                style={{ width:'100%', padding:'13px 14px', borderRadius:12, border:`2px solid ${phoneError?'#ef4444':'#e2e8f0'}`, fontSize:16, fontWeight:600, boxSizing:'border-box', outline:'none' }}
              />
              {phoneError && <div style={{ fontSize:11, color:'#ef4444', marginTop:4, fontWeight:600 }}>{phoneError}</div>}
            </div>
            <button onClick={handleReserve} disabled={submitting}
              style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', fontWeight:800, fontSize:15, borderRadius:13, border:'none', cursor:'pointer', opacity:submitting?0.6:1 }}>
              {submitting ? '⏳ Reserving…' : '⚡ Reserve My Slot — ' + fmt(slash.pricePerSlot)}
            </button>
            <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#94a3b8' }}>
              Already have an account?{' '}
              <button onClick={() => {
                if (storage.load('session', null)) { nav('/slash/' + id); }
                else { localStorage.setItem('slashit_pending_join', JSON.stringify({ slashId: id })); nav('/login'); }
              }} style={{ color:'#2563eb', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontSize:12 }}>
                {storage.load('session', null) ? 'Go to slash →' : 'Sign in to join →'}
              </button>
            </div>
          </div>
        )}

        {availableSlots <= 0 && (
          <div style={{ background:'#fee2e2', border:'1.5px solid #fecaca', borderRadius:14, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>😔</div>
            <div style={{ fontWeight:800, fontSize:16, color:'#dc2626', marginBottom:4 }}>Slash is Full</div>
            <div style={{ fontSize:13, color:'#7f1d1d', lineHeight:1.5 }}>All slots have been taken. Create an account to get notified when similar slashes open up.</div>
            <button onClick={() => nav('/signup')} style={{ background:'#dc2626', color:'#fff', fontWeight:700, padding:'12px 24px', borderRadius:12, border:'none', fontSize:14, marginTop:14 }}>Create Account</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { JoinLandingPage }
export { JoinLanding as JoinLandingPage };
