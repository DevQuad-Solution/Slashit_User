/**
 * Subscription
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

export function Subscription() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [upgrading, setUpgrading] = useState(null);
  const allPlans = getAdminPlans();
  const activePlans = allPlans.filter(p => p.isEnabled);
  const upgrade = async planId => {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan || plan.price === 0) return;
    if ((user.walletBalance || 0) < plan.price) { toast.error('Insufficient balance.'); return; }
    setUpgrading(planId); await delay(900);
    const updated = { ...user, plan: planId, walletBalance: user.walletBalance - plan.price };
    updateSession(updated);
    // Sync plan change to admin users table
    try {
      const adminUsers = JSON.parse(localStorage.getItem('slashit_admin_users') || '[]');
      const synced = adminUsers.map(u => (u.id === updated.id || u.email === updated.email) ? {...u, plan: planId} : u);
      localStorage.setItem('slashit_admin_users', JSON.stringify(synced));
    } catch(e) {}
    toast.success(`Upgraded to ${plan.name}! 🎉`); setUpgrading(null);
  };
  const accents = { free: { border: '#e2e8f0', header: '#f8fafc', color: '#64748b' }, student: { border: '#bfdbfe', header: '#eff6ff', color: '#1d4ed8' }, premium: { border: '#fde68a', header: '#fef9c3', color: '#d97706' } };
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Student Plans 🎓</div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activePlans.map(plan => {
          const isCurrent = user.plan === plan.id;
          const acc = accents[plan.id] || accents.free;
          return (
            <Card key={plan.id} style={{ border: `2px solid ${isCurrent ? acc.border : '#e2e8f0'}`, overflow: 'hidden' }}>
              <div style={{ background: isCurrent ? acc.header : '#f8fafc', padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>{plan.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: isCurrent ? acc.color : '#1e293b' }}>{plan.name}</div>
                    {isCurrent && <Badge label="CURRENT" bg={acc.header} color={acc.color} />}
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, color: isCurrent ? acc.color : '#1e293b' }}>
                  {plan.price === 0 ? 'Free' : fmt(plan.price)}
                  {plan.price > 0 && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>/mo</span>}
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {plan.features.map(f => (
                  <div key={f.label} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', fontSize: 12, color: f.ok ? '#1e293b' : '#cbd5e1' }}>
                    <span style={{ color: f.ok ? '#16a34a' : '#e2e8f0', fontWeight: 700 }}>{f.ok ? '✓' : '✗'}</span>
                    {f.label}
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  {isCurrent
                    ? <div style={{ textAlign: 'center', padding: '10px', background: '#f1f5f9', borderRadius: 10, fontSize: 12, color: '#64748b', fontWeight: 600 }}>Your current plan</div>
                    : plan.id !== 'free'
                      ? <Btn full loading={upgrading === plan.id} onClick={() => upgrade(plan.id)} style={plan.id === 'premium' ? { background: 'linear-gradient(135deg,#d97706,#f59e0b)' } : {}}>Upgrade to {plan.name} — {fmt(plan.price)}/mo</Btn>
                      : <Btn full variant="secondary" onClick={() => upgrade(plan.id)}>Downgrade to Basic</Btn>
                  }
                </div>
              </div>
            </Card>
          );
        })}
        <div style={{ padding: '12px 4px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Charged from wallet monthly. Cancel anytime.</div>
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { SubscriptionPage }
export { Subscription as SubscriptionPage };
