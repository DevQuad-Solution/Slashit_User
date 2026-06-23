/**
 * SlashCard
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

export function SlashCard({ slash, onClick }) {
  const statusColor = { open: '#16a34a', full: '#2563eb', purchasing: '#d97706', awaiting_payment: '#d97706', payment_sent: '#7c3aed', ready_for_pickup: '#7c3aed', completed: '#64748b', dissolved: '#dc2626' };
  const isUrgent = slash.filledSlots >= slash.totalSlots - 1;
  return (
    <div onClick={onClick} className="active-scale" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,.06)', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{slash.emoji}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', lineHeight: 1.2 }}>{slash.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{slash.hubName} · {slash.city}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, color: '#1d4ed8', fontSize: 15 }}>{fmt(slash.pricePerSlot)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>per slot</div>
          </div>
        </div>
        <FillBar filled={slash.filledSlots} total={slash.totalSlots} color={statusColor[slash.status] || '#2563eb'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>{slash.filledSlots}/{slash.totalSlots} slots filled</span>
          {isUrgent && slash.status === 'open' && <span className="pulse" style={{ fontSize: 10, fontWeight: 700, color: '#dc2626' }}>Almost full!</span>}
          {slash.status !== 'open' && <Badge label={(slash?.status || '').replace(/_/g, ' ')} bg='#f1f5f9' color={statusColor[slash.status] || '#64748b'} />}
        </div>
      </div>
    </div>
  );
}
