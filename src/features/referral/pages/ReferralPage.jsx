/**
 * Referral
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

export function Referral() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [user, setUserR] = useState(() => storage.load('session', {}));
  const [copied, setCopied] = useState(false);
  // Refresh from /auth/me to get latest referral count and earnings
  useEffect(() => {
    api.auth.me().then(res => {
      const me = res?.data?.user || res?.data;
      if (me && (me._id || me.id)) {
        const updated = { ...user, ...me, id: me._id||me.id };
        updateSession(updated);
      }
    }).catch(()=>{});
  }, []);
  // Read live referral config from admin (studentBonus, premiumBonus, referrerBonus)
  const referralCfg = (() => {
    try { const r = localStorage.getItem('slashit_admin_referrals'); return r ? JSON.parse(r) : null; } catch(e) { return null; }
  })();
  const studentBonus = referralCfg?.studentBonus ?? 500;
  const premiumBonus = referralCfg?.premiumBonus ?? 1000;
  const referrerBonus = referralCfg?.referrerBonus ?? 200;
  const copyCode = () => {
    if (!user.referralCode) { toast.error('Referral code not available yet'); return; }
    navigator.clipboard?.writeText(user.referralCode).catch(() => {});
    setCopied(true); toast.success('Referral code copied!'); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 28px', textAlign: 'center' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, display: 'block', marginBottom: 8, textAlign: 'left' }}>←</button>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎁</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Invite & Earn</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4, lineHeight: 1.5 }}>Earn {fmt(studentBonus)} (Student) or {fmt(premiumBonus)} (Premium) for every friend who joins and subscribes</div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#2563eb' }}>{user.referralCount || 0}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Friends Referred</div>
          </Card>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>{fmt(user.referralEarnings || 0)}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Total Earned</div>
          </Card>
        </div>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Your Referral Code</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#eff6ff', borderRadius: 12, padding: '14px 16px', textAlign: 'center', fontSize: 22, fontWeight: 900, color: '#1d4ed8', letterSpacing: 2, border: '2px dashed #bfdbfe' }}>{user.referralCode || '—'}</div>
            <button onClick={copyCode} style={{ padding: '14px 16px', background: copied ? '#16a34a' : '#2563eb', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </Card>
        <Btn full onClick={() => toast.success('Link shared!')}>Share Referral Link</Btn>
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { ReferralPage }
export { Referral as ReferralPage };
