/**
 * MySlashes
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
import { CancelSlashModal } from '../components/CancelSlashModal';

export function MySlashes() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [slashes, setSlashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.slashes.getMySlashes();
        const list = res.data?.slashes || res.data || [];
        setSlashes(Array.isArray(list) ? list.map(s => ({...s, id:s._id||s.id, isMine:true})) : []);
      } catch(e) {
        setSlashes([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const confirmCancel = async (penalty, refund) => {
    try { await api.slashes.leave(cancelTarget.id); } catch(e) {}
    const updated = slashes.filter(s => (s._id||s.id) !== (cancelTarget._id||cancelTarget.id));
    setSlashes(updated);
    const updatedUser = { ...user, walletBalance: (user.walletBalance||0) + refund };
    updateSession(updatedUser);
    toast.success(`Cancelled. ${fmt(refund)} refunded.`); setCancelTarget(null);
  };

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>My Slashes</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Your active & past group buys</div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <div className="spin" style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', margin:'0 auto' }}/>
          </div>
        ) : slashes.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚡</div>
            <div style={{ fontWeight:600 }}>No slashes yet</div>
            <Btn style={{ marginTop:14 }} onClick={() => nav('/create')}>Create your first slash</Btn>
          </div>
        ) : slashes.map(s => (
          <SlashFeedCard key={s._id||s.id} slash={{...s,id:s._id||s.id}} onClick={() => nav(`/slash/${s._id||s.id}`)}
            onCancel={s.status === 'open' ? () => setCancelTarget(s) : null} />
        ))}
      </div>
      <LegalFooter />
      {cancelTarget && <CancelSlashModal slash={cancelTarget} onConfirm={confirmCancel} onClose={() => setCancelTarget(null)} />}
    </div>
  );
}

// Re-export alias so App.jsx can import { MySlashesPage }
export { MySlashes as MySlashesPage };
