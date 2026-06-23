/**
 * JoinConfirmModal
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

export function JoinConfirmModal({ slash, joinTotal, joinFee, joinTransportFee, joinInsurance, walletBalance, cfg, F, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:24, width:'100%', maxWidth:480, paddingBottom:40 }}>
        <div style={{ width:40, height:4, borderRadius:2, background:'#e2e8f0', margin:'0 auto 20px' }}/>
        <div style={{ fontSize:18, fontWeight:900, color:'#1e293b', marginBottom:4 }}>⚡ Confirm Join</div>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>Review your charge before money leaves your wallet</div>
        <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12 }}>Charge Breakdown</div>
          {[
            [`Slot — ${slash.name}`, fmt(slash.pricePerSlot || 0)],
            ['Processing fee', fmt(joinFee)],
            ...(joinTransportFee > 0 ? [['🚚 Transport fee', fmt(joinTransportFee)]] : []),
            ...(F.insurance && joinInsurance > 0 ? [[`${cfg.insuranceRate||1}% Insurance pool`, fmt(joinInsurance)]] : []),
          ].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid #f1f5f9' }}>
              <span style={{ color:'#64748b' }}>{l}</span>
              <span style={{ fontWeight:700, color:'#1e293b' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, paddingTop:10, marginTop:6, borderTop:'2px solid #e2e8f0' }}>
            <span style={{ fontWeight:800, color:'#0f172a' }}>Total charged now</span>
            <span style={{ fontWeight:900, color:'#2563eb' }}>{fmt(joinTotal)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:8 }}>
            <span style={{ color:'#64748b' }}>Wallet after</span>
            <span style={{ fontWeight:700, color:'#16a34a' }}>{fmt(walletBalance - joinTotal)}</span>
          </div>
        </div>
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', fontSize:11, color:'#1d4ed8', marginBottom:20, lineHeight:1.5 }}>
          🔒 Funds are held in escrow and only released after delivery is verified by your hub attendant.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#64748b', fontWeight:700, fontSize:14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:2, padding:'13px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', fontWeight:800, fontSize:14 }}>Confirm & Pay {fmt(joinTotal)}</button>
        </div>
      </div>
    </div>
  );
}
