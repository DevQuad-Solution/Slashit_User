/**
 * Wallet
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
import { LegalFooter } from '../../../components/layout/LegalFooter';

export function Wallet() {
  const { updateSession } = useSession();
  const nav = useNavigate(); const F = getFlags();
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [txns, setTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [copied, setCopied] = useState(false);

  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [totalTxns, setTotalTxns] = useState(0);
  const LIMIT = 20;

  const fetchData = async (pg=1) => {
    try {
      const [meRes, txnRes] = await Promise.all([
        api.auth.me(),
        api.transactions.getAll(pg, LIMIT),
      ]);

      // /auth/me returns { data: { userAccountDetails, kyc, hub, ... } } — no data.user wrapper
      const me = extractUser(meRes);
      if (me) {
        const updated = mapUser(me, user);
        updateSession(updated);
      }

      // /transaction — Monnify transaction list
      // Possible shapes: { data: [...] } or { data: { transactions:[...], total, totalCount } }
      const raw = txnRes.data;
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        list = raw.transactions || raw.data || raw.items || raw.records || [];
        const total = raw.total || raw.totalCount || raw.count || 0;
        setTotalTxns(total);
        setHasMore(list.length === LIMIT);
      }
      if (pg === 1) {
        setTxns(list);
      } else {
        setTxns(prev => [...prev, ...list]);
      }
    } catch(e) {
      if (pg === 1) setTxns([]); // No mock data — show empty state
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    const iv = setInterval(() => fetchData(1), 30000);
    return () => clearInterval(iv);
  }, []);

  const copyAcct = () => {
    const acct = user.accountNumber || user.virtualAccountNumber || '';
    if (!acct) { toast.error('Account number not available yet — complete KYC first'); return; }
    try { navigator.clipboard.writeText(acct); } catch(e) {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Account number copied!');
  };

  const typeIcon  = { credit:'↓', debit:'↑', fee:'%', refund:'↩', TOP_UP:'↓', ESCROW_HOLD:'↑', FEE:'%', REFUND:'↩', PENALTY_RECEIVED:'🎁' };
  const typeBg    = { credit:'#dcfce7', debit:'#fee2e2', fee:'#fef3c7', refund:'#dbeafe', TOP_UP:'#dcfce7', ESCROW_HOLD:'#fee2e2', FEE:'#fef3c7', REFUND:'#dbeafe' };
  const typeColor = { credit:'#16a34a', debit:'#dc2626', fee:'#d97706', refund:'#2563eb', TOP_UP:'#16a34a', ESCROW_HOLD:'#dc2626', FEE:'#d97706', REFUND:'#2563eb' };
  const isPositive = t => ['credit','refund','TOP_UP','REFUND','PENALTY_RECEIVED'].includes(t.type);

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.8)', background: 'none', fontSize: 22, marginBottom: 12, display: 'block' }}>←</button>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 4, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>Wallet Balance</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-1px' }}>{fmt(user.walletBalance)}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {F.walletFunding && (
            <button onClick={() => nav('/wallet/fund')} style={{ flex: 1, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 12 }}>+ Fund Wallet</button>
          )}
          <button onClick={() => nav('/slashes')} style={{ flex: 1, background: '#fff', color: '#1d4ed8', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 12 }}>All Transactions</button>
        </div>
      </div>

      {/* Monnify Virtual Account Box */}
      <div style={{ margin: '0 16px', marginTop: -20, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,.08)', padding: 16, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🏦</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>Your Static Account — Fund by Transfer</span>
        </div>
        {[
          { label: 'Bank (Virtual)', value: user.accountBank || 'Wema bank' },
          { label: 'Account Number', value: user.accountNumber || user.virtualAccountNumber || 'Pending — complete KYC', mono: !!(user.accountNumber||user.virtualAccountNumber), canCopy: !!(user.accountNumber||user.virtualAccountNumber) },
          { label: 'Account Name', value: user.accountName || user.virtualAccountName || `SLASHIT / ${(user.name||user.fullName||'').split(' ')[0].toUpperCase()}` },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: row.mono ? 15 : 13, fontWeight: 700, color: '#1e293b', fontFamily: row.mono ? 'monospace' : 'inherit', letterSpacing: row.mono ? '1px' : 'normal' }}>{row.value}</span>
              {row.canCopy && (
                <button onClick={copyAcct} style={{ fontSize: 10, background: copied ? '#dcfce7' : '#eff6ff', color: copied ? '#16a34a' : '#1d4ed8', fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, background: '#eff6ff', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#2563eb', fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>Transfer from any Nigerian bank · Balance updates in ~15 seconds</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {/* 🤖 AI Savings Insight */}
        {txns.length > 0 && (() => {
          const debitAmt = txns.reduce((s,t) => {
            const amt = Math.abs(Number(t.amount||t.amountPaid||0));
            const isDebit = ['debit','slash','payment'].some(k=>(t.type||t.narration||t.description||'').toLowerCase().includes(k));
            return s + (isDebit ? amt : 0);
          }, 0);
          const savedEst = Math.round(debitAmt * 0.18 / 500) * 500;
          if (savedEst < 500) return null;
          return (
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <span style={{ fontSize:28, flexShrink:0 }}>🤖</span>
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.65)', letterSpacing:'.06em', marginBottom:3 }}>AI SAVINGS ESTIMATE</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff', lineHeight:1.3 }}>You have saved ~{fmt(savedEst)} buying in groups vs retail</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:3 }}>Based on {txns.length} transaction{txns.length!==1?'s':''}</div>
              </div>
            </div>
          );
        })()}
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 10 }}>Recent Transactions</div>
        <Card>
          {loadingTxns && txns.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 20px', color:'#94a3b8' }}>
              <span className="spin" style={{ width:22, height:22, border:'2px solid #e2e8f0', borderTopColor:'#2563eb', borderRadius:'50%', display:'inline-block', marginBottom:8 }}/><br/>
              <span style={{ fontSize:13 }}>Loading transactions…</span>
            </div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <div style={{ fontWeight: 600 }}>No transactions yet</div>
            </div>
          ) : txns.map((t, i) => {
            // Monnify field names: paymentReference, amountPaid, narration, transactionDate
            const desc = t.narration || t.description || t.paymentDescription || t.paymentReference || 'Transaction';
            const amt  = t.amount || t.amountPaid || t.settledAmount || 0;
            const ref  = t.reference || t.paymentReference || t.transactionReference || '';
            const dt   = t.createdAt || t.transactionDate || t.paymentDate || '';
            const typ  = t.type || (t.paymentStatus === 'PAID' ? 'credit' : 'debit');
            return (
            <div key={t._id||t.id||i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < txns.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: typeBg[typ] || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: typeColor[typ] || '#64748b', flexShrink: 0 }}>
                {typeIcon[typ] || '·'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{dt ? fromNow(dt) : ''}{ref ? ` · ${ref.slice(-8)}` : ''}</div>
              </div>
              <div style={{ fontWeight: 800, color: isPositive({type:typ}) ? '#16a34a' : '#dc2626', flexShrink: 0, fontSize: 13 }}>
                {isPositive({type:typ}) ? '+' : '-'}{fmt(Math.abs(amt))}
              </div>
            </div>
            );
          })}
          {hasMore && !loadingTxns && (
            <button onClick={()=>{ const np=page+1; setPage(np); fetchData(np); }}
              style={{ width:'100%', padding:'12px', textAlign:'center', fontSize:13, fontWeight:700, color:'#2563eb', background:'#f8faff', border:'none', borderTop:'1px solid #f1f5f9', cursor:'pointer', borderRadius:'0 0 12px 12px' }}>
              Load More Transactions
            </button>
          )}
          {loadingTxns && txns.length > 0 && (
            <div style={{ textAlign:'center', padding:'12px', fontSize:12, color:'#94a3b8' }}>Loading more…</div>
          )}
        </Card>
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { WalletPage }
export { Wallet as WalletPage };
