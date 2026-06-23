/**
 * AllPackages
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

export function AllPackages() {
  const nav = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.products.getAll().then(res => {
      const list = res.data || [];
      setPackages(Array.isArray(list) ? list.filter(p=>p.status!=='Inactive').map(p=>({
        id:p._id||p.id, name:p.name, emoji:p.emoji||'📦', description:p.description||'',
        pricePerSlot:p.pricePerSlot||Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        defaultPrice:p.pricePerSlot||Math.round((p.totalValue||0)/(p.noOfSlots||1)),
        defaultSlots:p.noOfSlots||4, totalValue:p.totalValue||0, category:p.category||'',
      })) : []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Special Packages 🍱</div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {packages.length === 0
          ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}><div style={{ fontSize: 40, marginBottom: 12 }}>🍱</div><div style={{ fontWeight: 600 }}>No packages available right now</div></div>
          : packages.map(pkg => (
            <Card key={pkg.id} onClick={() => nav(`/package/${pkg.id}`)} style={{ overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ background: pkg.themeColor, padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, fontSize: 80, opacity: .15, lineHeight: 1 }}>{pkg.emoji}</div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{pkg.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{pkg.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>{pkg.description}</div>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><span style={{ fontSize: 15, fontWeight: 900, color: '#2563eb' }}>{fmt(pkg.pricePerSlot)}</span><span style={{ fontSize: 11, color: '#94a3b8' }}>/slot</span></div>
                <Badge label={`${pkg.defaultSlots} slots`} bg="#eff6ff" color="#1d4ed8" />
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { AllPackagesPage }
export { AllPackages as AllPackagesPage };
