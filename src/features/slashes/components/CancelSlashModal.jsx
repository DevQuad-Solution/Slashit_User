/**
 * CancelSlashModal
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

export function CancelSlashModal({ slash, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const cfg = getPlatformConfig();
  const penaltyPct = (cfg.cancellationPenaltyPct || 7) / 100;
  const penalty = Math.round(slash.pricePerSlot * penaltyPct);
  const refund = slash.pricePerSlot - penalty;
  const go = async () => {
    setLoading(true); await delay(800); onConfirm(penalty, refund); setLoading(false);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Cancel this Slash?</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            Cancelling after joining incurs a <strong style={{ color: '#dc2626' }}>{cfg.cancellationPenaltyPct||7}% cancellation fee</strong> per SlashIt policy.
          </div>
        </div>
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          {[['Slot cost paid', fmt(slash.pricePerSlot), '#1e293b'], [`${cfg.cancellationPenaltyPct||7}% cancellation fee`, `−${fmt(penalty)}`, '#dc2626'], ['Refund to wallet', fmt(refund), '#16a34a']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fee2e2', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>{l}</span>
              <span style={{ fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={onClose} full>Keep Slash</Btn>
          <Btn variant="danger" loading={loading} onClick={go} full>Confirm Cancel</Btn>
        </div>
      </div>
    </div>
  );
}
