/**
 * CreateSlashModal
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

export function CreateSlashModal({ product, user, onClose, onCreated }) {
  const [timeLimit, setTimeLimit] = useState('24h');
  const [creating, setCreating] = useState(false);
  const cfg = getPlatformConfig();
  const F = getFlags();
  const hoursMap = { '12h': 12, '24h': 24, '48h': 48, '72h': 72 };
  // Only show time options within admin maxSlashDurationHours limit
  const TIME_OPTS = ['12h', '24h', '48h', '72h'].filter(t => hoursMap[t] <= (cfg.maxSlashDurationHours || 72));
  const expiresAt = new Date(Date.now() + hoursMap[timeLimit] * 3600000);
  const processingFee = cfg.processingFee || 100;
  const insuranceRate = (cfg.insuranceRate || 1) / 100;
  // ── Resolve state-specific price ──────────────────────────────────────────
  const userState = user?.state || '';
  const resolvedPrice = (product.prices && userState && product.prices[userState] !== undefined)
    ? product.prices[userState]
    : (product.defaultPrice || product.pricePerSlot);
  const statePriceNote = (product.prices && userState && product.prices[userState] !== undefined)
    ? `${userState} price`
    : 'base price';
  // ── Resolve transport fee — product→hub specific, then hub default, then ₦0 ─
  const transportEnabled = F.transportation !== false;
  const hubTransportFee = (() => {
    if (!transportEnabled) return 0;
    try {
      const hubs = JSON.parse(localStorage.getItem('slashit_admin_hubs') || '[]');
      const hub = hubs.find(h => h.id === user?.hubId);
      const prods = JSON.parse(localStorage.getItem('slashit_admin_products') || '[]');
      const prod = prods.find(p => p.id === product.id);
      // 1. Product-specific transport for this hub
      if (prod?.transport && prod.transport[user?.hubId] !== undefined) {
        return Math.round(Number(prod.transport[user?.hubId]) / (product.defaultSlots || 1));
      }
      // 2. Hub default transport cost
      if (hub) {
        const hubDefault = hub.defaultTransportCost || hub.transportFee || 0;
        return Math.round(Number(hubDefault) / (product.defaultSlots || 1));
      }
      // 3. Platform default
      return Math.round((Number(cfg.defaultTransportFee) || 0) / (product.defaultSlots || 1));
    } catch(e) { return 0; }
  })();
  const transportFee = hubTransportFee;
  // ─────────────────────────────────────────────────────────────────────────
  const insurance = F.insurance ? Math.round(resolvedPrice * insuranceRate) : 0;
  const totalCharge = resolvedPrice + processingFee + transportFee + insurance;
  const canAfford = (user?.walletBalance || 0) >= totalCharge;

  const create = async () => {
    if (!canAfford) { toast.error('Insufficient balance. Fund your wallet first.'); return; }
    setCreating(true);
    try {
      const res = await api.slashes.create(product.id, timeLimit, user.hubId);
      const newSlash = res.data || res.slash || res;
      toast.success('Slash created! Share it to fill the slots.');
      onCreated(newSlash);
    } catch(err) {
      toast.error(err.message || 'Could not create slash');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430, maxHeight: '95vh', overflowY: 'auto', paddingBottom: 32 }}
        onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#1e293b' }}>Create a Slash</div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#64748b' }}>✕</button>
          </div>

          {/* Product image area */}
          <div style={{ background: '#f8fafc', borderRadius: 16, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '2px dashed #e2e8f0', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 44 }}>{product.emoji}</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Product image</span>
          </div>

          {/* What are you slashing — read only */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>What are you slashing?</div>
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{product.name}</div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Description</div>
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{product.description || 'Premium wholesale product split equally between all members.'}</div>
          </div>

          {/* Price & slots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['Price per slot', fmt(resolvedPrice), '#2563eb'], ['Total slots', product.defaultSlots, '#1e293b']].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{l}</div>
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Time limit */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Time Limit (hours)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIME_OPTS.map(t => (
                <button key={t} onClick={() => setTimeLimit(t)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `2px solid ${timeLimit === t ? '#2563eb' : '#e2e8f0'}`, background: timeLimit === t ? '#eff6ff' : '#fff', color: timeLimit === t ? '#2563eb' : '#64748b' }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
              ⏰ Ends: {expiresAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}, {expiresAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Hub — auto-filled, read only */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏪</span>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 1 }}>This slash will be tied to your primary hub</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{user?.hubName || 'Bodija Hub'} — {user?.city || 'Ibadan'}</div>
            </div>
          </div>

          {/* Cost summary */}
          <div style={{ background: canAfford ? '#eff6ff' : '#fef2f2', border: `1.5px solid ${canAfford ? '#bfdbfe' : '#fecaca'}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Charge Summary</div>
            {[
              ['Slot payment (1 of ' + product.defaultSlots + ') — ' + statePriceNote, fmt(resolvedPrice)],
              [`Processing fee`, fmt(processingFee)],
              ...(transportFee > 0 ? [['🚚 Transport fee — ' + (user?.hubName||'hub'), fmt(transportFee)]] : []),
              ...(F.insurance && insurance > 0 ? [[`${cfg.insuranceRate||1}% Insurance pool`, fmt(insurance)]] : []),
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                <span style={{ color: '#64748b' }}>{l}</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 8, marginTop: 4, borderTop: '1.5px solid rgba(0,0,0,.08)' }}>
              <span style={{ fontWeight: 800 }}>Total charged now</span>
              <span style={{ fontWeight: 900, color: '#2563eb' }}>{fmt(totalCharge)}</span>
            </div>
            <div style={{ fontSize: 11, color: canAfford ? '#1d4ed8' : '#dc2626', marginTop: 6, fontWeight: 600 }}>
              {canAfford ? `💰 Wallet after: ${fmt((user?.walletBalance || 0) - totalCharge)}` : `⚠️ Need ${fmt(totalCharge - (user?.walletBalance || 0))} more`}
            </div>
          </div>

          <div style={{ background: '#eff6ff', borderRadius: 10, padding: 10, marginBottom: 16, fontSize: 11, color: '#1d4ed8', lineHeight: 1.5 }}>
            🔒 Payment held in escrow. Released to supplier only after hub attendant verifies delivery.
          </div>

          <Btn full loading={creating} onClick={create} disabled={!canAfford}
            style={{ fontSize: 15, padding: '14px', borderRadius: 14 }}>
            {canAfford ? '✅ Confirm & Create Slash' : '💳 Insufficient Balance — Fund Wallet'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
