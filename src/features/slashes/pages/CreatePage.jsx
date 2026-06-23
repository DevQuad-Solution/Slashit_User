/**
 * Create
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
import { CreateSlashModal } from '../components/CreateSlashModal';

export function Create() {
  const nav = useNavigate();
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const allPlans = getAdminPlans();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.products.getAll();
        const list = res.data?.products || res.data || [];
        setProducts(Array.isArray(list) && list.length > 0 ? list.map(p => ({
          ...p, id: p._id||p.id,
          emoji: p.emoji || '📦',
          defaultPrice: p.pricePerSlot || p.defaultPrice || p.price || 0,
          defaultSlots: p.noOfSlots || p.defaultSlots || 4,
        })) : []);
      } catch(e) {
        // Retry once after 3s if rate limited
        if (e.message?.includes('429') || e.message?.includes('Too many')) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const res2 = await api.products.getAll();
            const list2 = res2.data?.products || res2.data || [];
            setProducts(Array.isArray(list2) ? list2.map(p => ({
              ...p, id: p._id||p.id,
              emoji: p.emoji || '📦',
              defaultPrice: p.pricePerSlot || 0,
              defaultSlots: p.noOfSlots || 4,
            })) : []);
          } catch(e2) { setProducts([]); }
        } else {
          setProducts([]);
        }
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
    const refresh = () => setUser(storage.load('session', {}));
    const iv = setInterval(refresh, 2000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(iv); window.removeEventListener('focus', refresh); };
  }, []);

  const resolvePrice = (p) => (p.prices && user.state && p.prices[user.state] !== undefined)
    ? p.prices[user.state] : (p.defaultPrice || p.pricePerSlot || 0);

  const isKycVerified = (user?.kycStatus || 'unverified') === 'verified';
  const activePlan = allPlans.find(p => p.id === (user?.plan || 'free'));
  const slashLimit = activePlan?.slashLimit ?? 999;
  const atLimit = false; // Will be enforced by backend

  const handleCreated = () => {
    setSelectedProduct(null); nav('/slashes');
  };

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Create a Slash</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Start a group buy and save together</div>
        {user.hubName && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>🏪</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.hubName}</span>
              {user.state && (
                <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>· {user.state} pricing</span>
              )}
            </div>

          </div>
        )}
      </div>
      {!isKycVerified && (() => {
        const isPending = user?.kycStatus === 'pending';
        return (
          <div style={{ margin: 16, background: isPending ? '#eff6ff' : '#fef3c7', border: `1px solid ${isPending ? '#bfdbfe' : '#fbbf24'}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>{isPending ? '⏳' : '🔐'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: isPending ? '#1d4ed8' : '#92400e', fontSize: 13 }}>
                {isPending ? 'KYC Under Review' : 'Identity Verification Required'}
              </div>
              <div style={{ fontSize: 11, color: isPending ? '#2563eb' : '#92400e', marginTop: 2 }}>
                {isPending ? 'Admin is reviewing your identity. You can create slashes once approved.' : 'Complete KYC to create a slash.'}
              </div>
            </div>
            <button onClick={() => nav('/kyc')} style={{ background: isPending ? '#2563eb' : '#d97706', color: '#fff', fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12 }}>
              {isPending ? 'Check Status' : 'Verify Now'}
            </button>
          </div>
        );
      })()}
      {isKycVerified && atLimit && (
        <div style={{ margin: 16, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Slash Limit Reached ({activeSlashCount}/{slashLimit})</div>
            <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2 }}>Upgrade your plan to create more slashes simultaneously.</div>
          </div>
          <button onClick={() => nav('/subscription')} style={{ background: '#dc2626', color: '#fff', fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 12 }}>Upgrade</button>
        </div>
      )}
      <div style={{ padding: 16, opacity: (!isKycVerified || atLimit) ? 0.4 : 1, pointerEvents: (!isKycVerified || atLimit) ? 'none' : 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Select Product</div>
        {loadingProducts ? (
          <div style={{ textAlign:'center', padding:32 }}>
            <div className="spin" style={{ width:28, height:28, border:'3px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', margin:'0 auto' }}/>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.filter(p => p.status !== 'Inactive' && p.status !== 'inactive').map(p => (
              <div key={p._id||p.id} onClick={() => setSelectedProduct(p)}
                style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 14, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(resolvePrice(p))}</span>/slot · {p.defaultSlots||p.noOfSlots||4} slots · {p.category}
                    {p.prices && user.state && p.prices[user.state] !== undefined && (
                      <span style={{ marginLeft: 6, background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{user.state} price</span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#2563eb', fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedProduct && (
        <CreateSlashModal product={selectedProduct} user={user} onClose={() => setSelectedProduct(null)} onCreated={handleCreated} />
      )}
    </div>
  );
}

// Re-export alias so App.jsx can import { CreatePage }
export { Create as CreatePage };
