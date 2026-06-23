/**
 * UserSettings
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
import { DeletionZone } from '../../profile/components/DeletionZone';

export function UserSettings() {
  const { updateSession, logout: contextLogout } = useSession();
  const nav = useNavigate();
  const [user, setUser] = useState(() => storage.load('session', {}));
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('slashit_user_prefs') || '{}'); } catch(e) { return {}; }
  });
  const [pw, setPw] = useState({ current:'', newPw:'', confirm:'' });
  const [savingPw, setSavingPw] = useState(false);
  const [tab, setTab] = useState('notifs');
  const savePrefs = (next) => { setPrefs(next); localStorage.setItem('slashit_user_prefs', JSON.stringify(next)); toast.success('Saved'); };
  const toggle = (key, def=true) => savePrefs({...prefs, [key]: prefs[key]===undefined ? !def : !prefs[key]});
  const get = (key, def=true) => prefs[key]===undefined ? def : prefs[key];
  const changePassword = async () => {
    if (!pw.current) { toast.error('Enter current password'); return; }
    if (pw.newPw.length < 6) { toast.error('New password must be 6+ chars'); return; }
    if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPw(true); await new Promise(r=>setTimeout(r,800));
    const updated = { ...user, password: pw.newPw };
    updateSession(updated);
    setPw({current:'',newPw:'',confirm:''}); toast.success('Password changed ✓'); setSavingPw(false);
  };
  const notifToggles = [
    { key:'notif_slash_full',    label:'Slash Full',           sub:'When your slash reaches all slots',     def:true },
    { key:'notif_slot_joined',   label:'Member Joined',        sub:'When someone joins your slash',         def:true },
    { key:'notif_ready_pickup',  label:'Ready for Pickup',     sub:'When your order is ready to collect',   def:true },
    { key:'notif_chat_message',  label:'Hub Attendant Reply',  sub:'When your hub attendant replies to you',def:true },
    { key:'notif_price_jump',    label:'Price Jump Poll',      sub:'When admin requests a price change',    def:true },
    { key:'notif_kyc_update',    label:'KYC Status',           sub:'Approval or rejection of your KYC',    def:true },
    { key:'notif_refund',        label:'Wallet Credits',       sub:'Refunds and earning notifications',     def:true },
    { key:'notif_promo',         label:'Promotions',           sub:'New deals and platform news',           def:false },
  ];
  const privToggles = [
    { key:'priv_show_name',   label:'Show my name on slashes',  sub:'Others can see who created a slash',   def:true },
    { key:'priv_show_hostel', label:'Show hostel on banter',    sub:'Hostel badge visible on banter board', def:true },
  ];
  const tabs = [{id:'notifs',label:'Notifications'},{id:'privacy',label:'Privacy'},{id:'security',label:'Security'},{id:'fees',label:'Fees'}];
  const cfg2 = getPlatformConfig();
  const F2 = getFlags();
  const Toggle2 = ({on,onToggle}) => (
    <button onClick={onToggle} style={{width:44,height:24,borderRadius:12,background:on?'#4f46e5':'#cbd5e1',border:'none',position:'relative',transition:'background .2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?'calc(100% - 21px)':3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
    </button>
  );
  return (
    <div style={{background:'#f0f4ff',minHeight:'100vh'}}>
      <div style={{background:'linear-gradient(135deg,#4f46e5,#6366f1)',padding:'52px 16px 24px'}}>
        <button onClick={()=>nav(-1)} style={{color:'rgba(255,255,255,.85)',background:'none',fontSize:22,marginBottom:10,display:'block'}}>←</button>
        <div style={{fontSize:20,fontWeight:900,color:'#fff'}}>Settings</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.75)',marginTop:4}}>Manage your preferences</div>
      </div>
      <div style={{display:'flex',background:'#fff',borderBottom:'2px solid #e2e8f0'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'14px 8px',fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?'#4f46e5':'#64748b',background:'none',border:'none',borderBottom:tab===t.id?'3px solid #4f46e5':'3px solid transparent'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{padding:'16px 16px 32px'}}>
        {tab==='notifs' && (
          <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>
            {notifToggles.map((n,i)=>(
              <div key={n.key} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:i<notifToggles.length-1?'1px solid #f1f5f9':'none'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{n.label}</div>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{n.sub}</div>
                </div>
                <Toggle2 on={get(n.key,n.def)} onToggle={()=>toggle(n.key,n.def)}/>
              </div>
            ))}
          </div>
        )}
        {tab==='privacy' && (
          <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>
            {privToggles.map((n,i)=>(
              <div key={n.key} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:i<privToggles.length-1?'1px solid #f1f5f9':'none'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{n.label}</div>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{n.sub}</div>
                </div>
                <Toggle2 on={get(n.key,n.def)} onToggle={()=>toggle(n.key,n.def)}/>
              </div>
            ))}
          </div>
        )}
        {tab==='fees' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>
              <div style={{padding:'14px 16px',background:'linear-gradient(135deg,#1e3a8a,#2563eb)'}}>
                <div style={{fontSize:13,fontWeight:800,color:'#fff'}}>Platform Fees</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:2}}>Charged on every slash join or create. Fees are locked at the time you join — they never change on existing slashes.</div>
              </div>
              {[
                ['💳 Processing Fee', `₦${(cfg2.processingFee||100).toLocaleString()}`, 'Flat fee charged per slot on every transaction'],
                ['🛡️ Insurance Pool', F2.insurance ? `${cfg2.insuranceRate||1}% of slot price` : 'OFF (feature disabled)', 'Pooled protection fund — refunded if delivery fails'],
                ['⚠️ Cancellation Penalty', `${cfg2.cancellationPenaltyPct||7}% of slot price`, 'Deducted if you cancel after joining'],
              ].map(([l,v,s],i)=>(
                <div key={l} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>{l}</div>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{s}</div>
                  </div>
                  <div style={{fontWeight:800,fontSize:14,color:'#2563eb',flexShrink:0}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>
              <div style={{padding:'14px 16px',background:'linear-gradient(135deg,#c2410c,#ea580c)'}}>
                <div style={{fontSize:13,fontWeight:800,color:'#fff'}}>🚚 Transport Fee</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:2}}>{F2.transportation !== false ? 'Active — charged per slash based on product & hub' : 'Currently OFF — not charged'}</div>
              </div>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
                <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>Your Hub</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{user.hubName||'No hub set'} · {user.city||''}</div>
              </div>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9'}}>
                <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>How it works</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:4,lineHeight:1.6}}>Transport cost is the total logistics cost to deliver a product to your hub, divided equally among all slot members. It varies by product and hub. The exact amount is shown in the charge breakdown before you confirm any join.</div>
              </div>
              <div style={{padding:'14px 16px'}}>
                <div style={{fontSize:11,color:'#64748b',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px 12px',lineHeight:1.5}}>
                  💡 <strong style={{color:'#15803d'}}>Tip:</strong> Check the charge breakdown on any slash before joining — it always shows the exact transport fee, processing fee, and total you will pay.
                </div>
              </div>
            </div>
          </div>
        )}
        {tab==='security' && (
          <div style={{background:'#fff',borderRadius:16,padding:20,boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#1e293b',marginBottom:16}}>🔑 Change Password</div>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
              {[['Current Password','current'],['New Password','newPw'],['Confirm New Password','confirm']].map(([label,field])=>(
                <div key={field}>
                  <div style={{fontSize:11,fontWeight:600,color:'#64748b',marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div>
                  <input type="password" value={pw[field]} onChange={e=>setPw(p=>({...p,[field]:e.target.value}))}
                    style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid #e2e8f0',fontSize:14,boxSizing:'border-box'}}/>
                </div>
              ))}
              <button onClick={changePassword} disabled={savingPw}
                style={{background:'#4f46e5',color:'#fff',fontWeight:700,padding:'13px',borderRadius:12,border:'none',fontSize:14,marginTop:4,opacity:savingPw?0.6:1,cursor:'pointer'}}>
                {savingPw?'Saving…':'Change Password'}
              </button>
            </div>
            <div style={{paddingTop:20,borderTop:'1px solid #f1f5f9',marginBottom:24}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>Signed in as <strong>{user.email}</strong></div>
              <button onClick={()=>{ contextLogout(); nav('/login'); }}
                style={{background:'#fee2e2',color:'#dc2626',fontWeight:700,padding:'11px 20px',borderRadius:12,border:'none',fontSize:13,cursor:'pointer'}}>
                Sign Out
              </button>
            </div>
            <DeletionZone user={user} nav={nav}/>
          </div>
        )}
      </div>
      <LegalFooter />
    </div>
  );
}

// Re-export alias so App.jsx can import { UserSettingsPage }
export { UserSettings as UserSettingsPage };
