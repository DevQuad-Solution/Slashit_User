/**
 * Privacy
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

export function Privacy() {
  const nav = useNavigate();
  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 24px' }}>
        <button onClick={() => nav(-1)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block', border:'none', cursor:'pointer' }}>←</button>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>Privacy Policy</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4 }}>Effective: January 1, 2026 · Designed with privacy in mind</div>
      </div>
      <div style={{ padding:'20px 20px 60px', maxWidth:640, margin:'0 auto' }}>
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:24, fontSize:12, color:'#78350f', lineHeight:1.6 }}>
          ⚠️ <strong>Early-access notice:</strong> SlashIt is in active development. Our data handling practices are designed with user privacy in mind and are being formalised as the platform grows. This policy reflects our current intentions and will be updated accordingly.
        </div>
        {[
          { title:'1. Data We Collect', body:'We collect: your full name, email address, phone number, campus and hostel information, and hub location preferences. For identity verification purposes, we collect your National Identification Number (NIN) and a selfie photograph. We also record transaction activity including wallet funding, slash participation, and payment history.' },
          { title:'2. Why We Collect It', body:'Your basic information is used to create and manage your account. Your NIN and selfie are collected as part of our member verification process to reduce fraud and protect the community. Your location data (hub/hostel) is used to show you relevant slashes and route deliveries. Transaction data supports refund processing and dispute resolution.' },
          { title:'3. Who We Share Your Data With', body:'Payment processing partners: basic account information may be shared with our payment infrastructure providers as integration is completed. Hub Attendants: your name and pickup QR code are visible to attendants at your selected hub for order fulfilment. We do not sell your data to advertisers or third parties for marketing purposes.' },
          { title:'4. Data Retention', body:'We aim to retain account data for the duration of your account and a reasonable period thereafter. KYC documents are retained for as long as necessary for verification and trust purposes. We are working to align our retention practices with applicable Nigerian data guidelines as our compliance process matures.' },
          { title:'5. Your Data Rights', body:'You have the right to access your personal data, correct inaccurate information, and request deletion of your account. To exercise these rights, contact privacy@slashit.ng. We will respond as promptly as our current capacity allows.' },
          { title:'6. Data Security', body:'Your data is stored in your browser\'s local storage and on our platform systems. We are designing SlashIt with security in mind and are working to implement appropriate access controls and data protection measures as the platform matures. No system is completely risk-free and we encourage users to keep their login details secure.' },
          { title:'7. Account Deletion', body:'You can request account deletion from Settings → Security → Request Account Deletion. Processing takes up to 30 days. Some data may need to be retained for a period after deletion for legitimate operational reasons.' },
          { title:'8. Cookies & Local Storage', body:'SlashIt uses browser localStorage to store your session and preferences. We do not use third-party tracking cookies.' },
          { title:'Contact', body:'Privacy questions: privacy@slashit.ng' },
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

// Re-export alias so App.jsx can import { PrivacyPage }
export { Privacy as PrivacyPage };
