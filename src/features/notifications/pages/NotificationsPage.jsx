/**
 * Notifications
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
import { LegalFooter } from '../../../components/layout/LegalFooter';

export function Notifications() {
  const nav = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const typeIcon = { slash_update:'⚡', pickup_ready:'📦', wallet:'💰', referral:'🎁', system:'ℹ️' };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.notifications.getMine();
        const list = res.data?.notifications || res.data || [];
        setNotifs(Array.isArray(list) ? list : []);
      } catch(e) {
        setNotifs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 15000);
    return () => clearInterval(iv);
  }, []);

  const markRead = (id) => setNotifs(n => n.map(x => x._id===id||x.id===id ? {...x,isRead:true} : x));
  const markAllRead = () => setNotifs(n => n.map(x => ({...x,isRead:true})));

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, display: 'block', marginBottom: 8 }}>←</button>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Notifications</div>
        </div>
        <button onClick={markAllRead} style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', background: 'none', fontWeight: 600, marginBottom: 4 }}>Mark all read</button>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <div className="spin" style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', margin:'0 auto' }}/>
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px', color:'#94a3b8' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔔</div>
            <div style={{ fontSize:17, fontWeight:700, color:'#1e293b', marginBottom:8 }}>No notifications yet</div>
            <div style={{ fontSize:13, lineHeight:1.6 }}>When you join or create slashes, get deliveries, or receive updates — they willll appear here.</div>
          </div>
        ) : notifs.map(n => {
          const nid = n._id || n.id;
          return (
            <Card key={nid} onClick={() => markRead(nid)}
              style={{ padding:14, opacity:n.isRead?.7:1, cursor:'pointer', borderLeft:`3px solid ${n.isRead?'transparent':'#2563eb'}` }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{typeIcon[n.type]||'🔔'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{n.title}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2, lineHeight:1.4 }}>{n.body||n.message}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>{fromNow(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#2563eb', flexShrink:0, marginTop:4 }}/>}
              </div>
            </Card>
          );
        })}
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { NotificationsPage }
export { Notifications as NotificationsPage };
