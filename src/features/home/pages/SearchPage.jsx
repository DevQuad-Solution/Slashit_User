/**
 * Search
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
import { SlashFeedCard } from '../../../features/home/components/SlashFeedCard';

export function Search() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [slashes, setSlashes] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = storage.load('session', {});

  const doSearch = async (query) => {
    setLoading(true);
    try {
      const res = await api.slashes.search(query, 1, 50);
      const list = res.data?.slashes || res.data?.results || res.data || [];
      setSlashes(Array.isArray(list) ? list : []);
    } catch(e) {
      // Fallback to local
      setSlashes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { doSearch(''); }, []);
  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = slashes.filter(s => {
    const matchC = cat === 'All' || s.category === cat;
    return matchC && (s.status === 'open' || s.status === 'ready_for_pickup');
  });

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 16px' }}>
        <div style={{ fontWeight: 900, color: '#fff', fontSize: 20, marginBottom: 6 }}>Search Slashes</div>
        {user.hubName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>📍</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{user.hubName}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>· {user.city}</span>
          </div>
        )}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
          style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, width: '100%', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cat === c ? '#fff' : 'rgba(255,255,255,.15)', color: cat === c ? '#2563eb' : '#fff', border: 'none' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48 }}>
            <div className="spin" style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', margin:'0 auto' }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No slashes found</div>
            <div style={{ fontSize: 12 }}>at {user.hubName || 'your hub'}</div>
            <Btn style={{ marginTop: 14 }} onClick={() => nav('/create')}>Create one now ⚡</Btn>
          </div>
        ) : filtered.map(s => <SlashFeedCard key={s._id||s.id} slash={{...s, id:s._id||s.id}} onClick={() => nav(`/slash/${s._id||s.id}`)} />)
        }
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { SearchPage }
export { Search as SearchPage };
