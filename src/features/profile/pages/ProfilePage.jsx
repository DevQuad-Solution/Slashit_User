/**
 * Profile
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

export function Profile() {
  const { updateSession, logout: contextLogout } = useSession();
  const nav = useNavigate(); const F = getFlags();
  const [user, setUserState] = useState(() => storage.load('session', {}));
  const [showHostelPicker, setShowHostelPicker] = useState(false);
  // Refresh user from backend on every profile visit to get latest kycStatus, plan, etc.
  useEffect(() => {
    api.auth.me().then(res => {
      const me = extractUser(res);
      if (me) {
        const updated = mapUser(me, user);
        updateSession(updated);
      }
    }).catch(() => {});
  }, []);
  // Fetch hostels from admin API
  const [adminHostels, setAdminHostels] = useState(()=>getAdminHostels([]));
  useEffect(()=>{
    // Use api.js to stay consistent with centralized axios client
    api.admin.getHostels?.()
      .then(d=>{ const list = d?.data?.hostels || d?.data || []; if(Array.isArray(list) && list.length > 0) setAdminHostels(list); })
      .catch(()=>{});
  },[]);
  const liveHostels = adminHostels.length > 0 ? adminHostels : getAdminHostels([]);
  // Load real hubs for hub change picker
  const [allHubs, setAllHubs] = useState([]);
  const [showHubPicker, setShowHubPicker] = useState(false);
  const [loadingProfileHubs, setLoadingProfileHubs] = useState(false);

  // Load hubs when picker opens (not on mount — avoids rate-limit conflict with onboarding)
  const openHubPicker = async () => {
    setShowHubPicker(true);
    // Load backup from localStorage immediately while API loads
    try {
      const backup = JSON.parse(localStorage.getItem('slashit_hubs_backup') || '[]');
      if (backup.length > 0) { setAllHubs(backup); return; } // already have data
    } catch(e) {}
    // No backup — fetch from API now
    setLoadingProfileHubs(true);
    const hubList = [];
    try {
      const statesRes = await api.hubs.getStates();
      const statesList = statesRes.data || [];
      for (const s of statesList) {
        const stateName = s.state || s.name;
        if (!stateName) continue;
        let cities = [];
        try { cities = (await api.hubs.getCities(stateName)).data || []; } catch(e) { continue; }
        for (const c of cities) {
          const cityName = c.city || c.name;
          if (!cityName) continue;
          try {
            await new Promise(r => setTimeout(r, 1200));
            const hubs = (await api.hubs.getHubs(stateName, cityName)).data || [];
            hubs.forEach(h => hubList.push({ ...h, id: h._id||h.id, state: stateName, city: cityName }));
          } catch(e) {}
        }
      }
      if (hubList.length > 0) {
        setAllHubs(hubList);
        try { localStorage.setItem('slashit_hubs_backup', JSON.stringify(hubList)); } catch(e) {}
      }
    } catch(e) {}
    setLoadingProfileHubs(false);
  };

  const planBadge = { free:{ label:'Basic', bg:'#f1f5f9', c:'#64748b' }, student:{ label:'Student', bg:'#dbeafe', c:'#1d4ed8' }, premium:{ label:'Premium', bg:'#fef3c7', c:'#d97706' } };
  const pb = planBadge[user.plan] || planBadge.free;
  const kycColors = { unverified:{ label:'Unverified', bg:'#fee2e2', c:'#dc2626' }, pending:{ label:'Pending Review', bg:'#fef3c7', c:'#d97706' }, verified:{ label:'Verified ✓', bg:'#dcfce7', c:'#16a34a' }, rejected:{ label:'Rejected', bg:'#fee2e2', c:'#dc2626' } };
  const kycBadge = kycColors[user.kycStatus] || kycColors.unverified;

  const saveUser = updated => { updateSession(updated); };
  const logout = () => { contextLogout(); nav('/login'); };

  const selectHostel = h => { saveUser({ ...user, hostel: h }); setShowHostelPicker(false); toast.success('Hostel updated!'); };
  // Filter hostels by user's city so only relevant hostels are shown
  const cityHostelsProfile = liveHostels.filter(h => !h.city || h.city.toLowerCase() === (user.city||'').toLowerCase());
  const filteredLiveHostels = cityHostelsProfile.length > 0 ? cityHostelsProfile : liveHostels;
  const hostelList = filteredLiveHostels.map(h => ({ name: h.name || h, campus: h.campus || '' }));

  const menuItems = [
    { icon:'⚡', bg:'#eff6ff', label:'My Slashes',       sub:'Active & past group buys',                onClick:() => nav('/slashes') },
    { icon:'💳', bg:'#eff6ff', label:'Wallet',           sub:fmt(user.walletBalance) + ' available',      onClick:() => nav('/wallet') },
    { icon:'🔔', bg:'#fef3c7', label:'Notifications',    sub:'Alerts & updates',                          onClick:() => nav('/notifications') },
    ...(F.leaderboard  ? [{ icon:'🏆', bg:'#fef3c7', label:'Leaderboard',  sub: user.hostel ? `Rank for ${user.hostel}` : 'Set hostel first', onClick:() => nav('/leaderboard') }] : []),
    ...(F.referrals    ? [{ icon:'🎁', bg:'#f0fdf4', label:'Referrals',   sub:`${user.referralCount||0} friends · ${fmt(user.referralEarnings||0)} earned`, onClick:() => nav('/referral') }] : []),
    { icon:'🔐', bg: user.kycStatus==='verified'?'#dcfce7':'#fee2e2', label:'Identity Verification', sub: kycBadge.label, badge: kycBadge, onClick:() => nav('/kyc') },
    ...(F.studentPlans ? [{ icon:'🎓', bg:'#eff6ff', label:'Subscription', sub:pb.label, badge:{ label: user.plan==='free'?'Upgrade':'Active', bg: user.plan==='free'?'#fee2e2':pb.bg, c: user.plan==='free'?'#dc2626':pb.c }, onClick:() => nav('/subscription') }] : []),
    ...(F.foodPackages ? [{ icon:'🍱', bg:'#f0fdf4', label:'Food Packages', sub:'Seasonal bundles',   onClick:() => nav('/packages') }] : []),
    { icon:'⚙️', bg:'#f1f5f9', label:'Settings',         sub:'Account preferences',                      onClick:() => nav('/settings') },
  ];

  return (
    <div style={{ background:'#f0f4ff', minHeight:'auto', paddingBottom:100 }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.06)' }}/>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20 }}>
          <div style={{ width:64, height:64, background:'rgba(255,255,255,.2)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, border:'2px solid rgba(255,255,255,.3)', flexShrink:0 }}>{user.avatarEmoji||'🧑🏾'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:'#fff', fontSize:18 }}>{user.name}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{user.email}</div>
            <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
              <Badge label={pb.label} bg="rgba(255,255,255,.2)" color="#fff"/>
              <Badge label={kycBadge.label} bg={kycBadge.bg} color={kycBadge.c}/>
            </div>
          </div>
        </div>

        {/* Hub row — tappable to change → goes to full 3-step picker */}
        <div onClick={() => nav('/change-hub')} style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'12px 16px', cursor:'pointer', border:'1.5px solid rgba(255,255,255,.2)', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:2 }}>🏪 Delivery Hub <span onClick={openHubPicker} style={{ fontSize:10, background:'rgba(255,255,255,.15)', padding:'1px 7px', borderRadius:10, marginLeft:4, cursor:'pointer' }}>Tap to change</span></div>
            <div style={{ fontWeight:700, color:'#fff' }}>{user.hubName || 'No hub selected'}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>{user.state && user.city ? `${user.state} › ${user.city}` : 'Set your location'}</div>
          </div>
          <span style={{ color:'rgba(255,255,255,.6)', fontSize:20 }}>›</span>
        </div>

        {/* Hostel row */}
        <div onClick={() => setShowHostelPicker(true)} style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'12px 16px', cursor:'pointer', border:'1.5px solid rgba(255,255,255,.2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginBottom:2 }}>🏠 Hostel <span style={{ fontSize:10, background:'rgba(255,255,255,.15)', padding:'1px 7px', borderRadius:10, marginLeft:4 }}>Tap to change</span></div>
            <div style={{ fontWeight:700, color:'#fff' }}>{user.hostel||'Tap to set your hostel'}</div>
          </div>
          <span style={{ color:'rgba(255,255,255,.6)', fontSize:20 }}>›</span>
        </div>
      </div>

      <div style={{ padding:'0 16px 80px' }}>
        {/* KYC banner if not verified */}
        {user.kycStatus !== 'verified' && (
          <div onClick={() => nav('/kyc')} style={{ background:'#fef9c3', border:'1.5px solid #fde68a', borderRadius:14, padding:'12px 14px', margin:'14px 0 4px', cursor:'pointer', display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#92400e' }}>Complete Identity Verification</div>
              <div style={{ fontSize:11, color:'#78350f', marginTop:1 }}>Required to create & join slashes · Tap to verify</div>
            </div>
            <span style={{ color:'#d97706', fontSize:16 }}>›</span>
          </div>
        )}

        {/* Stats row */}
        <Card style={{ padding:'12px 14px', marginTop:14, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div><div style={{ fontSize:11, color:'#64748b' }}>Hub</div><div style={{ fontWeight:700, color:'#1e293b', fontSize:13 }}>{user.hubName||'—'}</div></div>
            <div style={{ textAlign:'right' }}><div style={{ fontSize:11, color:'#64748b' }}>Wallet</div><div style={{ fontWeight:700, color:'#1d4ed8', fontSize:13 }}>{fmt(user.walletBalance)}</div></div>
            <div style={{ textAlign:'right' }}><div style={{ fontSize:11, color:'#64748b' }}>KYC</div><div style={{ fontWeight:700, fontSize:13, color: user.kycStatus==='verified'?'#16a34a':'#dc2626' }}>{user.kycStatus==='verified'?'Verified':'Pending'}</div></div>
          </div>
        </Card>

        <Card>
          {menuItems.map((item,i) => (
            <div key={item.label} onClick={item.onClick} style={{ display:'flex', gap:12, alignItems:'center', padding:'14px', borderBottom: i<menuItems.length-1 ?'1px solid #f1f5f9':'none', cursor:'pointer' }}>
              <div style={{ width:38, height:38, background:item.bg||'#eff6ff', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{item.label}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{item.sub}</div>
              </div>
              {item.badge && <Badge label={item.badge.label} bg={item.badge.bg} color={item.badge.c}/>}
              <span style={{ color:'#cbd5e1', fontSize:16 }}>›</span>
            </div>
          ))}
        </Card>
        <button onClick={logout} style={{ width:'100%', marginTop:14, marginBottom:16, padding:'14px', borderRadius:14, border:'2px solid #fee2e2', color:'#dc2626', fontWeight:700, fontSize:14, background:'#fff' }}>Sign Out</button>
      </div>

      {/* Hub Picker Modal */}
      {showHubPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
          onClick={e=>e.target===e.currentTarget&&setShowHubPicker(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', maxHeight:'80vh', overflowY:'auto', padding:'20px 16px 40px' }}>
            <div style={{ width:36, height:4, background:'#e2e8f0', borderRadius:2, margin:'0 auto 16px' }}/>
            <div style={{ fontWeight:800, fontSize:16, color:'#1e293b', marginBottom:4 }}>Change Pickup Hub</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:16 }}>Select your primary pickup location</div>
            {loadingProfileHubs ? (
              <div style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:13 }}>
                <span className="spin" style={{ width:20,height:20,border:'2px solid #e2e8f0',borderTopColor:'#2563eb',borderRadius:'50%',display:'inline-block',marginBottom:8 }}/><br/>Loading hubs…
              </div>
            ) : allHubs.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:13 }}>No hubs available</div>
            ) : allHubs.map(h => (
              <div key={h.id} onClick={() => {
                saveUser({ ...user, hubId:h.id, hubName:h.name, city:h.city, state:h.state });
                setShowHubPicker(false);
                toast.success('Hub changed to ' + h.name);
              }} style={{ padding:'14px 16px', borderRadius:12, border:'2px solid',
                borderColor: user.hubId===h.id?'#2563eb':'#e2e8f0',
                background: user.hubId===h.id?'#eff6ff':'#fff', marginBottom:8, cursor:'pointer' }}>
                <div style={{ fontWeight:700, color:user.hubId===h.id?'#1d4ed8':'#1e293b', fontSize:14 }}>
                  {h.name}{user.hubId===h.id?' ✓':''}
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{h.city}, {h.state}</div>
                {h.address && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{h.address}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hostel Picker Modal */}
      <Modal open={showHostelPicker} onClose={() => setShowHostelPicker(false)} title="Choose Your Hostel">
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:400, overflowY:'auto' }}>
          {hostelList.map(h => (
            <button key={h.name} onClick={() => selectHostel(h.name)} style={{ padding:'12px 14px', borderRadius:12, textAlign:'left', display:'flex', alignItems:'center', gap:10, background: user.hostel===h.name?'#f0fdf4':'#f8fafc', border:`1.5px solid ${user.hostel===h.name?'#86efac':'#e2e8f0'}` }}>
              <span style={{ fontSize:18 }}>🏠</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{h.name} {user.hostel===h.name&&'✓'}</div>
                {h.campus && <div style={{ fontSize:11, color:'#64748b' }}>{h.campus}</div>}
              </div>
            </button>
          ))}
        </div>
      </Modal>
      <LegalFooter />
      {/* BottomNav is rendered by AppLayout — no need here */}
    </div>
  );
}

// Re-export alias so App.jsx can import { ProfilePage }
export { Profile as ProfilePage };
