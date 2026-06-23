/**
 * LegalFooter
 * Extracted from App.jsx. Uses useSession() instead of currentUser module variable.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { api, setToken, getToken, clearToken } from '../../api';
import { storage, getFlags, getPlatformConfig, getAdminProducts, getAdminPackages,
         getAdminPlans, getAdminHubs, getLeaderboardConfig, getAdminHostels,
         pollStorage, chatStorage, msgStorage, pushBrowserNotif } from '../../storage';
import { fmt, delay, fromNow, timeUntil, PLANS, CATEGORIES, BANTER_MESSAGES,
         FOOD_PACKAGES, MOCK_SLASHES, MOCK_PRODUCTS, MOCK_TRANSACTIONS,
         MOCK_NOTIFICATIONS, MOCK_LEADERBOARD, LEADERBOARD_CONFIG, HOSTELS } from '../../data';
import { mapUser, extractUser, normalizePhone } from '../../utils/session';
import { useSession } from '../../hooks/useSession';
import { useAuth } from '../../context/AuthContext';
import { Btn, Card, Input, Badge, FillBar, Modal } from '../../components/ui';

export function LegalFooter() {
  const nav = useNavigate();
  return (
    <div style={{ padding:'16px 20px 8px', textAlign:'center', borderTop:'1px solid #f1f5f9' }}>
      <div style={{ display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap', marginBottom:8 }}>
        {[['Terms of Service','/terms'],['Privacy Policy','/privacy'],['Refund Policy','/refund-policy'],['Help & FAQ','/faq']].map(([label, path]) => (
          <button key={label} onClick={()=>nav(path)} style={{ fontSize:11, color:'#2563eb', fontWeight:600, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>{label}</button>
        ))}
      </div>
      <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>
        SlashIt Group Buying Platform · Payments processed through supported provider infrastructure · Escrow-protected<br/>
        © 2026 SlashIt · All group funds held in escrow until delivery is verified
      </div>
    </div>
  );
}
