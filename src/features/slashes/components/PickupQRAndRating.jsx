/**
 * PickupQRAndRating
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

export function PickupQRAndRating({ slash, user }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [myQRCode, setMyQRCode] = useState(`QR-${slash.id||slash._id}-01`);
  const [isCollected, setIsCollected] = useState(false);
  const [loadingQR, setLoadingQR] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.slashes.getQR(slash._id||slash.id);
        const data = res.data || res;
        setMyQRCode(data.qrCode || data.code || `QR-${slash._id||slash.id}-01`);
        setIsCollected(data.status === 'collected' || data.collected === true);
      } catch(e) {
        setMyQRCode(`QR-${slash._id||slash.id}-01`);
      } finally {
        setLoadingQR(false);
      }
    };
    fetchQR();
    const iv = setInterval(fetchQR, 15000);
    return () => clearInterval(iv);
  }, [slash._id||slash.id]);

  const submitRating = async () => {
    if (!rating) { toast.error('Tap a star to rate this hub'); return; }
    setSubmitting(true);
    try {
      await api.hubs.rate(slash.hubId, rating, review);
    } catch(e) {
      // Save locally as fallback
      const ratings = storage.load('hub_ratings', {});
      ratings[`${slash.id}-${user.id}`] = { rating, review, hubId: slash.hubId };
      storage.save('hub_ratings', ratings);
    }
    setSubmitted(true); setSubmitting(false);
    toast.success(`⭐ ${rating}/5 — Thank you for rating ${slash.hubName}!`);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* QR Card */}
      {isCollected ? (
        <div style={{ padding:24, background:'#f0fdf4', border:'2px solid #16a34a', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:10 }}>✅</div>
          <div style={{ fontWeight:900, color:'#15803d', fontSize:18, marginBottom:6 }}>Order Collected!</div>
          <div style={{ fontSize:12, color:'#166534', marginBottom:4 }}>Your order was picked up from <strong>{slash.hubName}</strong></div>
          <div style={{ fontSize:11, color:'#4ade80', fontWeight:700, background:'#14532d', borderRadius:8, padding:'6px 14px', display:'inline-block', marginTop:8 }}>
            {myCollectionRecord?.collectedAt ? new Date(myCollectionRecord.collectedAt).toLocaleString('en-NG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Collected ✓'}
          </div>
        </div>
      ) : (
      <div style={{ padding:16, background:'#f0fdf4', border:'2px solid #bbf7d0', borderRadius:14, textAlign:'center' }}>
        <div style={{ fontSize:28, marginBottom:8 }}>📦</div>
        <div style={{ fontWeight:800, color:'#15803d', fontSize:15, marginBottom:4 }}>Ready for Pickup!</div>
        <div style={{ fontSize:12, color:'#166534', marginBottom:14 }}>Go to <strong>{slash.hubName}</strong> with this QR code</div>
        <div style={{ background:'#fff', borderRadius:12, padding:16, margin:'0 auto 12px', width:150, height:150, display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #16a34a', position:'relative', overflow:'hidden', boxShadow:'0 2px 12px rgba(22,163,74,.2)' }}>
          {/* Corner markers */}
          {[[0,0],[0,1],[1,0]].map(([r,c],i) => (
            <div key={i} style={{ position:'absolute', top: r===0?8:'auto', bottom: r===1?8:'auto', left: c===0?8:'auto', right: c===1?8:'auto', width:28, height:28, border:'4px solid #16a34a', borderRadius: r===0&&c===0?'6px 0 0 0':r===0&&c===1?'0 6px 0 0':'0 0 0 6px', borderRight: c===1?'4px solid #16a34a':'none', borderBottom: r===1?'4px solid #16a34a':'none', borderTop: r===0?'4px solid #16a34a':'none', borderLeft: c===0?'4px solid #16a34a':'none' }}/>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2, width:112, height:112 }}>
            {Array.from({length:64}).map((_,i) => {
              const seed = ((slash.id * (i+3) * 13) + i*7) % 7;
              return <div key={i} style={{ borderRadius:1, background: seed < 3 ? '#111' : 'transparent' }}/>;
            })}
          </div>
        </div>
        <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:800, color:'#1e293b', letterSpacing:'1px' }}>{myQRCode}</div>
        <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Show to attendant at {slash.hubName}</div>
      </div>
      )}

      {/* Hub Rating & Review */}
      <Card style={{ padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:40, height:40, background:'#fef3c7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⭐</div>
          <div>
            <div style={{ fontWeight:800, color:'#1e293b', fontSize:14 }}>Rate Pickup Station</div>
            <div style={{ fontSize:11, color:'#64748b' }}>{slash.hubName} · Help other students</div>
          </div>
        </div>

        {submitted ? (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #bfdbfe', borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
            <div style={{ fontWeight:700, color:'#15803d', fontSize:13 }}>Review submitted!</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Your rating helps other students choose reliable hubs</div>
          </div>
        ) : (
          <>
            {/* Stars */}
            <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:12 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onMouseEnter={() => setHoveredStar(n)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(n)}
                  style={{ fontSize:32, background:'none', padding:4, transition:'transform .1s', transform: (hoveredStar||rating) >= n ? 'scale(1.15)' : 'scale(1)', filter: (hoveredStar||rating) >= n ? 'none' : 'grayscale(1) opacity(0.35)' }}>
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ fontSize:12, fontWeight:700, color:'#d97706', textAlign:'center', marginBottom:10 }}>
                {['','Very Poor','Poor','Okay','Good','Excellent!'][rating]}
              </div>
            )}
            {/* Review text */}
            <textarea value={review} onChange={e => setReview(e.target.value)}
              placeholder="Share your experience... (optional)"
              rows={2}
              style={{ width:'100%', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'10px 12px', fontSize:12, fontFamily:'inherit', resize:'none', marginBottom:10, outline:'none', boxSizing:'border-box', lineHeight:1.5 }}
            />
            <Btn full loading={submitting} onClick={submitRating} disabled={!rating}
              style={{ background:'#d97706', padding:'12px' }}>
              Submit Rating ⭐
            </Btn>
          </>
        )}
      </Card>
    </div>
  );
}
