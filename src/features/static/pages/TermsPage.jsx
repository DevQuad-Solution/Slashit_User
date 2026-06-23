/**
 * Terms
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

export function Terms() {
  const nav = useNavigate();
  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 24px' }}>
        <button onClick={() => nav(-1)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block', border:'none', cursor:'pointer' }}>←</button>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>Terms of Service</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4 }}>Effective: January 1, 2026 · SlashIt Group Buying Platform</div>
      </div>
      <div style={{ padding:'20px 20px 60px', maxWidth:640, margin:'0 auto' }}>
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:24, fontSize:12, color:'#78350f', lineHeight:1.6 }}>
          ⚠️ <strong>Please note:</strong> SlashIt is currently in an early-access phase. Some features described here are being actively developed. This document reflects our intended policies and will be updated as the platform matures.
        </div>
        {[
          { title:'1. What SlashIt Is', body:'SlashIt is a group buying coordination platform that allows students and campus community members to pool resources and collectively purchase goods at better prices. We facilitate group orders, coordinate deliveries to hub locations, and hold payments on behalf of group members until delivery is confirmed.' },
          { title:'2. Eligibility', body:'You must be 18 years or older to use SlashIt. By creating an account you confirm that you meet this requirement. SlashIt is currently designed for use within Nigerian university campuses and affiliated communities.' },
          { title:'3. Account & Identity Verification', body:'To create or join slashes, you are required to submit identity information including your National Identification Number (NIN) and a selfie photo. This is part of our member verification process, designed to reduce fraud and build trust within the community. Full verification infrastructure is being integrated with certified identity partners. Providing false information may result in account suspension.' },
          { title:'4. Wallet & Payments', body:'Funds added to your SlashIt wallet are held on your behalf and only released to suppliers after delivery is confirmed by a hub attendant. This escrow approach is designed with user protection in mind. Payment processing infrastructure is being implemented through supported provider channels. Wallet funds may only be used to join slashes or refunded under eligible conditions.' },
          { title:'5. Cancellation Policy', body:'If you cancel your slot in a slash before it fills, a cancellation penalty applies (currently 7% of your slot cost). The remaining balance is refunded to your wallet. No penalty applies if the slash is dissolved due to supplier or delivery failure. Exact timelines may vary during early access.' },
          { title:'6. Delivery & Hub Pickup', body:'Items are delivered to your selected hub location. You must collect your item within the designated pickup window. SlashIt is not liable for items uncollected after the pickup window closes. Hub attendants verify deliveries and confirm member collections.' },
          { title:'7. Prohibited Uses', body:'You may not use SlashIt to purchase prohibited goods or services. You may not create fraudulent slashes, manipulate other members, or misuse the platform in any way. Violations may result in permanent account suspension.' },
          { title:'8. Dispute Resolution', body:'If you experience a delivery issue, use the "Report an Issue" feature within the slash. Our team will review and respond as promptly as possible. For escalated concerns, contact us at support@slashit.ng.' },
          { title:'9. Limitation of Liability', body:'SlashIt is a coordination platform, not a retailer or logistics provider. Our liability in connection with any transaction is limited to the funds held on your behalf for that transaction. We are not liable for supplier delays, third-party failures, or circumstances outside our reasonable control.' },
          { title:'10. Changes to Terms', body:'We may update these Terms as the platform develops. Continued use after changes constitutes acceptance. Material changes will be communicated via in-app notification.' },
          { title:'11. Governing Law', body:'These Terms are intended to be governed by the laws of the Federal Republic of Nigeria. As a growing platform, formal legal arrangements are being put in place.' },
          { title:'Contact', body:'Questions about these Terms? Email: legal@slashit.ng · Support: support@slashit.ng' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:8 }}>{s.title}</div>
            <div style={{ fontSize:13, color:'#475569', lineHeight:1.8 }}>{s.body}</div>
          </div>
        ))}
        <LegalFooter />
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { TermsPage }
export { Terms as TermsPage };
