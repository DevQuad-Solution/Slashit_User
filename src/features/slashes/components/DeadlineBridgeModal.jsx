/**
 * DeadlineBridgeModal
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

export function DeadlineBridgeModal({ slash, onExtend, onDissolve, onClose }) {
  const [acting, setActing] = useState(null);
  const go = async (c) => {
    setActing(c); await delay(700);
    if (c === 'extend') onExtend(); else onDissolve();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⏰</div>
          <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>Deadline Reached!</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            <strong>{slash.name}</strong> expired with <strong>{slash.filledSlots}/{slash.totalSlots}</strong> slots filled. What would you like to do?
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'extend', icon: '⏳', title: 'Extend by 24 hours', sub: 'Keep it open — share with more friends. Same price guaranteed.' },
            { id: 'dissolve', icon: '💸', title: 'Dissolve & Refund All', sub: '100% refund for every member. No penalty on dissolution.' },
          ].map(opt => (
            <div key={opt.id} onClick={() => !acting && go(opt.id)}
              style={{ border: `2px solid ${acting === opt.id ? '#2563eb' : '#e2e8f0'}`, borderRadius: 12, padding: 14, cursor: 'pointer', background: acting === opt.id ? '#eff6ff' : '#fff', opacity: acting && acting !== opt.id ? .4 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{opt.icon} {opt.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
