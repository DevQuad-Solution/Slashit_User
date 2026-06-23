/**
 * FAQ
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

export function FAQ() {
  const nav = useNavigate();
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = i => setOpenIdx(openIdx === i ? null : i);
  const faqs = [
    { q:'What is a slash?', a:'A slash is a group buying order. You and other members pool funds to purchase items in bulk at better prices. Once all slots are filled, the order is placed and delivered to your hub.' },
    { q:'How does the payment hold work?', a:'When you join a slash, your money is held on your behalf and is not released to the supplier until a hub attendant physically verifies the delivery. If delivery fails, you are eligible for a refund. Payment infrastructure is being implemented through supported provider channels.' },
    { q:'How long does identity verification take?', a:'Verification is typically reviewed during business hours. You\'ll receive an in-app notification when your status is updated. As our verification partner integration matures, this process will become faster and more automated.' },
    { q:'What happens if a delivery fails?', a:'If the hub attendant cannot verify the delivery, affected slot members are eligible for a refund to their SlashIt wallet. Use "Report an Issue" inside the slash to trigger a formal review.' },
    { q:'Can I cancel my slot?', a:'Yes, if the slash hasn\'t filled yet. A cancellation penalty (currently 7%) applies. The remaining balance is refunded to your wallet. See our Refund Policy for details.' },
    { q:'What is the transport fee?', a:'The transport fee covers logistics from supplier to your hub. It\'s set per hub and locked at the time the slash is created. It\'s shown clearly in the charge breakdown before you join.' },
    { q:'How does the leaderboard work?', a:'Hostels compete weekly based on how many slashes their members complete. Top hostels earn perks like free delivery vouchers. The leaderboard resets weekly.' },
    { q:'What is the processing fee?', a:'A small processing fee covers platform maintenance. It\'s shown in your charge breakdown before you confirm any payment — no hidden charges.' },
    { q:'How do I collect my order?', a:'When your slash is ready, you\'ll get a notification. Go to your hub with your QR code (visible in the slash detail). The hub attendant will scan it to confirm your collection.' },
    { q:'What if I can\'t collect on time?', a:'Contact your hub attendant via the slash chat. Always collect within the communicated pickup window to avoid forfeiture.' },
    { q:'How do refunds reach me?', a:'Approved refunds go to your SlashIt wallet and can be used toward any future slash. For questions about a specific refund, contact support@slashit.ng.' },
  ];
  const disputes = [
    { step:'1', title:'Report the Issue', detail:'Inside the slash, tap "Report an Issue" and select the type (short delivery, wrong item, not delivered, etc.). Do this within 48 hours of the pickup window.' },
    { step:'2', title:'SlashIt Reviews (24hr)', detail:'Our compliance team will review your report, check attendant records, and contact you via in-app message or email within 24 hours.' },
    { step:'3', title:'Resolution', detail:'If the issue is confirmed: refund is issued to your wallet within 24 hours. If disputed by the supplier: both parties are contacted and a decision made within 5 business days.' },
    { step:'4', title:'Escalation', detail:'If you\'re unsatisfied, email support@slashit.ng with your slash ID and transaction reference. Our senior team will respond within 2 business days.' },
  ];
  return (
    <div style={{ background:'#f8fafc', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 20px 24px' }}>
        <button onClick={() => nav(-1)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block', border:'none', cursor:'pointer' }}>←</button>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>Help & FAQ</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:4 }}>Answers to common questions about SlashIt</div>
      </div>
      <div style={{ padding:'20px 20px 60px', maxWidth:640, margin:'0 auto' }}>
        <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:14 }}>Frequently Asked Questions</div>
        {faqs.map((f, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, marginBottom:8, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <button onClick={() => toggle(i)} style={{ width:'100%', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1e293b', flex:1, lineHeight:1.4 }}>{f.q}</span>
              <span style={{ fontSize:16, color:'#64748b', marginLeft:12, flexShrink:0, transition:'transform .2s', transform: openIdx===i?'rotate(180deg)':'none' }}>⌄</span>
            </button>
            {openIdx === i && (
              <div style={{ padding:'0 16px 14px', fontSize:13, color:'#475569', lineHeight:1.8, borderTop:'1px solid #f1f5f9' }}>
                <div style={{ paddingTop:10 }}>{f.a}</div>
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop:32, marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#1e293b', marginBottom:4 }}>⚖️ Dispute Resolution Process</div>
          <div style={{ fontSize:13, color:'#64748b', marginBottom:16, lineHeight:1.5 }}>If something goes wrong with your order, here is exactly how we handle it. Our goal is to resolve every dispute fairly within 24 hours.</div>
          {disputes.map(d => (
            <div key={d.step} style={{ display:'flex', gap:14, marginBottom:16, alignItems:'flex-start' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#1e3a8a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>{d.step}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:'#1e293b', marginBottom:4 }}>{d.title}</div>
                <div style={{ fontSize:12, color:'#64748b', lineHeight:1.7 }}>{d.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:14, padding:16, marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400e', marginBottom:6 }}>📞 Still need help?</div>
          <div style={{ fontSize:12, color:'#78350f', lineHeight:1.7 }}>
            Email: <strong>support@slashit.ng</strong><br/>
            Response time: within 24 hours (Mon–Fri 8am–8pm WAT)<br/>
            For urgent wallet issues: include your transaction reference in the subject line.
          </div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { FAQPage }
export { FAQ as FAQPage };
