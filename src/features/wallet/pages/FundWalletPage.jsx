/**
 * FundWallet
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

export function FundWallet() {
  const { updateSession } = useSession();
  const nav = useNavigate();
  const [user] = useState(() => storage.load('session', {}));
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = getPlatformConfig();
  const MIN_FUND = cfg.minWalletFund || 100;
  const QUICK = [5000, 10000, 20000, 50000, 100000];
  const num = parseInt(String(amount).replace(/,/g, '')) || 0;

  const copyAcct = () => {
    const n = user.accountNumber || user.virtualAccountNumber || '';
    try { navigator.clipboard.writeText(n); } catch(e){}
    setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000);
  };

  const [fundRef, setFundRef] = useState(null);
  const confirm = async () => {
    if (num < MIN_FUND) { toast.error(`Minimum transfer is ${fmt(MIN_FUND)}`); return; }
    setLoading(true); await delay(1500);
    const ref = 'MN' + Date.now();
    const updated = { ...user, walletBalance: (user.walletBalance || 0) + num };
    updateSession(updated);
    const txns = storage.load('transactions', []);
    storage.save('transactions', [{ id: 'txn-' + Date.now(), type: 'credit', amount: num, description: 'Bank Transfer', reference: ref, createdAt: new Date().toISOString() }, ...txns]);
    setFundRef(ref); setLoading(false);
  };

  const acctRows = [
    { label: 'Bank (Virtual)', value: user.accountBank || 'Wema bank' },
    { label: 'Account Number', value: user.accountNumber || user.virtualAccountNumber || 'Pending — complete KYC first', mono: !!(user.accountNumber||user.virtualAccountNumber), canCopy: !!(user.accountNumber||user.virtualAccountNumber) },
    { label: 'Account Name', value: user.accountName || `SLASHIT / ${(user.name||'').split(' ')[0].toUpperCase()}` },
  ];

  // Success screen — show after funding
  if (fundRef) return (
    <div style={{ minHeight:'100vh', background:'#eff6ff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32 }}>
      <div style={{ fontSize:72, marginBottom:20 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:900, color:'#1e3a8a', marginBottom:8, textAlign:'center' }}>Transfer Confirmed</div>
      <div style={{ fontSize:14, color:'#1d4ed8', marginBottom:24, textAlign:'center', lineHeight:1.6 }}>₦{num.toLocaleString()} has been added to your wallet.</div>
      <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', width:'100%', maxWidth:360, border:'1.5px solid #bfdbfe', marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Transaction Reference</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:800, color:'#1e293b', letterSpacing:'1px' }}>{fundRef}</span>
          <button onClick={()=>{try{navigator.clipboard.writeText(fundRef);}catch(e){}toast.success('Ref copied!');}} style={{ fontSize:10, background:'#eff6ff', color:'#1d4ed8', fontWeight:700, padding:'3px 9px', borderRadius:6, border:'none', cursor:'pointer' }}>Copy</button>
        </div>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>Keep this for your records. Use it to trace any issues with this funding.</div>
      </div>
      <button onClick={() => {
        const html = `<!DOCTYPE html><html><head><title>SlashIt Receipt</title><style>body{font-family:sans-serif;max-width:420px;margin:40px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px}h2{color:#1e3a8a}table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.val{text-align:right;font-weight:700}.total td{font-size:16px;font-weight:900;border-top:2px solid #e2e8f0;border-bottom:none}.footer{margin-top:24px;font-size:11px;color:#94a3b8;text-align:center}</style></head><body><h2>🧾 SlashIt Wallet Funding Receipt</h2><table><tr><td>Reference</td><td class="val">${fundRef}</td></tr><tr><td>Amount Funded</td><td class="val">₦${num.toLocaleString()}</td></tr><tr><td>Payment Method</td><td class="val">Bank Transfer</td></tr><tr><td>Account Name</td><td class="val">${user.accountName||'SLASHIT / '+user.name}</td></tr><tr><td>Account Number</td><td class="val">${user.accountNumber||user.virtualAccountNumber||'N/A'}</td></tr><tr><td>Bank</td><td class="val">${user.accountBank||'Moniepoint MFB'}</td></tr><tr><td>Date</td><td class="val">${new Date().toLocaleString('en-NG')}</td></tr><tr class="total"><td>Status</td><td class="val" style="color:#16a34a">✅ Confirmed</td></tr></table><p class="footer">SlashIt Group Buying Platform · Payments processed through supported provider infrastructure<br/>Funds held securely in escrow until delivery is verified</p></body></html>`;
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `SlashIt-Receipt-${fundRef}.html`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast.success('Receipt downloaded!');
      }} style={{ background:'#fff', color:'#1d4ed8', fontWeight:700, fontSize:14, padding:'12px 32px', borderRadius:12, border:'2px solid #bfdbfe', cursor:'pointer', width:'100%', maxWidth:360, marginBottom:12 }}>⬇ Download Receipt</button>
      <button onClick={()=>nav('/wallet')} style={{ background:'#2563eb', color:'#fff', fontWeight:800, fontSize:16, padding:'14px 48px', borderRadius:14, border:'none', cursor:'pointer', width:'100%', maxWidth:360 }}>← Back to Wallet</button>
    </div>
  );

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '52px 16px 24px' }}>
        <button onClick={() => nav(-1)} style={{ color: 'rgba(255,255,255,.85)', background: 'none', fontSize: 22, marginBottom: 10, display: 'block' }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Fund Wallet</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4 }}>Transfer to this account to add funds instantly</div>
      </div>

      {/* Static Monnify Account */}
      <div style={{ margin: '0 16px', marginTop: -16, borderRadius: 16, padding: 16, position: 'relative', zIndex: 2, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Your Static Account — Fund by Transfer</div>
        {acctRows.map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: row.mono ? 16 : 13, fontWeight: 700, color: '#1e293b', fontFamily: row.mono ? 'monospace' : 'inherit', letterSpacing: row.mono ? '1.5px' : 'normal' }}>{row.value}</span>
              {row.canCopy && (
                <button onClick={copyAcct} style={{ fontSize: 10, background: copied ? '#dcfce7' : '#dbeafe', color: copied ? '#16a34a' : '#1d4ed8', fontWeight: 700, padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, background: '#dcfce7', borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Transfer from any Nigerian bank · No charges · Instant settlement</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
          Payment infrastructure being implemented through supported provider channels
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quick amounts */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Quick Amounts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {QUICK.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                style={{ padding: '12px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, border: `2px solid ${num===a?'#16a34a':'#e2e8f0'}`, background: num===a?'#f0fdf4':'#fff', color: num===a?'#15803d':'#374151', transition: 'all .15s' }}>
                {fmt(a)}
              </button>
            ))}
            <button onClick={() => setAmount('')}
              style={{ padding: '12px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, border: '2px dashed #e2e8f0', background: '#fff', color: '#9ca3af' }}>
              Custom
            </button>
          </div>
        </div>

        {/* Custom input */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Or Enter Amount</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>₦</span>
            <input type="tel" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g,''))}
              placeholder="0" style={{ paddingLeft: 36, fontSize: 18, fontWeight: 700 }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Minimum {fmt(MIN_FUND)} · Updates in ~15 seconds</div>
        </div>

        {num > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#15803d' }}>
            After transfer: <strong>{fmt((user.walletBalance || 0) + num)}</strong>
          </div>
        )}

        {/* Funding disclaimer */}
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 14px', fontSize:11, color:'#78350f', lineHeight:1.6 }}>
          ⚠️ <strong>Wallet Funding Disclaimer:</strong> Funds added to your wallet are held securely on SlashIt. They are released to suppliers only after delivery is verified by a hub attendant. Once used to join a slash, funds are non-withdrawable. Refunds for cancelled or dissolved slashes are processed within 24–48 hours.
        </div>

        <Btn full loading={loading} disabled={num < MIN_FUND} onClick={confirm}>
          I&apos;ve Made the Transfer — Verify ✓
        </Btn>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          Bank transfer · Payment infrastructure being implemented through supported provider channels
        </div>
      </div>
    </div>
  );
}

// Re-export alias so App.jsx can import { FundWalletPage }
export { FundWallet as FundWalletPage };
