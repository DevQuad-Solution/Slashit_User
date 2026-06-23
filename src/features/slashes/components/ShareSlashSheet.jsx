/**
 * ShareSlashSheet
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
import QRCode from 'qrcode';
import { toast } from '../../../toast';

export function ShareSlashSheet({ slash, user, onClose }) {
  const [copying, setCopying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const flyerRef = useRef(null);

  const joinLink = `https://slashit.ng/join/${slash.id}`;
  const slotsLeft = slash.totalSlots - slash.filledSlots;
  const pct = Math.round(slash.filledSlots / slash.totalSlots * 100);

  // Time remaining
  const timeLeft = (() => {
    const diff = new Date(slash.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  })();

  const totalCost = (slash.pricePerSlot || 0) + (slash.transportFee || 0);
  const hasTransport = (slash.transportFee || 0) > 0;

  // Generate QR code on mount
  useEffect(() => {
    QRCode.toDataURL(joinLink, { width: 200, margin: 1, color: { dark: '#1e3a8a', light: '#ffffff' } })
      .then(url => setQrDataUrl(url))
      .catch(() => {});
  }, []);

  const shareText = `⚡ SLASH ALERT!\n\nI'm organising a group buy for:\n${slash.emoji} ${slash.name}\n\n💰 Only ${fmt(totalCost)}/slot${hasTransport ? ' (transport included)' : ''}\n📍 Pickup: ${slash.hubName}, ${slash.city}\n⏰ ${timeLeft} — ${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left!\n\n👇 Join directly:\n${joinLink}\n\n(You need a SlashIt account to join. Download & verify to secure your spot.)`;

  const copyText = async () => {
    setCopying(true);
    try { await navigator.clipboard.writeText(shareText); toast.success('✅ Message copied! Paste to WhatsApp.'); }
    catch(e) { toast.error('Copy failed — please copy manually.'); }
    setTimeout(() => setCopying(false), 1500);
  };

  const downloadFlyer = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(flyerRef.current, {
        scale: 3, useCORS: true, allowTaint: true, backgroundColor: null,
        logging: false, imageTimeout: 5000,
      });
      const link = document.createElement('a');
      link.download = `slashit-${(slash?.name || '').replace(/\s+/g,'-').toLowerCase()}-${slash.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('📥 Flyer downloaded! Post to WhatsApp status.');
    } catch(e) { toast.error('Could not generate flyer. Try copy text instead.'); }
    setGenerating(false);
  };

  const nativeShare = async () => {
    if (!navigator.share) { copyText(); return; }
    try { await navigator.share({ title: `⚡ Join my ${slash.name} slash on SlashIt`, text: shareText, url: joinLink }); }
    catch(e) {}
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, maxHeight:'95vh', overflowY:'auto', paddingBottom:32 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'#e2e8f0' }}/>
        </div>

        <div style={{ padding:'8px 20px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#1e293b' }}>Share & Fill Slash</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{slotsLeft} slot{slotsLeft!==1?'s':''} left · {timeLeft}</div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#64748b', border:'none', cursor:'pointer' }}>✕</button>
          </div>

          {/* Flyer preview — this div gets screenshotted */}
          <div ref={flyerRef} style={{
            width:'100%', background:'#fff', borderRadius:20, overflow:'hidden',
            border:'1px solid #e2e8f0', marginBottom:16,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(150deg,#0c1f6e 0%,#1e3a8a 45%,#2563eb 100%)', padding:'24px 22px 26px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-60, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
              <div style={{ position:'absolute', bottom:-40, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
              {/* Logo */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, position:'relative', zIndex:1 }}>
                <img src="/logo.jpg" alt="SlashIt" style={{ width:32, height:32, borderRadius:8, objectFit:'cover', border:'1.5px solid rgba(255,255,255,.3)' }} onError={e=>{e.target.style.display='none';}}/>
                <span style={{ fontWeight:900, fontSize:18, color:'#fff', letterSpacing:'-.3px' }}>Slash<span style={{ color:'#93c5fd' }}>It</span></span>
                <span style={{ marginLeft:'auto', background:'rgba(74,222,128,.2)', border:'1px solid rgba(74,222,128,.4)', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#86efac' }}>● OPEN</span>
              </div>
              {/* Product */}
              <div style={{ fontSize:52, marginBottom:10, position:'relative', zIndex:1 }}>{slash.emoji}</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.15, position:'relative', zIndex:1 }}>{slash.name}</div>
            </div>

            {/* Price band */}
            <div style={{ background:'linear-gradient(95deg,#1a3bbf,#2563eb)', padding:'14px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'3px solid #1534a0' }}>
              <div>
                <div style={{ fontSize:10, color:'#93c5fd', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Your slot costs</div>
                <div style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>{fmt(totalCost)}</div>
                {hasTransport && <div style={{ fontSize:10, color:'#93c5fd', marginTop:2 }}>🚚 Transport included</div>}
              </div>
              <div style={{ textAlign:'center', background:'rgba(255,255,255,.12)', border:'2px solid rgba(255,255,255,.2)', borderRadius:14, padding:'8px 16px' }}>
                <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1 }}>{slotsLeft}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#bfdbfe', textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>slots left</div>
              </div>
            </div>

            {/* Urgency ribbon */}
            <div style={{ background:'linear-gradient(90deg,#b91c1c,#dc2626)', padding:'7px 22px', display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:700, color:'#fff' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#fca5a5', flexShrink:0 }}/>
              ⏰ {timeLeft} remaining — Don't miss out!
            </div>

            {/* Progress */}
            <div style={{ padding:'14px 22px 10px', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:7 }}>
                <span>Slots filled</span>
                <span style={{ color:'#2563eb' }}>{slash.filledSlots} of {slash.totalSlots} joined</span>
              </div>
              <div style={{ height:8, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#1e40af,#3b82f6)', borderRadius:99 }}/>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding:'8px 22px' }}>
              {[['📍', `${slash.hubName}, ${slash.city}`, 'Pickup location after delivery'],
                ['💰', 'Pay via SlashIt Wallet', 'Funds in escrow — released after delivery verified'],
                ['🛡️', 'Escrow-Protected', 'Funds released only after delivery is verified']].map(([icon, main, sub]) => (
                <div key={main} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{main}</div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shared by */}
            <div style={{ padding:'10px 22px' }}>
              <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#1e3a8a,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border:'2px solid #bfdbfe', flexShrink:0 }}>
                  {(user?.avatarEmoji) || '👤'}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>Shared by {(user?.name||'').split(' ')[0]}</div>
                  <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>Scan QR or tap the link below to join</div>
                </div>
              </div>
            </div>

            {/* Footer / QR */}
            <div style={{ background:'linear-gradient(150deg,#0c1f6e,#1e3a8a,#1d4ed8)', padding:'18px 22px 20px', display:'flex', alignItems:'center', gap:14 }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" style={{ width:80, height:80, background:'#fff', borderRadius:12, padding:6, flexShrink:0 }}/>
              ) : (
                <div style={{ width:80, height:80, background:'rgba(255,255,255,.1)', borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#93c5fd' }}>QR</div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1.25, marginBottom:4 }}>Scan to join or download SlashIt</div>
                <div style={{ fontSize:11, color:'#93c5fd', fontWeight:700, marginBottom:6 }}>slashit.ng/join/{slash.id}</div>
                <div style={{ height:1, background:'rgba(255,255,255,.1)', marginBottom:6 }}/>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.4)' }}>KYC required · Escrow-protected · Verified members only</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={downloadFlyer} disabled={generating}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', opacity:generating?0.7:1 }}>
              {generating ? '⏳ Generating...' : '📥 Download Flyer (WhatsApp Status)'}
            </button>
            <button onClick={copyText} disabled={copying}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px', borderRadius:14, border:'2px solid #2563eb', background:'#fff', color:'#2563eb', fontWeight:800, fontSize:15, cursor:'pointer' }}>
              {copying ? '✅ Copied!' : '📋 Copy Message (WhatsApp Group)'}
            </button>
            {navigator.share && (
              <button onClick={nativeShare}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'12px', borderRadius:14, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                📤 Share via...
              </button>
            )}
          </div>

          <div style={{ marginTop:14, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', fontSize:11, color:'#15803d', lineHeight:1.5 }}>
            💡 <strong>Tip:</strong> Share the flyer to your WhatsApp status, and paste the message to your class group. The more people see it, the faster your slash fills up!
          </div>
        </div>
      </div>
    </div>
  );
}
