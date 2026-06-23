/**
 * SlashFeedCard
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

export function SlashFeedCard({ slash, onClick, onCancel }) {
  const remaining = slash.totalSlots - slash.filledSlots;
  const isUrgent = remaining <= 1 && slash.status === 'open';
  const hasPoll = slash.pollType === 'PRICE_JUMP' || slash.pollType === 'DEADLINE_BRIDGE';
  const statusColors = { open:'#16a34a', full:'#2563eb', awaiting_payment:'#d97706', payment_sent:'#7c3aed', ready_for_pickup:'#7c3aed', completed:'#64748b', dissolved:'#dc2626', POLL_ACTIVE:'#f59e0b' };
  const sc = statusColors[slash.status] || '#64748b';
  const pct = slash.totalSlots > 0 ? Math.round(slash.filledSlots/slash.totalSlots*100) : 0;

  return (
    <div onClick={onClick} style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 8px rgba(0,0,0,.07)', overflow:'hidden', border:'1px solid #f0f4ff', cursor:'pointer' }}>
      <div style={{ padding:'14px 14px 10px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
          {/* Product emoji tile */}
          <div style={{ width:56, height:56, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, border:'1.5px solid #dbeafe' }}>
            {slash.emoji}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#1e293b', lineHeight:1.25, flex:1 }}>{slash.name}</div>
              <div style={{ fontWeight:900, fontSize:16, color:'#1d4ed8', flexShrink:0 }}>{fmt(slash.pricePerSlot)}</div>
            </div>
            {/* Hub + Location breadcrumb — ALWAYS VISIBLE */}
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, flexWrap:'wrap' }}>
              <span style={{ fontSize:11 }}>📍</span>
              <span style={{ fontSize:11, color:'#64748b', fontFamily:'monospace', fontWeight:500 }}>{slash.state||'Oyo'} › {slash.city||'Ibadan'}</span>
              <span style={{ fontSize:10, color:'#cbd5e1' }}>·</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#475569' }}>{slash.hubName}</span>
            </div>
            {/* Poll badge */}
            {hasPoll && (
              <div style={{ marginTop:4, display:'inline-flex', alignItems:'center', gap:4, background:'#fef9c3', border:'1px solid #fde68a', borderRadius:20, padding:'2px 9px' }}>
                <span style={{ fontSize:10 }}>📊</span>
                <span style={{ fontSize:10, fontWeight:700, color:'#92400e' }}>Poll Active — Vote Now</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:5, background:'#e2e8f0', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', width:pct+'%', background: isUrgent?'#dc2626':sc, borderRadius:99, transition:'width .3s' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#64748b' }}>{slash.filledSlots}/{slash.totalSlots} slots · {pct}%</span>
          <span style={{ fontSize:10, color: isUrgent?'#dc2626':'#94a3b8', fontWeight: isUrgent?700:400 }}>
            {isUrgent ? '🔥 Almost full!' : `${sc===statusColors.ready_for_pickup?'📦 Ready':'⏱ '+fromNow(slash.createdAt)}`}
          </span>
        </div>
      </div>

      {/* Action footer */}
      <div style={{ borderTop:'1px solid #f8fafc', padding:'10px 14px', display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:11, color:'#94a3b8', flex:1 }}>
          {slash.leaderName ? `👑 ${slash.leaderName}` : ''}{slash.leaderName && timeUntil ? ' · ' : ''}{timeUntil ? timeUntil(slash.expiresAt) : ''}
        </span>
        {/* actions based on state */}
        {hasPoll && slash.isMine && (
          <button onClick={e=>{e.stopPropagation();onClick&&onClick();}}
            style={{ padding:'7px 12px', background:'#fef9c3', color:'#92400e', borderRadius:10, fontSize:11, fontWeight:700, border:'1px solid #fde68a' }}>
            📊 Vote
          </button>
        )}
        {!hasPoll && slash.status==='open' && !slash.isMine && (
          <button onClick={e=>{e.stopPropagation();onClick&&onClick();}}
            style={{ padding:'7px 14px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', borderRadius:10, fontSize:12, fontWeight:700 }}>
            Join →
          </button>
        )}
        {!hasPoll && slash.isMine && slash.status==='open' && onCancel && (
          <button onClick={e=>{e.stopPropagation();onCancel();}}
            style={{ padding:'7px 12px', background:'#fef2f2', color:'#dc2626', borderRadius:10, fontSize:11, fontWeight:700, border:'1.5px solid #fecaca' }}>
            Cancel
          </button>
        )}
        {slash.isMine && slash.status==='ready_for_pickup' && (
          <button onClick={e=>{e.stopPropagation();onClick&&onClick();}}
            style={{ padding:'7px 12px', background:'#f0fdf4', color:'#15803d', borderRadius:10, fontSize:11, fontWeight:700, border:'1px solid #bbf7d0' }}>
            📦 QR Code
          </button>
        )}
        {slash.isMine && !['open','ready_for_pickup'].includes(slash.status) && (
          <div style={{ padding:'7px 12px', background:'#eff6ff', borderRadius:10, fontSize:11, fontWeight:700, color:'#1d4ed8' }}>
            {slash.isLeader?'👑 Leader':'✓ Joined'}
          </div>
        )}
      </div>
    </div>
  );
}
