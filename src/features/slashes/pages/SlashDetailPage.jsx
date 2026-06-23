/**
 * SlashDetail
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
import QRCode from 'qrcode';
import { toast } from '../../../toast';
import { CancelSlashModal } from '../components/CancelSlashModal';
import { DeadlineBridgeModal } from '../components/DeadlineBridgeModal';
import { JoinConfirmModal } from '../components/JoinConfirmModal';
import { PickupQRAndRating } from '../components/PickupQRAndRating';
import { PriceJumpPoll } from '../components/PriceJumpPoll';
import { ShareSlashSheet } from '../components/ShareSlashSheet';

export function SlashDetail() {
  const { updateSession } = useSession();
  const nav = useNavigate(); const F = getFlags();
  const [joining, setJoining] = useState(false);
  const id = (() => { const p = window.location.pathname.split('/').pop(); return isNaN(p) ? p : parseInt(p); })();
  const [slashes, setSlashes] = useState([]);
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [showCancel, setShowCancel] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showPriceJump, setShowPriceJump] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [voted, setVoted] = useState(false);
  const cfg = getPlatformConfig();
  const slash = slashes.find(s => String(s.id) === String(id)) || slashes[0];
  const joinFee = cfg.processingFee || 100;
  const joinInsuranceRate = (cfg.insuranceRate || 1) / 100;
  const joinInsurance = F.insurance ? Math.round((slash?.pricePerSlot || 0) * joinInsuranceRate) : 0;
  // Transport fee is READ FROM THE SLASH RECORD — locked at creation, never changes
  const joinTransportFee = (F.transportation !== false) ? (slash?.transportFee || 0) : 0;
  const joinTotal = (slash?.pricePerSlot || 0) + joinFee + joinTransportFee + joinInsurance;
  const canAfford = (user?.walletBalance || 0) >= joinTotal;
  const isExpired = new Date(slash.expiresAt) < new Date();
  const pct = slash.totalSlots > 0 ? Math.round(slash.filledSlots / slash.totalSlots * 100) : 0;
  const hasPoll = slash.pollType === 'PRICE_JUMP' || slash.pollType === 'DEADLINE_BRIDGE' || showPriceJump;

  const statusColor = { open:'#16a34a', full:'#2563eb', purchasing:'#d97706', awaiting_payment:'#d97706', payment_sent:'#7c3aed', ready_for_pickup:'#7c3aed', completed:'#475569', dissolved:'#dc2626', POLL_ACTIVE:'#f59e0b' };
  const sc = statusColor[slash.status] || '#64748b';

  const join = async () => {
    if ((user?.kycStatus || 'unverified') !== 'verified') { toast.error((user?.kycStatus === 'pending') ? 'KYC is under review. Wait for admin approval to join slashes.' : 'Verify your identity first to join slashes.'); nav('/kyc'); return; }
    if (!canAfford) { toast.error('Insufficient balance. Fund your wallet.'); return; }
    // Check reservation
    try {
      const allRes = reservations.expire();
      const slashReservations = allRes.filter(r => String(r.slashId) === String(slash.id) && r.status === 'pending');
      if (slashReservations.length > 0) {
        const myRes = slashReservations.find(r => r.phone === user.phone);
        if (!myRes) {
          const openSlots = slash.totalSlots - slash.filledSlots - slashReservations.length;
          if (openSlots <= 0) { toast.error('All remaining slots are reserved.'); return; }
        }
      }
    } catch(e) {}
    setJoining(true);
    try {
      const res = await api.slashes.join(slash.id);
      const updated = res.data || res.slash || res;
      // Update local state optimistically
      const newFilledSlots = Math.min(slash.totalSlots, slash.filledSlots + 1);
      const nowFull = newFilledSlots >= slash.totalSlots;
      const updatedSlashes = slashes.map(s => String(s.id) === String(slash.id)
        ? { ...s, filledSlots: newFilledSlots, isMine: true,
            reservedSlots: Math.max(0, (s.reservedSlots||0) - 1),
            status: nowFull ? 'awaiting_payment' : s.status, ...updated }
        : s);
      setSlashes(updatedSlashes);
      storage.save('slashes', updatedSlashes);
      // Update user balance locally
      const updatedUser = { ...user, walletBalance: user.walletBalance - joinTotal, slashCount: (user.slashCount||0)+1 };
      updateSession(updatedUser);
      // Confirm reservation if came via flyer
      try { reservations.confirm(user.phone, slash.id); } catch(e) {}
      if (nowFull) toast.success('🎉 Slash is full! Your slot is secured.');
      else toast.success('Joined! Payment held in escrow.');
    } catch(err) {
      toast.error(err.message || 'Could not join slash');
    } finally {
      setJoining(false);
    }
  };
  const confirmCancel = async (penalty, refund) => {
    try {
      await api.slashes.leave(slash.id);
    } catch(e) {}
    const updatedSlashes = slashes.map(s => s.id === slash.id
      ? { ...s, filledSlots: Math.max(0, s.filledSlots - 1), isMine: false, isLeader: false, status: s.filledSlots - 1 <= 0 ? 'dissolved' : s.status }
      : s);
    setSlashes(updatedSlashes); storage.save('slashes', updatedSlashes);
    const updatedUser = { ...user, walletBalance: (user.walletBalance||0) + refund };
    updateSession(updatedUser);
    toast.success(`Cancelled. ${fmt(refund)} refunded to wallet.`); setShowCancel(false); nav('/home');
  };

  const submitReport = async () => {
    if (!reportReason.trim()) { toast.error('Please describe the issue'); return; }
    const dispute = {
      id: 'dispute-' + Date.now(),
      slashId: slash.id, slashName: slash.name,
      userId: user.id, userName: user.name, userEmail: user.email,
      reason: reportReason.trim(), status: 'open', priority: 'medium',
      createdAt: new Date().toISOString(), emoji: slash.emoji || '📦',
    };
    const existing = JSON.parse(localStorage.getItem('slashit_admin_user_disputes') || '[]');
    localStorage.setItem('slashit_admin_user_disputes', JSON.stringify([dispute, ...existing]));
    setReportSubmitted(true);
    toast.success("Issue reported — admin will review within 24 hours");
  };

  const handlePriceAccept = (newPrice) => {
    const updated = slashes.map(s => s.id === slash.id ? { ...s, pricePerSlot:newPrice, pollType:null, status:'open' } : s);
    setSlashes(updated); storage.save('slashes', updated);
    pollStorage.add({ id:'poll-'+Date.now(), slashId:slash.id, slashName:slash.name, type:'PRICE_JUMP', result:'accepted', newPrice, yesVotes:0, noVotes:0, createdAt:new Date().toISOString() });
    toast.success('New price accepted. Slash continues!'); setShowPriceJump(false);
  };
  const handleDissolve = () => {
    const updated = slashes.map(s => s.id === slash.id ? { ...s, status:'dissolved', pollType:null } : s);
    setSlashes(updated); storage.save('slashes', updated);
    const updatedUser = { ...user, walletBalance: (user.walletBalance||0) + slash.pricePerSlot };
    updateSession(updatedUser);
    pollStorage.add({ id:'poll-'+Date.now(), slashId:slash.id, slashName:slash.name, type: showPriceJump?'PRICE_JUMP':'DEADLINE_BRIDGE', result:'dissolved', yesVotes:0, noVotes:0, createdAt:new Date().toISOString() });
    // Broadcast dissolved message to all members
    try {
      const freshCols = JSON.parse(localStorage.getItem('slashit_attendant_collections') || '[]');
      const col = freshCols.find(c => String(c.slashId) === String(slash.id));
      if (col) {
        col.members.forEach(member => {
          const text = `[SlashIt] Hi ${member.name.split(' ')[0]},\nYour "${slash.name}" slash has ended without completing. A full refund has been sent to your wallet.\n— SlashIt ⚡`;
          msgStorage.push(member.userId, { id:`msg-dissolved-${Date.now()}-${member.userId}`, type:'dissolved', slashId:slash.id, slashName:slash.name, hubName:slash.hubName, text, sentAt:new Date().toISOString(), isRead:false });
          pushBrowserNotif('↩️ Slash Dissolved', `Your "${slash.name}" slash ended. Full refund sent to your wallet.`);
        });
      }
    } catch(e) {}
    toast.success('Slash dissolved. Full refund issued.'); setShowPriceJump(false); setShowDeadline(false); nav('/home');
  };
  const handleExtend = () => {
    const newExpiry = new Date(Date.now() + 24*3600000).toISOString();
    const updated = slashes.map(s => s.id === slash.id ? { ...s, expiresAt:newExpiry, pollType:null } : s);
    setSlashes(updated); storage.save('slashes', updated);
    pollStorage.add({ id:'poll-'+Date.now(), slashId:slash.id, slashName:slash.name, type:'DEADLINE_BRIDGE', result:'extended', yesVotes:0, noVotes:0, createdAt:new Date().toISOString() });
    toast.success('Deadline extended by 24 hours!'); setShowDeadline(false);
  };

  const voteOnPoll = (choice) => {
    setVoted(true);
    const isPriceJump = slash.pollType === 'PRICE_JUMP';
    const extraCharge = isPriceJump ? (slash.pollNewPrice||Math.round(slash.pricePerSlot*1.12)) - slash.pricePerSlot : 0;

    // Update vote count in admin-readable poll storage
    const polls = pollStorage.load();
    const updatedPolls = polls.map(p => {
      if (p.slashId === slash.id && p.result === 'active') {
        return { ...p, yesVotes:(p.yesVotes||0)+(choice==='yes'?1:0), noVotes:(p.noVotes||0)+(choice==='no'?1:0) };
      }
      return p;
    });
    pollStorage.save(updatedPolls);

    // If price jump and voted yes — deduct extra from wallet
    if (isPriceJump && choice === 'yes' && extraCharge > 0) {
      const updatedUser = { ...user, walletBalance: (user.walletBalance||0) - extraCharge };
      updateSession(updatedUser);
      const txns = storage.load('transactions', []);
      storage.save('transactions', [
        { id:'txn-'+Date.now(), type:'debit', amount:extraCharge, description:`Price Jump — ${slash.name} (+${fmt(extraCharge)} extra)`, createdAt:new Date().toISOString() },
        ...txns
      ]);
      toast.success(`✓ Voted YES — ${fmt(extraCharge)} extra charged to wallet`);
    } else if (choice === 'yes') {
      toast.success('Voted YES ✓');
    } else {
      toast('Voted NO — refund will be processed by admin');
    }
    setTimeout(() => nav('/home'), 1400);
  };

  const triggerPriceJump = () => {
    const newPrice = Math.round(slash.pricePerSlot * 1.12);
    const updated = slashes.map(s => s.id === slash.id ? { ...s, pollType:'PRICE_JUMP', status:'POLL_ACTIVE', pollNewPrice: newPrice, pollYesVotes:0, pollNoVotes:0 } : s);
    setSlashes(updated); storage.save('slashes', updated);
    pollStorage.add({ id:'poll-'+Date.now(), slashId:slash.id, slashName:slash.name, type:'PRICE_JUMP', result:'active', newPrice, yesVotes:0, noVotes:0, createdAt:new Date().toISOString() });
    toast.success('Price Jump Poll created! Members notified.');
    // Bell notif + browser push + message inbox for all members
    try {
      const cols = JSON.parse(localStorage.getItem('slashit_attendant_collections') || '[]');
      const col = cols.find(c => String(c.slashId) === String(slash.id));
      const members = col ? col.members : [{ userId: user?.id, name: user?.name || 'Member' }];
      members.forEach(member => {
        // Bell notif
        const notifKey = 'slashit_user_notifications';
        const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        notifs.unshift({ id:'notif-pj-'+Date.now()+'-'+member.userId, type:'price_jump', title:'💰 Price Jump Poll', body:`The price for "${slash.name}" may change. Vote now before it expires.`, isRead:false, createdAt:new Date().toISOString(), slashId:slash.id });
        localStorage.setItem(notifKey, JSON.stringify(notifs));
        // Message inbox
        const msgText = `[SlashIt] Hi ${member.name.split(' ')[0]} 👋\nA Price Jump Poll has been activated for your slash "${slash.name}".\nNew proposed price: ${fmt(newPrice)} per slot (+12%).\nOpen your slash to vote YES or NO before it expires.\n— SlashIt ⚡`;
        msgStorage.push(member.userId, { id:`msg-pj-${Date.now()}-${member.userId}`, type:'price_jump', slashId:slash.id, slashName:slash.name, hubName:slash.hubName||'', text:msgText, sentAt:new Date().toISOString(), isRead:false });
        // Browser push
        pushBrowserNotif('💰 Price Jump Poll', `Vote on the price change for "${slash.name}" before it expires.`);
      });
    } catch(e) {}
    setShowPriceJump(true);
  };
  const triggerDeadlineBridge = () => {
    const updatedDB = slashes.map(s => s.id === slash.id ? { ...s, pollType:'DEADLINE_BRIDGE', status:'POLL_ACTIVE', pollYesVotes:0, pollNoVotes:0 } : s);
    setSlashes(updatedDB); storage.save('slashes', updatedDB);
    pollStorage.add({ id:'poll-'+Date.now(), slashId:slash.id, slashName:slash.name, type:'DEADLINE_BRIDGE', result:'active', yesVotes:0, noVotes:0, createdAt:new Date().toISOString() });
    toast.success('Deadline Bridge poll created! Members notified.');
    // Bell notif + browser push + message inbox for all members
    try {
      const cols = JSON.parse(localStorage.getItem('slashit_attendant_collections') || '[]');
      const col = cols.find(c => String(c.slashId) === String(slash.id));
      const members = col ? col.members : [{ userId: user?.id, name: user?.name || 'Member' }];
      members.forEach(member => {
        const notifKey = 'slashit_user_notifications';
        const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        notifs.unshift({ id:'notif-db-'+Date.now()+'-'+member.userId, type:'deadline_bridge', title:'⏰ Deadline Approaching', body:`"${slash.name}" deadline passed with unfilled slots. Vote to extend or dissolve.`, isRead:false, createdAt:new Date().toISOString(), slashId:slash.id });
        localStorage.setItem(notifKey, JSON.stringify(notifs));
        const msgText = `[SlashIt] Hi ${member.name.split(' ')[0]} ⏰\nThe deadline for "${slash.name}" has passed but the slash isn't full yet.\nVote to extend by 24 hours — or choose to dissolve and get a full refund.\nOpen your slash now to vote.\n— SlashIt ⚡`;
        msgStorage.push(member.userId, { id:`msg-db-${Date.now()}-${member.userId}`, type:'deadline_bridge', slashId:slash.id, slashName:slash.name, hubName:slash.hubName||'', text:msgText, sentAt:new Date().toISOString(), isRead:false });
        pushBrowserNotif('⏰ Deadline Approaching', `"${slash.name}" deadline passed. Vote to extend or get a refund.`);
      });
    } catch(e) {}
    setShowDeadline(true);
  };

  return (
    <div style={{ background:'#f0f4ff', minHeight:'100vh', paddingBottom:90 }}>
      {/* Hero header */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'52px 16px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, fontSize:110, opacity:.1, transform:'rotate(12deg)', lineHeight:1 }}>{slash.emoji}</div>
        <button onClick={() => nav(-1)} style={{ color:'rgba(255,255,255,.85)', background:'none', fontSize:22, marginBottom:12, display:'block' }}>←</button>
        {/* Status badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:sc+'22', border:`1px solid ${sc}44`, borderRadius:20, padding:'4px 12px', marginBottom:10 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:sc }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'#fff', textTransform:'capitalize' }}>{(slash?.status || '').replace(/_/g,' ')}</span>
        </div>
        <div style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:4 }}>{slash.name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginBottom:4 }}>{slash.description || 'Group buying slash'}</div>
        {/* Hub breadcrumb — location always visible */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, background:'rgba(255,255,255,.12)', borderRadius:10, padding:'8px 12px', border:'1px solid rgba(255,255,255,.2)' }}>
          <span style={{ fontSize:14 }}>🏪</span>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.6)', fontFamily:'monospace' }}>{slash.state||'Oyo'} › {slash.city||'Ibadan'}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{slash.hubName}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
        {/* Progress card */}
        <Card style={{ padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>Group Progress</span>
            <span style={{ fontSize:16, fontWeight:900, color:'#16a34a', fontFamily:'monospace' }}>{pct}%</span>
          </div>
          <FillBar filled={slash.filledSlots} total={slash.totalSlots} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'#64748b' }}>
            <span><strong style={{ color:'#1e293b' }}>{slash.filledSlots}</strong> slots filled</span>
            <span><strong style={{ color:'#1e293b' }}>{slash.totalSlots - slash.filledSlots}</strong> remaining</span>
            <span>{isExpired ? <span style={{ color:'#dc2626' }}>⏰ Expired</span> : `⏰ ${timeUntil(slash.expiresAt)}`}</span>
          </div>
        </Card>

        {/* Info grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Price/Slot', fmt(slash.pricePerSlot), '#1d4ed8'],
            ['Total Value', fmt(slash.totalPrice||slash.pricePerSlot*slash.totalSlots), '#1e293b'],
            ['Created by', slash.leaderName||'Leader', '#1e293b'],
            ['Time Limit', slash.timeLimit||'48h', '#64748b'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'#fff', borderRadius:12, padding:'10px 12px', border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:800, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Hub delivery card */}
        <Card style={{ padding:14 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:44, height:44, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏪</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace', marginBottom:2 }}>{slash.state||'Oyo'} › {slash.city||'Ibadan'}</div>
              <div style={{ fontWeight:800, fontSize:14, color:'#1e293b' }}>{slash.hubName}</div>
              {slash.hubAddress && <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{slash.hubAddress}</div>}
            </div>
            <div style={{ background:'#eff6ff', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#1d4ed8' }}>Pickup here</div>
          </div>
        </Card>

        {/* Escrow + insurance */}
        <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:12, padding:'12px 14px', fontSize:12, color:'#1d4ed8', lineHeight:1.6 }}>
          🔒 <strong>Escrow protected.</strong> Your payment stays locked until the attendant verifies delivery.{F.insurance ? ` ${cfg.insuranceRate||1}% goes to the insurance pool against supply failures.` : ''}
        </div>

        {/* ── POLL SECTION — visible to ALL members ── */}
        {(slash.pollType || showPriceJump || showDeadline) && slash.status !== 'dissolved' && (() => {
          const isPriceJump = slash.pollType === 'PRICE_JUMP' || showPriceJump;
          const isDeadline  = slash.pollType === 'DEADLINE_BRIDGE' || showDeadline;
          const newPrice    = slash.pollNewPrice || Math.round(slash.pricePerSlot * 1.12);
          const extraPerSlot = newPrice - slash.pricePerSlot;
          const yesCount = slash.pollYesVotes || 0;
          const noCount  = slash.pollNoVotes  || 0;
          const totalVotes = yesCount + noCount;
          return (
            <div style={{ background: isPriceJump ? '#fff7ed' : '#fef9c3', border: `2px solid ${isPriceJump ? '#fed7aa' : '#fde68a'}`, borderRadius:14, padding:14 }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{isPriceJump ? '💰' : '⏰'}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color: isPriceJump ? '#c2410c' : '#92400e' }}>
                    {isPriceJump ? 'Price Jump — Admin Alert' : 'Deadline Extension Vote'}
                  </div>
                  {isPriceJump && <div style={{ fontSize:10, color:'#92400e', fontWeight:600 }}>Created by Admin · All members must vote</div>}
                </div>
              </div>

              {/* Price jump detail */}
              {isPriceJump && (
                <div style={{ background:'rgba(255,255,255,.7)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center' }}>
                    {[
                      ['Original', fmt(slash.pricePerSlot), '#64748b'],
                      ['Increase', '+'+fmt(extraPerSlot), '#dc2626'],
                      ['New Price', fmt(newPrice), '#16a34a'],
                    ].map(([l,v,c]) => (
                      <div key={l}>
                        <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{l}</div>
                        <div style={{ fontWeight:800, fontSize:13, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, fontSize:11, color:'#c2410c', lineHeight:1.5, textAlign:'center' }}>
                    If you vote <strong>Yes</strong>, an extra <strong>{fmt(extraPerSlot)}</strong> will be charged to your wallet immediately.
                    If majority vote <strong>No</strong>, the slash dissolves with full refund.
                  </div>
                </div>
              )}

              {!isPriceJump && (
                <div style={{ fontSize:12, color:'#78350f', marginBottom:10, lineHeight:1.5 }}>
                  The slash deadline has passed with unfilled slots. Vote to extend by 24 hours or dissolve with full refund.
                </div>
              )}

              {/* Vote bars */}
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
                {[
                  { label: isPriceJump ? 'Yes — pay extra & continue' : 'Yes — extend 24h', count: yesCount, color:'#16a34a' },
                  { label: 'No — dissolve & refund', count: noCount, color:'#dc2626' },
                ].map(row => {
                  const w = totalVotes > 0 ? Math.round(row.count/totalVotes*100) : 0;
                  return (
                    <div key={row.label} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'#78350f', width:170, flexShrink:0 }}>{row.label}</span>
                      <div style={{ flex:1, background:'rgba(0,0,0,.08)', borderRadius:99, height:8, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:w+'%', background:row.color, borderRadius:99 }}/>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, width:24, textAlign:'right' }}>{row.count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Vote buttons for members (not leader) */}
              {!voted && slash.isMine && !slash.isLeader && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => voteOnPoll('yes')}
                    style={{ flex:1, padding:'11px', background:'#dcfce7', border:'2px solid #86efac', color:'#15803d', borderRadius:10, fontSize:12, fontWeight:700 }}>
                    ✓ Yes {isPriceJump ? `— Pay ${fmt(extraPerSlot)} extra` : '— Extend 24h'}
                  </button>
                  <button onClick={() => voteOnPoll('no')}
                    style={{ flex:1, padding:'11px', background:'#fee2e2', border:'2px solid #fca5a5', color:'#dc2626', borderRadius:10, fontSize:12, fontWeight:700 }}>
                    ✗ No — Refund me
                  </button>
                </div>
              )}

              {/* Leader view — can finalize */}
              {slash.isLeader && (
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  {isPriceJump && (
                    <button onClick={() => handlePriceAccept(newPrice)}
                      style={{ flex:1, padding:'10px', background:'#dcfce7', border:'1.5px solid #86efac', color:'#15803d', borderRadius:10, fontSize:12, fontWeight:700 }}>
                      ✓ Accept New Price
                    </button>
                  )}
                  {isDeadline && (
                    <button onClick={handleExtend}
                      style={{ flex:1, padding:'10px', background:'#dbeafe', border:'1.5px solid #93c5fd', color:'#1d4ed8', borderRadius:10, fontSize:12, fontWeight:700 }}>
                      ⏰ Extend 24h
                    </button>
                  )}
                  <button onClick={handleDissolve}
                    style={{ flex:1, padding:'10px', background:'#fee2e2', border:'1.5px solid #fca5a5', color:'#dc2626', borderRadius:10, fontSize:12, fontWeight:700 }}>
                    💔 Dissolve & Refund
                  </button>
                </div>
              )}

              {voted && (
                <div style={{ background:'#dcfce7', borderRadius:10, padding:'10px 14px', textAlign:'center', fontSize:12, fontWeight:700, color:'#15803d', marginTop:8 }}>
                  ✓ Vote recorded! Waiting for all members to vote...
                </div>
              )}
            </div>
          );
        })()}

        {/* ── LEADER TOOLS — only Deadline Extension is user-creatable ── */}
        {slash.isLeader && (slash.status === 'open' || slash.status === 'full') && !slash.pollType && (
          <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:14, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#92400e', marginBottom:10 }}>Leader Tools ⚡</div>
            <button onClick={triggerDeadlineBridge}
              style={{ width:'100%', padding:'12px', background:'#fff', border:'2px solid #fed7aa', color:'#c2410c', borderRadius:10, fontSize:13, fontWeight:700, textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>⏰</span>
              <div>
                <div>Request Deadline Extension</div>
                <div style={{ fontSize:11, fontWeight:400, color:'#78350f', marginTop:2 }}>Ask members to vote on extending this slash by 24 hours</div>
              </div>
            </button>
            <div style={{ fontSize:11, color:'#b45309', marginTop:8, padding:'8px 10px', background:'rgba(255,255,255,.5)', borderRadius:8, lineHeight:1.5 }}>
              ℹ️ <strong>Price Jump polls</strong> are created and managed by the admin when market prices change. You will be notified automatically.
            </div>
          </div>
        )}

        {/* Join */}
        {slash.status === 'open' && !slash.isMine && (
          <div>
            {/* Cost breakdown */}
            <div style={{ background: canAfford ? '#eff6ff' : '#fef2f2', border: `1.5px solid ${canAfford ? '#bfdbfe' : '#fecaca'}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Charge Breakdown</div>
              {[
                [`Slot payment — ${slash.name}`, fmt(slash.pricePerSlot || 0)],
                ['Processing fee', fmt(joinFee)],
                ...(joinTransportFee > 0 ? [['🚚 Transport fee — ' + (slash.hubName||'hub'), fmt(joinTransportFee)]] : []),
                ...(F.insurance && joinInsurance > 0 ? [`${cfg.insuranceRate||1}% Insurance pool`, fmt(joinInsurance)] : []).length > 0 ? [[`${cfg.insuranceRate||1}% Insurance pool`, fmt(joinInsurance)]] : [],
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,.05)' }}>
                  <span style={{ color:'#64748b' }}>{l}</span>
                  <span style={{ fontWeight:700, color:'#1e293b' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, paddingTop:8, marginTop:4, borderTop:'1.5px solid rgba(0,0,0,.08)' }}>
                <span style={{ fontWeight:800 }}>Total charged now</span>
                <span style={{ fontWeight:900, color:'#2563eb' }}>{fmt(joinTotal)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:8 }}>
                <span style={{ color:'#64748b' }}>Your wallet</span>
                <span style={{ fontWeight:700, color:canAfford?'#16a34a':'#dc2626' }}>{fmt(user?.walletBalance||0)}</span>
              </div>
              {canAfford && (
                <div style={{ fontSize:11, color:'#1d4ed8', marginTop:4, fontWeight:600 }}>
                  💰 Wallet after: {fmt((user?.walletBalance||0) - joinTotal)}
                </div>
              )}
            </div>
            {!canAfford && <div style={{ background:'#fee2e2', borderRadius:10, padding:'10px 14px', marginBottom:10, fontSize:12, color:'#dc2626', fontWeight:600 }}>⚠️ Need {fmt(joinTotal - (user?.walletBalance||0))} more to join this slash.</div>}
            {(user?.kycStatus||'unverified') !== 'verified' && (
              <div onClick={() => nav('/kyc')} style={{ background: (user?.kycStatus||'unverified')==='pending'?'#eff6ff':'#fef9c3', border:`1px solid ${(user?.kycStatus||'unverified')==='pending'?'#bfdbfe':'#fde68a'}`, borderRadius:10, padding:'10px 14px', marginBottom:10, fontSize:12, color:(user?.kycStatus||'unverified')==='pending'?'#1d4ed8':'#92400e', fontWeight:600, cursor:'pointer' }}>
                {(user?.kycStatus||'unverified')==='pending' ? '⏳ KYC is under review — wait for admin approval before joining.' : '⚠️ Identity not verified. Tap to verify before joining →'}
              </div>
            )}
            <Btn full loading={joining} disabled={!canAfford||(user?.kycStatus||'unverified')!=='verified'} onClick={() => setShowJoinConfirm(true)}>
              Join Slash — {fmt(joinTotal)}
            </Btn>
            {!canAfford && F.walletFunding && <Btn full variant="ghost" style={{ marginTop:8 }} onClick={() => nav('/wallet/fund')}>Fund Wallet</Btn>}
          </div>
        )}

        {/* Joined */}
        {slash.isMine && (slash.status==='open'||slash.status==='full') && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ padding:12, background:'#eff6ff', borderRadius:12, textAlign:'center', fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
              {slash.isLeader ? '👑 You created this slash' : '✓ You are in this slash'}
            </div>
            {/* What you paid breakdown */}
            <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12, padding:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>What You Paid</div>
              {[
                [`Slot — ${slash.name}`, fmt(slash.pricePerSlot || 0)],
                ['Processing fee', fmt(cfg.processingFee || 100)],
                ...(joinTransportFee > 0 ? [['🚚 Transport — ' + (slash.hubName||'hub'), fmt(joinTransportFee)]] : []),
                ...(F.insurance && joinInsurance > 0 ? [[`${cfg.insuranceRate||1}% Insurance pool`, fmt(joinInsurance)]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid rgba(0,0,0,.04)' }}>
                  <span style={{ color:'#64748b' }}>{l}</span>
                  <span style={{ fontWeight:700, color:'#334155' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, paddingTop:8, marginTop:4, borderTop:'1.5px solid #e2e8f0' }}>
                <span style={{ fontWeight:800, color:'#0f172a' }}>Total paid</span>
                <span style={{ fontWeight:900, color:'#2563eb' }}>{fmt(joinTotal)}</span>
              </div>
            </div>
            {/* Share button — only when slash still has open slots */}
            {slash.status === 'open' && (
              <button onClick={() => setShowShare(true)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', width:'100%', boxShadow:'0 4px 14px rgba(37,99,235,.35)' }}>
                <span style={{ fontSize:18 }}>📢</span>
                Share & Fill Your Slash
                <span style={{ background:'rgba(255,255,255,.2)', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700, marginLeft:4 }}>{slash.totalSlots - slash.filledSlots} left</span>
              </button>
            )}
            <Btn full variant="danger" onClick={() => setShowCancel(true)}>Cancel my slot ({cfg.cancellationPenaltyPct||7}% penalty)</Btn>
            <Btn full variant="ghost" style={{marginTop:6,color:'#f97316',borderColor:'#fed7aa',background:'#fff7ed'}} onClick={() => setShowReport(true)}>⚑ Report an Issue</Btn>
          </div>
        )}

        {/* Awaiting payment — slash is full, admin processing supplier payment */}
        {slash.isMine && slash.status === 'awaiting_payment' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ padding:16, background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:14, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#92400e', marginBottom:4 }}>Slash is Full — Processing Payment</div>
              <div style={{ fontSize:12, color:'#78350f', lineHeight:1.6 }}>Your slot is secured. We are processing payment to the supplier. Delivery will be arranged once payment is confirmed.</div>
            </div>
            <div style={{ padding:12, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontSize:12, color:'#64748b', textAlign:'center' }}>
              🔒 Your funds are held securely until delivery is confirmed
            </div>
          </div>
        )}

        {/* Payment sent — supplier has been paid, awaiting delivery */}
        {slash.isMine && slash.status === 'payment_sent' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ padding:16, background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:14, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💸</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#1d4ed8', marginBottom:4 }}>Supplier Paid — Awaiting Delivery</div>
              <div style={{ fontSize:12, color:'#1e40af', lineHeight:1.6 }}>Payment has been sent to the supplier. Your order is being prepared and will be delivered to <strong>{slash.hubName}</strong> soon. You will be notified when it arrives.</div>
              {slash.supplierName && <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>Supplier: {slash.supplierName}</div>}
            </div>
            <div style={{ padding:12, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontSize:12, color:'#64748b', textAlign:'center' }}>
              🔒 Your funds remain protected until delivery is verified by your hub attendant
            </div>
          </div>
        )}

        {/* Ready for pickup — QR code + hub rating */}
        {slash.status === 'ready_for_pickup' && slash.isMine && (
          <PickupQRAndRating slash={slash} user={user} />
        )}
      </div>

      {showCancel && <CancelSlashModal slash={slash} onConfirm={confirmCancel} onClose={() => setShowCancel(false)}/>}
      {showReport && (
        <div style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&setShowReport(false)}>
          <div style={{background:'#fff',borderRadius:20,padding:24,width:'100%',maxWidth:380}}>
            {reportSubmitted ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <div style={{fontSize:18,fontWeight:900,color:'#1e293b',marginBottom:8}}>Report Submitted</div>
                <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>Admin will review your issue and respond within 24 hours.</div>
                <button onClick={()=>{setShowReport(false);setReportSubmitted(false);setReportReason('');}} style={{background:'#2563eb',color:'#fff',fontWeight:700,padding:'12px 24px',borderRadius:12,border:'none',width:'100%',fontSize:14}}>Done</button>
              </div>
            ) : (
              <>
                <div style={{fontSize:18,fontWeight:900,color:'#1e293b',marginBottom:4}}>⚑ Report an Issue</div>
                <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Slash: <strong>{slash.name}</strong></div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                  {['Item not delivered','Wrong item received','Short delivery','Item damaged','Other issue'].map(opt=>(
                    <button key={opt} onClick={()=>setReportReason(opt)} style={{textAlign:'left',padding:'10px 14px',borderRadius:10,border:`2px solid ${reportReason===opt?'#f97316':'#e2e8f0'}`,background:reportReason===opt?'#fff7ed':'#fff',color:reportReason===opt?'#c2410c':'#374151',fontWeight:reportReason===opt?700:400,fontSize:13}}>{opt}</button>
                  ))}
                </div>
                <textarea value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Describe what happened..." rows={3} style={{width:'100%',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 12px',fontSize:13,marginBottom:14,resize:'none',boxSizing:'border-box'}}/>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowReport(false)} style={{flex:1,padding:12,borderRadius:12,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',fontWeight:700,fontSize:13}}>Cancel</button>
                  <button onClick={submitReport} style={{flex:2,padding:12,borderRadius:12,border:'none',background:'#f97316',color:'#fff',fontWeight:700,fontSize:13}}>Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showPriceJump && !slash.pollType && <PriceJumpPoll slash={slash} onAccept={handlePriceAccept} onDissolve={handleDissolve} onClose={() => setShowPriceJump(false)}/>}
      {showShare && <ShareSlashSheet slash={slash} user={user} onClose={() => setShowShare(false)}/>}
      {showDeadline && !slash.pollType && <DeadlineBridgeModal slash={slash} onExtend={handleExtend} onDissolve={handleDissolve} onClose={() => setShowDeadline(false)}/>}
      {showJoinConfirm && (
        <JoinConfirmModal
          slash={slash} joinTotal={joinTotal} joinFee={joinFee}
          joinTransportFee={joinTransportFee} joinInsurance={joinInsurance}
          walletBalance={user?.walletBalance||0} cfg={cfg} F={F}
          onConfirm={() => { setShowJoinConfirm(false); join(); }}
          onClose={() => setShowJoinConfirm(false)}
        />
      )}
    </div>
  );
}

// Re-export alias so App.jsx can import { SlashDetailPage }
export { SlashDetail as SlashDetailPage };
