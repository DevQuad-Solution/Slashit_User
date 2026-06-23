/**
 * RefundPolicy
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

export function RefundPolicy() {
  const nav = useNavigate();
  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 24px' }}>
        <button onClick={() => nav(-1)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block', border:'none', cursor:'pointer' }}>←</button>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>Refund & Cancellation Policy</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', marginTop:4 }}>Your money is protected · Last updated January 2026</div>
      </div>
      <div style={{ padding:'20px 20px 60px', maxWidth:640, margin:'0 auto' }}>
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:24, fontSize:12, color:'#78350f', lineHeight:1.6 }}>
          ⚠️ <strong>Early-access notice:</strong> SlashIt is in active development. Refund timelines and processes described here reflect our intended policy. Exact timelines may vary during this phase.
        </div>
        {[
          { icon:'↩️', title:'Cancelling Your Slot', body:'If you cancel your slot in an open slash before it fills, a cancellation penalty (currently 7% of your slot payment) applies. The remaining balance is refunded to your SlashIt wallet. This penalty exists because your cancellation may prevent the slash from filling and impact other members.' },
          { icon:'✅', title:'When No Penalty Applies', body:'No cancellation penalty applies if: the slash was dissolved by SlashIt (e.g. supplier issue), the supplier could not fulfil the order, a verified delivery failure occurred, or the slash expired without filling. In these cases, your payment is refunded to your wallet.' },
          { icon:'📦', title:'Delivery Failure Refunds', body:'If a delivery is confirmed as failed by the hub attendant, affected members receive a refund to their SlashIt wallet. SlashIt\'s payment approach is designed to hold funds until delivery is confirmed before releasing to suppliers.' },
          { icon:'⚠️', title:'Partial & Short Deliveries', body:'If a delivery is short (fewer items than ordered), affected members may receive a proportional refund. Disputed deliveries are reviewed on a case-by-case basis. Use "Report an Issue" inside the slash to trigger a review.' },
          { icon:'💰', title:'Refund Processing', body:'Approved refunds are credited to your SlashIt wallet as promptly as possible. Wallet funds can be used toward future slashes. For questions about a specific refund, contact support@slashit.ng.' },
          { icon:'🔄', title:'Dissolved Slashes', body:'If a slash is dissolved (e.g. deadline passed without filling, or admin dissolves due to supply issues), members receive a refund with no deductions. You will be notified via in-app message.' },
          { icon:'📋', title:'Dispute Process', body:'Step 1: Use "Report an Issue" inside the slash within 48 hours of the pickup window. Step 2: Our team reviews and contacts you. Step 3: If unresolved, escalate to support@slashit.ng with your transaction reference. Step 4: A determination is made as promptly as possible.' },
        ].map(s => (
          <div key={s.title} style={{ background:'#fff', borderRadius:14, padding:16, marginBottom:14, border:'1px solid #f1f5f9', boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'#475569', lineHeight:1.8 }}>{s.body}</div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, padding:16, marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', marginBottom:6 }}>🔒 Payment Protection Approach</div>
          <div style={{ fontSize:12, color:'#2563eb', lineHeight:1.6 }}>SlashIt is designed so that funds are held until delivery is confirmed before being released to suppliers. Payment infrastructure is being implemented through supported provider channels. If anything goes wrong with an order, our team will work to resolve it fairly.</div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { RefundPolicyPage }
export { RefundPolicy as RefundPolicyPage };
