/**
 * Messages
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

export function Messages() {
  const nav = useNavigate();
  const user = storage.load('session', null);
  const userId = user?.id || 'user-001';
  const [msgs, setMsgs] = useState(() => msgStorage.load(userId));

  useEffect(() => {
    const iv = setInterval(() => setMsgs(msgStorage.load(userId)), 3000);
    return () => clearInterval(iv);
  }, [userId]);

  const markRead = (id) => {
    msgStorage.markRead(userId, id);
    setMsgs(msgStorage.load(userId));
  };
  const markAll = () => {
    msgStorage.markAllRead(userId);
    setMsgs(msgStorage.load(userId));
  };

  const typeIcon   = { slash_full:'⚡', pickup_ready:'📦', completed:'🎉', dissolved:'↩️', expired:'⏰', price_jump:'💰', deadline_bridge:'⏰', chat_reply:'💬' };
  const typeBg     = { slash_full:'#eff6ff', pickup_ready:'#f0fdf4', completed:'#fdf4ff', dissolved:'#fff7ed', expired:'#fef2f2', price_jump:'#fefce8', deadline_bridge:'#fef3c7', chat_reply:'#f0fdf4' };
  const typeBorder = { slash_full:'#bfdbfe', pickup_ready:'#bbf7d0', completed:'#e9d5ff', dissolved:'#fed7aa', expired:'#fecaca', price_jump:'#fde68a', deadline_bridge:'#fcd34d', chat_reply:'#86efac' };

  const unread = msgs.filter(m => !m.isRead).length;

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 20px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 8, display: 'block' }}>←</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Messages</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Slash updates & notifications</div>
          </div>
          {unread > 0 && (
            <button onClick={markAll} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
              Mark all read
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, color: '#475569', fontSize: 14 }}>No messages yet</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Slash updates and pickup notifications will appear here</div>
          </div>
        ) : (
          msgs.map(m => (
            <div key={m.id} onClick={() => markRead(m.id)}
              style={{ background: typeBg[m.type] || '#fff', border: `1.5px solid ${m.isRead ? '#e2e8f0' : (typeBorder[m.type] || '#bfdbfe')}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', opacity: m.isRead ? 0.8 : 1, position: 'relative' }}>
              {!m.isRead && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, background: '#2563eb', borderRadius: '50%' }} />}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon[m.type] || '📩'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>{m.slashName || 'SlashIt Update'}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{m.text}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                    {m.sentAt ? new Date(m.sentAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    {m.hubName && <span style={{ marginLeft: 6 }}>· {m.hubName}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ height: 72 }} />
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { MessagesPage }
export { Messages as MessagesPage };
