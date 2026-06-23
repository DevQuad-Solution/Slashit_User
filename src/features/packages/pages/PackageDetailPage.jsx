/**
 * PackageDetail
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

export function PackageDetail() {
  const nav = useNavigate();
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    api.products.getAll().then(res => {
      const list = res.data || [];
      setPackages(Array.isArray(list) ? list.filter(p=>p.status!=='Inactive').map(p=>({
        id:p._id||p.id, name:p.name, emoji:p.emoji||'📦', description:p.description||'',
        pricePerSlot:p.pricePerSlot||Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        defaultPrice:p.pricePerSlot||Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        defaultSlots:p.noOfSlots||4, totalValue:p.totalValue||0, category:p.category||'',
      })) : []);
    }).catch(()=>{});
  }, []);
  const id = window.location.pathname.split('/').pop();
  const pkg = packages.find(p => p.id === id) || packages[0] || null;
  const [joining, setJoining] = useState(false);
  const join = async () => { setJoining(true); await delay(800); toast.success('Joined package!'); nav('/home'); setJoining(false); };
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: pkg.themeColor, padding: '52px 16px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, fontSize: 160, opacity: .1, lineHeight: 1 }}>{pkg.emoji}</div>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 12, position: 'relative' }}>←</button>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{pkg.emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pkg.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>{pkg.description}</div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['Per Slot', fmt(pkg.pricePerSlot), '#1d4ed8'], ['Total', fmt(pkg.totalPrice), '#1e293b'], ['Slots', pkg.defaultSlots, '#16a34a'], ['Theme', pkg.theme, '#7c3aed']].map(([l, v, c]) => (
              <div key={l} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: c, marginTop: 3, textTransform: 'capitalize' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: 13 }}>Included</div>
          {pkg.products.map(p => <div key={p} style={{ fontSize: 13, color: '#64748b', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>✓ {p}</div>)}
        </Card>
        <Btn full loading={joining} onClick={join}>Join Package — {fmt(pkg.pricePerSlot)}/slot</Btn>
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { PackageDetailPage }
export { PackageDetail as PackageDetailPage };
