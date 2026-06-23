/**
 * PriceJumpPoll
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

export function PriceJumpPoll({ slash, onAccept, onDissolve, onClose }) {
  const [voting, setVoting] = useState(null);
  const newPrice = Math.round(slash.pricePerSlot * 1.12);
  const extra = newPrice - slash.pricePerSlot;
  const vote = async (choice) => {
    setVoting(choice); await delay(700);
    if (choice === 'accept') onAccept(newPrice); else onDissolve();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>Price Jump Alert</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            The wholesale price for <strong>{slash.name}</strong> has increased. All members must vote.
          </div>
        </div>
        <div style={{ background: '#fef9c3', border: '1.5px solid #fde68a', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          {[['Original price/slot', fmt(slash.pricePerSlot)], ['New price/slot', fmt(newPrice)], ['Extra per member', `+${fmt(extra)}`]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
              <span style={{ color: '#78350f' }}>{l}</span>
              <span style={{ fontWeight: 700, color: l.includes('Extra') ? '#dc2626' : '#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>If majority reject → slash dissolves with 100% refund to all members.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" loading={voting === 'dissolve'} onClick={() => vote('dissolve')} full>💸 Dissolve & Refund</Btn>
          <Btn variant="primary" loading={voting === 'accept'} onClick={() => vote('accept')} full>✅ Accept New Price</Btn>
        </div>
      </div>
    </div>
  );
}
