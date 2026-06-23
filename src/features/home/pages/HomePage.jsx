/**
 * Home
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
import { LegalFooter } from '../../../components/layout/LegalFooter';
import { SlashFeedCard } from '../../../features/home/components/SlashFeedCard';
import { CancelSlashModal } from '../../../features/slashes/components/CancelSlashModal';

export function Home() {
  const { updateSession } = useSession();
  const nav = useNavigate(); const F = getFlags();
  // Load packages from backend products API (no mock)
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    api.products.getAll().then(res => {
      const list = res.data || [];
      // Map API product fields to what the packages UI expects
      setPackages(Array.isArray(list) ? list.filter(p => p.status !== 'Inactive').map(p => ({
        id: p._id || p.id,
        name: p.name,
        emoji: p.emoji || '📦',
        description: p.description || '',
        defaultPrice: p.pricePerSlot || Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        pricePerSlot: p.pricePerSlot || Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        defaultSlots: p.noOfSlots || 4,
        totalValue: p.totalValue || 0,
        category: p.category || '',
        isActive: p.status === 'Active',
      })) : []);
    }).catch(() => setPackages([]));
  }, []);
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [slashes, setSlashes] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loadingSlashes, setLoadingSlashes] = useState(true);
  const [filter, setFilter] = useState('For You');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [priceJumpTarget, setPriceJumpTarget] = useState(null);
  const [deadlineTarget, setDeadlineTarget] = useState(null);

  // Load user, slashes and notifications from API
  const fetchData = async () => {
    try {
      const [meRes, slashRes, notifRes] = await Promise.all([
        api.auth.me(),
        api.slashes.getMySlashes(),
        api.notifications.getMine(),
      ]);
      // /auth/me returns { data: { userAccountDetails, kyc, hub, ... } } — no data.user wrapper
      const me = extractUser(meRes);
      if (me) {
        const updated = mapUser(me, user);
        updateSession(updated);
      }
      const slashList = slashRes?.data || slashRes?.slashes || [];
      const notifList = notifRes?.data || notifRes?.notifications || [];
      setSlashes(Array.isArray(slashList) ? slashList : []);
      setNotifs(Array.isArray(notifList) ? notifList : []);
    } catch(e) {
      // Fallback to empty state on network error
      toast.error('Failed to load feed. Pull to retry.');
      setSlashes([]);
      setNotifs([]);
    } finally {
      setLoadingSlashes(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Refresh every 30s and on focus
  useEffect(() => {
    const iv = setInterval(fetchData, 30000);
    window.addEventListener('focus', fetchData);
    return () => { clearInterval(iv); window.removeEventListener('focus', fetchData); };
  }, []);

  // Strict location filter — only show slashes at the user's primary hub
  const _hubId = user.hubId;
  const _city  = user.city;
  const hubSlashes = [...slashes]
    .filter(s => {
      if (!_hubId && !_city) return true;
      if (_hubId) return String(s.hubId) === String(_hubId);
      return s.city === _city;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const feedSlashes = hubSlashes.filter(s => {
    if (filter === 'For You') {
      if (s.status !== 'open') return false;
      const fillRate = (s.filledSlots||0) / Math.max(s.totalSlots||1, 1);
      const hoursLeft = s.expiresAt ? (new Date(s.expiresAt) - Date.now()) / 3600000 : 99;
      // Show all open slashes on this hub, sorted by urgency+fill (AI scoring)
      return true;
    }
    if (filter === 'Trending') return (s.filledSlots||0) / Math.max(s.totalSlots||1,1) >= 0.5 && s.status === 'open';
    if (filter === 'Ending Soon') return s.status === 'open' && new Date(s.expiresAt) - Date.now() < 24 * 3600000;
    return s.status === 'open' || s.status === 'ready_for_pickup';
  }).sort((a, b) => {
    if (filter !== 'For You') return 0;
    // AI sort: score by fill rate + urgency
    const scoreA = (a.filledSlots||0)/Math.max(a.totalSlots||1,1) + (a.expiresAt ? Math.max(0, 1-(new Date(a.expiresAt)-Date.now())/86400000) : 0);
    const scoreB = (b.filledSlots||0)/Math.max(b.totalSlots||1,1) + (b.expiresAt ? Math.max(0, 1-(new Date(b.expiresAt)-Date.now())/86400000) : 0);
    return scoreB - scoreA;
  });

  const openCount = hubSlashes.filter(s => s.status === 'open').length;
  const myActiveSlashes = slashes.filter(s => s.isMine && (s.status === 'open' || s.status === 'ready_for_pickup'));
  const unreadCount = notifs.filter(n => !n.isRead && !n.read).length;

  const handleCancel = (slash) => { setCancelTarget(slash); };
  const confirmCancel = (penalty, refund) => {
    const updated = slashes.map(s => s.id === cancelTarget.id
      ? { ...s, filledSlots: Math.max(0, s.filledSlots - 1), isMine: false, isLeader: false, status: s.filledSlots - 1 <= 0 ? 'dissolved' : s.status }
      : s);
    setSlashes(updated); storage.save('slashes', updated);
    const updatedUser = { ...user, walletBalance: (user.walletBalance || 0) + refund };
    updateSession(updatedUser);
    // Log cancellation for admin
    const cancels = storage.load('cancellations', []);
    storage.save('cancellations', [{
      id: 'cancel-' + Date.now(), slashId: cancelTarget.id, slashName: cancelTarget.name,
      userId: user.id, userName: user.name, penalty, refund,
      status: 'pending_refund', createdAt: new Date().toISOString(),
    }, ...cancels]);
    toast.success(`Cancelled. ${fmt(refund)} refunded to wallet.`);
    setCancelTarget(null);
  };

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.jpg" alt="SlashIt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Slashit</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Hub location pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 10px', border: '1px solid rgba(255,255,255,.3)' }}>
              <span style={{ fontSize: 12 }}>📍</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{user.hubName || 'Select Hub'}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)' }}>{user.city}</span>
            </div>
            <button onClick={() => nav('/notifications')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
              🔔
              {unreadCount > 0 && <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', border: '2px solid #2563eb' }}>{unreadCount}</div>}
            </button>
          </div>
        </div>

        {/* Wallet balance */}
        <div onClick={() => nav('/wallet')} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,.2)', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginBottom: 2 }}>Wallet Balance</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmt(user.walletBalance)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {F.walletFunding && (
              <button onClick={e => { e.stopPropagation(); nav('/wallet/fund'); }} style={{ background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 700, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)' }}>Fund Wallet</button>
            )}
            <button onClick={e => { e.stopPropagation(); nav('/kyc'); }} style={{ background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12, padding: '7px 14px', borderRadius: 10 }}>Verify</button>
          </div>
        </div>

        {user.kycStatus !== 'verified' && (
          <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 600, marginBottom: 4 }}>
            🔒 Complete Level 2 verification to unlock full access.
          </div>
        )}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* 📡 AI Radar — shows when active slashes exist */}
        {hubSlashes.filter(s=>s.status==='open').length > 0 && (() => {
          const radarPicks = hubSlashes
            .filter(s => s.status === 'open' && s.totalSlots > 0)
            .map(s => {
              const fillRate = (s.filledSlots || 0) / (s.totalSlots || 1);
              const hoursLeft = s.expiresAt ? Math.max(0,(new Date(s.expiresAt)-Date.now())/3600000) : 48;
              const urgency = fillRate * Math.max(0, 1 - hoursLeft/24);
              const score = Math.round((urgency * 60) + (fillRate > 0.5 ? 30 : 10));
              return { ...s, radarScore: Math.min(99, score) };
            })
            .sort((a,b) => b.radarScore - a.radarScore)
            .slice(0, 5);
          if (radarPicks.length === 0) return null;
          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ fontSize:14 }}>📡</span>
                <span style={{ fontWeight:800, fontSize:13, color:'#1e293b' }}>Radar Picks</span>
                <span style={{ fontSize:10, background:'#eff6ff', color:'#1d4ed8', fontWeight:700, padding:'2px 8px', borderRadius:10, border:'1px solid #bfdbfe' }}>AI</span>
              </div>
              <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                {radarPicks.map(s => (
                  <div key={s.id||s._id} onClick={()=>nav('/slash/'+(s.id||s._id))}
                    style={{ minWidth:160, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius:14, padding:'12px 14px', cursor:'pointer', flexShrink:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:4 }}>
                      📡 SCORE {s.radarScore}
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1.3, marginBottom:6 }}>{s.name||s.productName}</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#fbbf24' }}>{fmt(s.pricePerSlot)}<span style={{ fontSize:9, color:'rgba(255,255,255,.6)', fontWeight:400 }}>/slot</span></div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', marginTop:4 }}>
                      {(s.totalSlots||0)-(s.filledSlots||0)} slots left
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['For You', 'All', 'Trending', 'Ending Soon'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '2px solid', borderColor: filter === f ? '#2563eb' : '#e2e8f0', background: filter === f ? '#2563eb' : '#fff', color: filter === f ? '#fff' : '#64748b' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Active slashes header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>Active slashes</div>
          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{openCount} available</div>
        </div>

        {/* Leaderboard banner */}
        {F.leaderboard && (
          <div onClick={() => nav('/leaderboard')} style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>Campus Pride Leaderboard 🏆</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>{user.hostel || 'Your hostel'} — check your rank this week!</div>
            </div>
            <span style={{ fontSize: 26 }}>›</span>
          </div>
        )}

        {/* Referral banner */}
        {F.referrals && (
          <div onClick={() => nav('/referral')} style={{ background: '#eff6ff', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', border: '1.5px solid #bfdbfe', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>🎁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 13 }}>Invite friends, earn rewards!</div>
              <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 1 }}>You have earned {fmt(user.referralEarnings || 0)} from {user.referralCount || 0} referrals</div>
            </div>
          </div>
        )}

        {/* Slash feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feedSlashes.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No slashes yet</div>
                <div style={{ fontSize: 12 }}>Be the first to create one at {user.hubName}!</div>
                <Btn style={{ marginTop: 14 }} onClick={() => nav('/create')}>Create a Slash ⚡</Btn>
              </div>
            )
            : feedSlashes.map(s => (
              <SlashFeedCard key={s.id} slash={s}
                onClick={() => nav(`/slash/${s.id}`)}
                onCancel={s.isMine && s.status === 'open' ? () => handleCancel(s) : null}
              />
            ))
          }
        </div>

        {/* Packages */}
        {F.foodPackages && packages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>Special Packages 🍱</div>
              <button onClick={() => nav('/packages')} style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, background: 'none' }}>See all</button>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {packages.length === 0 ? (
                <div style={{ padding:'20px 0', color:'#94a3b8', fontSize:13, minWidth:200 }}>
                  No packages yet — check back soon.
                </div>
              ) : packages.map(p => (
                <div key={p.id} onClick={() => nav(`/package/${p.id}`)} style={{ flexShrink: 0, width: 150, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
                  <div style={{ background: p.themeColor, padding: '14px 12px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 44, opacity: .2, lineHeight: 1 }}>{p.emoji}</div>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{p.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{p.name}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#2563eb' }}>{fmt(p.pricePerSlot)}<span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>/slot</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {cancelTarget && <CancelSlashModal slash={cancelTarget} onConfirm={confirmCancel} onClose={() => setCancelTarget(null)} />}
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { HomePage }
export { Home as HomePage };
